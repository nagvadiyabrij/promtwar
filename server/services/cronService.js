import db from '../db.js';
import {
  sendProactiveEmail,
  generateMissedMedicationEmail,
  generateAppointmentReminderEmail,
  generateUpcomingDoseEmail
} from './emailService.js';

let cronInterval = null;

export async function runProactiveReminderChecks() {
  console.log('[ReminderCron] Running proactive medication & appointment checks...');
  const results = {
    missedDosesProcessed: 0,
    appointmentsReminded: 0,
    refillsAlerted: 0,
    timestamp: new Date().toISOString()
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeVal = currentHours * 60 + currentMinutes;

  try {
    // 1. Process Missed Doses: Find pending logs scheduled for today whose time is overdue by > 30 minutes
    const pendingLogs = db.prepare(`
      SELECT 
        l.id as log_id, l.scheduled_time, l.scheduled_date,
        m.name as medication_name, m.dosage, m.food_instruction,
        e.id as elderly_id, e.full_name as elderly_name, e.emergency_contact_phone
      FROM adherence_logs l
      JOIN medications m ON l.medication_id = m.id
      JOIN elderly_profiles e ON l.elderly_id = e.id
      WHERE l.scheduled_date = ? AND l.status = 'pending'
    `).all(todayStr);

    for (const log of pendingLogs) {
      // Parse scheduled time (e.g. '08:00' or '13:00')
      const timeParts = log.scheduled_time.split(':');
      if (timeParts.length === 2) {
        const scheduledTimeVal = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);
        // If current time is > 30 minutes past scheduled time
        if (currentTimeVal - scheduledTimeVal >= 30) {
          console.log(`[ReminderCron] Marking dose as missed: ${log.medication_name} for ${log.elderly_name}`);
          
          // Update log status to missed
          db.prepare(`UPDATE adherence_logs SET status = 'missed', action_timestamp = CURRENT_TIMESTAMP, notes = 'Auto-detected missed dose by AuraCare Cron' WHERE id = ?`).run(log.log_id);
          results.missedDosesProcessed++;

          // Find caregivers and family in care circle who have receive_alerts = 1
          const circleMembers = db.prepare(`
            SELECT u.email, u.name, c.relationship 
            FROM care_circle c
            JOIN users u ON c.user_id = u.id
            WHERE c.elderly_id = ? AND c.receive_alerts = 1
          `).all(log.elderly_id);

          for (const member of circleMembers) {
            const emailHtml = generateMissedMedicationEmail({
              elderlyName: log.elderly_name,
              medicationName: log.medication_name,
              dosage: log.dosage,
              scheduledTime: log.scheduled_time,
              minutesOverdue: currentTimeVal - scheduledTimeVal,
              emergencyPhone: log.emergency_contact_phone
            });

            await sendProactiveEmail({
              elderlyId: log.elderly_id,
              recipientEmail: member.email,
              recipientName: member.name,
              type: 'missed_medication',
              subject: `⚠️ URGENT ADHERENCE ALERT: ${log.elderly_name} missed scheduled ${log.medication_name}`,
              htmlContent: emailHtml,
              plainText: `Urgent: ${log.elderly_name} missed scheduled ${log.medication_name} at ${log.scheduled_time}.`
            });
          }
        }
      }
    }

    // 2. Check Upcoming Doctor Appointments (within the next 3 days) where reminder_sent = 0
    const upcomingApts = db.prepare(`
      SELECT 
        a.id, a.doctor_name, a.specialty, a.hospital_clinic, a.appointment_date,
        a.appointment_time, a.location, a.reason_for_visit,
        e.id as elderly_id, e.full_name as elderly_name
      FROM medical_appointments a
      JOIN elderly_profiles e ON a.elderly_id = e.id
      WHERE a.status = 'upcoming' AND a.reminder_sent = 0
      AND a.appointment_date >= ?
    `).all(todayStr);

    for (const apt of upcomingApts) {
      // Send reminder to care circle
      const members = db.prepare(`
        SELECT u.email, u.name 
        FROM care_circle c
        JOIN users u ON c.user_id = u.id
        WHERE c.elderly_id = ? AND c.receive_alerts = 1
      `).all(apt.elderly_id);

      for (const m of members) {
        const emailHtml = generateAppointmentReminderEmail({
          elderlyName: apt.elderly_name,
          doctorName: apt.doctor_name,
          specialty: apt.specialty,
          hospitalClinic: apt.hospital_clinic,
          date: apt.appointment_date,
          time: apt.appointment_time,
          location: apt.location,
          reason: apt.reason_for_visit
        });

        await sendProactiveEmail({
          elderlyId: apt.elderly_id,
          recipientEmail: m.email,
          recipientName: m.name,
          type: 'appointment_reminder',
          subject: `🗓️ Healthcare Appointment Reminder: ${apt.elderly_name} with ${apt.doctor_name}`,
          htmlContent: emailHtml,
          plainText: `Upcoming appointment for ${apt.elderly_name} on ${apt.appointment_date} with ${apt.doctor_name}.`
        });
      }

      // Mark appointment reminder as sent
      db.prepare(`UPDATE medical_appointments SET reminder_sent = 1 WHERE id = ?`).run(apt.id);
      results.appointmentsReminded++;
    }

    // 3. Low Refill Stock Alerts
    const lowStockMeds = db.prepare(`
      SELECT m.id, m.name, m.dosage, m.stock_remaining, m.refill_threshold, e.id as elderly_id, e.full_name as elderly_name
      FROM medications m
      JOIN elderly_profiles e ON m.elderly_id = e.id
      WHERE m.is_active = 1 AND m.stock_remaining <= m.refill_threshold
    `).all();

    for (const med of lowStockMeds) {
      // Find primary caretaker
      const caregiver = db.prepare(`
        SELECT u.email, u.name FROM care_circle c
        JOIN users u ON c.user_id = u.id
        WHERE c.elderly_id = ? AND c.relationship = 'primary_caretaker'
        LIMIT 1
      `).get(med.elderly_id);

      if (caregiver) {
        // Only alert once per day (check if already alerted today)
        const recentAlert = db.prepare(`
          SELECT id FROM notifications_email_logs
          WHERE elderly_id = ? AND type = 'low_refill' AND date(sent_at) = ?
        `).get(med.elderly_id, todayStr);

        if (!recentAlert) {
          await sendProactiveEmail({
            elderlyId: med.elderly_id,
            recipientEmail: caregiver.email,
            recipientName: caregiver.name,
            type: 'low_refill',
            subject: `💊 Low Medication Stock: ${med.name} (${med.stock_remaining} doses remaining)`,
            htmlContent: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #fed7aa; border-radius: 8px;">
                <h2 style="color: #c2410c;">Pharmacy Refill Alert</h2>
                <p><strong>${med.elderly_name}</strong>'s supply of <strong>${med.name} (${med.dosage})</strong> has dropped to <strong>${med.stock_remaining}</strong> remaining doses (Threshold: ${med.refill_threshold}).</p>
                <p>Please contact the pharmacy to order a prescription refill.</p>
              </div>
            `,
            plainText: `Refill warning: ${med.name} for ${med.elderly_name} is running low (${med.stock_remaining} left).`
          });
          results.refillsAlerted++;
        }
      }
    }

    console.log('[ReminderCron] Checks completed successfully:', results);
  } catch (err) {
    console.error('[ReminderCron] Error in reminder checks:', err);
  }

  return results;
}

export function startReminderScheduler(intervalMinutes = 5) {
  if (cronInterval) {
    clearInterval(cronInterval);
  }
  const ms = intervalMinutes * 60 * 1000;
  console.log(`[ReminderCron] Starting scheduler with interval: ${intervalMinutes} minutes`);
  cronInterval = setInterval(runProactiveReminderChecks, ms);
}
