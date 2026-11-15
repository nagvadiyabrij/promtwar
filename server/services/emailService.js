import nodemailer from 'nodemailer';
import db from '../db.js';
import crypto from 'node:crypto';

let transporter = null;

// Initialize Nodemailer transporter if SMTP credentials are provided
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[EmailService] SMTP transporter configured for host:', process.env.SMTP_HOST);
  } catch (err) {
    console.warn('[EmailService] Could not initialize SMTP transporter:', err.message);
  }
} else {
  console.log('[EmailService] Running in Smart Simulation Mode (Email previews stored to DB & live viewable in UI)');
}

/**
 * Send an email (via real SMTP if available, or logged to database with full HTML preview)
 */
export async function sendProactiveEmail({
  elderlyId = null,
  recipientEmail,
  recipientName,
  type, // 'missed_medication' | 'upcoming_dose' | 'appointment_reminder' | 'low_refill' | 'emergency_sos'
  subject,
  htmlContent,
  plainText = ''
}) {
  const logId = 'eml-' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  let deliveryStatus = 'dispatched_simulated';

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"AuraCare Health Alert" <alerts@auracare.health>',
        to: `"${recipientName}" <${recipientEmail}>`,
        subject,
        text: plainText || subject,
        html: htmlContent,
      });
      deliveryStatus = 'delivered_smtp';
      console.log(`[EmailService] SMTP email delivered to ${recipientEmail}: ${subject}`);
    } catch (err) {
      console.error(`[EmailService] SMTP delivery failed for ${recipientEmail}:`, err.message);
      deliveryStatus = 'failed_smtp';
    }
  }

  // Always log to persistent database for full transparency and UI previewing
  try {
    const insertLog = db.prepare(`
      INSERT INTO notifications_email_logs (
        id, elderly_id, recipient_email, recipient_name, type, subject, content, status, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertLog.run(
      logId,
      elderlyId,
      recipientEmail,
      recipientName,
      type,
      subject,
      htmlContent,
      deliveryStatus,
      now
    );
  } catch (err) {
    console.error('[EmailService] Error logging email to DB:', err.message);
  }

  return {
    id: logId,
    recipientEmail,
    recipientName,
    type,
    subject,
    status: deliveryStatus,
    sentAt: now,
    htmlContent
  };
}

/**
 * HTML Email Templates
 */
export function generateMissedMedicationEmail({ elderlyName, medicationName, dosage, scheduledTime, minutesOverdue = 45, emergencyPhone }) {
  return `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; padding: 24px; text-align: center;">
        <span style="font-size: 32px; display: inline-block; margin-bottom: 8px;">⚠️</span>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Urgent Adherence Alert: Missed Dose</h1>
        <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">AuraCare Proactive Care Monitoring</p>
      </div>
      
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">
          <strong>Attention Care Circle Member,</strong>
        </p>
        <p style="font-size: 15px; color: #475569;">
          Our system detected that <strong>${elderlyName}</strong> has not confirmed their scheduled medication within the recommended safety window:
        </p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Medication:</td>
              <td style="font-weight: 700; color: #991b1b; padding: 4px 0;">${medicationName} (${dosage})</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Scheduled Dose:</td>
              <td style="font-weight: 600; color: #1e293b; padding: 4px 0;">Today at ${scheduledTime}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Time Overdue:</td>
              <td style="font-weight: 600; color: #dc2626; padding: 4px 0;">~${minutesOverdue} minutes past scheduled time</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; color: #475569;">
          <strong>Recommended Action:</strong> Please contact ${elderlyName} directly or log into the AuraCare portal to confirm whether the dose was taken or if assistance is needed.
        </p>
        
        <div style="text-align: center; margin: 28px 0 16px;">
          <a href="http://localhost:3000/caregiver" style="background: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 600; border-radius: 8px; font-size: 15px; display: inline-block;">
            Open Caregiver Dashboard
          </a>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
        Emergency Contact Phone: ${emergencyPhone || 'Available on profile'} | AuraCare Automated Healthcare Safeguard
      </div>
    </div>
  `;
}

export function generateUpcomingDoseEmail({ elderlyName, medicationList = [] }) {
  const medItems = medicationList.map(m => `
    <li style="margin-bottom: 8px; font-size: 15px;">
      <strong>${m.name}</strong> - ${m.dosage} 
      <span style="color: #0d9488; font-weight: 500;">(${m.timing})</span>
      <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Instruction: ${m.instruction || 'Take with water'}</div>
    </li>
  `).join('');

  return `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #ccfbf1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.08);">
      <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); color: #ffffff; padding: 24px; text-align: center;">
        <span style="font-size: 32px; display: inline-block; margin-bottom: 8px;">🔔</span>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Upcoming Medication Routine</h1>
        <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Friendly Reminder for ${elderlyName}</p>
      </div>
      
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">Good day <strong>${elderlyName}</strong>,</p>
        <p style="font-size: 15px; color: #475569;">
          Here are your scheduled medications coming up shortly:
        </p>
        
        <ul style="background: #f0fdfa; border-radius: 8px; padding: 18px 18px 18px 36px; border: 1px solid #99f6e4;">
          ${medItems}
        </ul>
        
        <div style="text-align: center; margin: 28px 0 16px;">
          <a href="http://localhost:3000/elderly" style="background: #0d9488; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 700; border-radius: 8px; font-size: 16px; display: inline-block;">
            Mark as Taken in 1-Click
          </a>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
        AuraCare | Empowering Senior Independence with Collaborative Family Care
      </div>
    </div>
  `;
}

export function generateAppointmentReminderEmail({ elderlyName, doctorName, specialty, hospitalClinic, date, time, location, reason }) {
  return `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e7ff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);">
      <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; padding: 24px; text-align: center;">
        <span style="font-size: 32px; display: inline-block; margin-bottom: 8px;">🗓️</span>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Upcoming Doctor Appointment</h1>
        <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Healthcare Schedule for ${elderlyName}</p>
      </div>
      
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 15px; color: #475569;">
          This is a proactive reminder about an upcoming medical consultation:
        </p>
        
        <div style="background: #eef2ff; border-left: 4px solid #6366f1; border-radius: 6px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Doctor:</td>
              <td style="font-weight: 700; color: #1e1b4b; padding: 6px 0;">${doctorName} (${specialty})</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Facility:</td>
              <td style="font-weight: 600; color: #1e293b; padding: 6px 0;">${hospitalClinic}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Date & Time:</td>
              <td style="font-weight: 700; color: #4338ca; padding: 6px 0;">${date} at ${time}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Location:</td>
              <td style="color: #334155; padding: 6px 0;">${location || 'Main Medical Center'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Purpose:</td>
              <td style="color: #334155; padding: 6px 0;">${reason || 'Routine consultation'}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 28px 0 16px;">
          <a href="http://localhost:3000/appointments" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 600; border-radius: 8px; font-size: 15px; display: inline-block;">
            View Appointment Details & Sync Google Calendar
          </a>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
        AuraCare Health Calendar | Proactive Care Notifications
      </div>
    </div>
  `;
}

export function generateEmergencySOSEmail({ elderlyName, senderName, location = 'Home Residence', emergencyPhone, allergies, conditions }) {
  return `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #b91c1c; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(185, 28, 28, 0.25);">
      <div style="background: #b91c1c; color: #ffffff; padding: 24px; text-align: center;">
        <span style="font-size: 40px; display: inline-block; margin-bottom: 8px;">🚨</span>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">EMERGENCY DISTRESS SOS TRIGGERED</h1>
        <p style="margin: 6px 0 0; opacity: 0.95; font-size: 15px;">Immediate Care Circle Alert for ${elderlyName}</p>
      </div>
      
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="font-size: 16px; color: #991b1b; font-weight: 700; margin-top: 0;">
          An Emergency SOS distress signal was triggered by ${elderlyName} on AuraCare!
        </p>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Patient:</td>
              <td style="font-weight: 700; color: #1e293b; padding: 6px 0;">${elderlyName}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Registered Location:</td>
              <td style="font-weight: 600; color: #1e293b; padding: 6px 0;">${location}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Emergency Phone:</td>
              <td style="font-weight: 700; color: #b91c1c; padding: 6px 0;">${emergencyPhone}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Known Conditions:</td>
              <td style="color: #334155; padding: 6px 0;">${conditions || 'None logged'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 6px 0;">Critical Allergies:</td>
              <td style="font-weight: 600; color: #dc2626; padding: 6px 0;">${allergies || 'None logged'}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 15px; font-weight: 600; color: #1e293b;">
          Please immediately contact the elder or dispatch local emergency responders if necessary.
        </p>
      </div>
      
      <div style="background: #450a0a; color: #fecaca; padding: 14px 24px; text-align: center; font-size: 13px;">
        AuraCare Emergency Broadcast System | Triggered at ${new Date().toLocaleTimeString()}
      </div>
    </div>
  `;
}
