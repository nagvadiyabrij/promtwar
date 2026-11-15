import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { runProactiveReminderChecks } from '../services/cronService.js';
import { sendProactiveEmail, generateUpcomingDoseEmail } from '../services/emailService.js';

const router = express.Router();

// 1. Get recent email reminder dispatch logs
router.get('/logs', authenticateToken, (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = db.prepare(`
    SELECT * FROM notifications_email_logs
    ORDER BY sent_at DESC
    LIMIT ?
  `).all(limit);

  return res.json({ success: true, logs });
});

// 2. Get specific email preview by ID
router.get('/preview/:id', authenticateToken, (req, res) => {
  const emailLog = db.prepare('SELECT * FROM notifications_email_logs WHERE id = ?').get(req.params.id);
  if (!emailLog) {
    return res.status(404).json({ success: false, error: 'Email log not found.' });
  }

  return res.json({ success: true, email: emailLog });
});

// 3. Trigger Proactive Reminder Cron Engine Manually (High-value feature for live Hackathon demonstrations!)
router.post('/run-cron', authenticateToken, async (req, res) => {
  try {
    const summary = await runProactiveReminderChecks();
    return res.json({
      success: true,
      message: 'Proactive reminder engine executed successfully!',
      summary
    });
  } catch (err) {
    console.error('[Reminders API] Error executing cron:', err);
    return res.status(500).json({ success: false, error: 'Failed to run proactive checks.' });
  }
});

// 4. Send Manual Immediate Reminder Email to Elderly or Caregiver
router.post('/send-immediate', authenticateToken, async (req, res) => {
  const { elderly_id, recipient_email, recipient_name, message_type = 'upcoming_dose' } = req.body;

  const targetElderlyId = elderly_id || req.user.elderlyProfileId;
  const elder = db.prepare('SELECT * FROM elderly_profiles WHERE id = ?').get(targetElderlyId);

  if (!elder) {
    return res.status(404).json({ success: false, error: 'Elderly profile not found.' });
  }

  const activeMeds = db.prepare('SELECT name, dosage, timing_slots, food_instruction FROM medications WHERE elderly_id = ? AND is_active = 1').all(elder.id);

  const formattedMeds = activeMeds.map(m => ({
    name: m.name,
    dosage: m.dosage,
    timing: 'Today',
    instruction: m.food_instruction
  }));

  const html = generateUpcomingDoseEmail({
    elderlyName: elder.full_name,
    medicationList: formattedMeds
  });

  const emailResult = await sendProactiveEmail({
    elderlyId: elder.id,
    recipientEmail: recipient_email || req.user.email,
    recipientName: recipient_name || req.user.name,
    type: message_type,
    subject: `🔔 Immediate Healthcare Reminder: Scheduled Medications for ${elder.full_name}`,
    htmlContent: html,
    plainText: `Reminder for ${elder.full_name}: Please take your scheduled medications.`
  });

  return res.json({
    success: true,
    message: `Proactive reminder email sent to ${emailResult.recipientEmail}!`,
    dispatchedEmail: emailResult
  });
});

export default router;
