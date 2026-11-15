import express from 'express';
import crypto from 'node:crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all medical appointments for an elderly profile
router.get('/', authenticateToken, (req, res) => {
  const elderlyId = req.query.elderlyId || req.user.elderlyProfileId;

  let targetId = elderlyId;
  if (!targetId) {
    const defaultElder = db.prepare('SELECT id FROM elderly_profiles LIMIT 1').get();
    if (!defaultElder) return res.json({ success: true, appointments: [] });
    targetId = defaultElder.id;
  }

  const appointments = db.prepare(`
    SELECT * FROM medical_appointments
    WHERE elderly_id = ?
    ORDER BY appointment_date ASC, appointment_time ASC
  `).all(targetId);

  // Augment each appointment with Google Calendar link
  const enhanced = appointments.map(apt => {
    const gCalUrl = generateGoogleCalendarUrl(apt);
    return {
      ...apt,
      googleCalendarUrl: gCalUrl
    };
  });

  return res.json({ success: true, appointments: enhanced });
});

// Helper to construct Google Calendar web link
function generateGoogleCalendarUrl(apt) {
  try {
    const title = encodeURIComponent(`Dr. ${apt.doctor_name} (${apt.specialty}) - Medical Consultation`);
    const details = encodeURIComponent(`Patient consultation at ${apt.hospital_clinic}.\nReason: ${apt.reason_for_visit || 'Routine checkup'}\nClinical Notes: ${apt.clinical_notes || 'None'}`);
    const location = encodeURIComponent(`${apt.hospital_clinic}, ${apt.location || ''}`);

    // Parse appointment_date (YYYY-MM-DD)
    const cleanDate = apt.appointment_date.replace(/-/g, '');
    const startTime = cleanDate + 'T090000Z';
    const endTime = cleanDate + 'T100000Z';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  } catch {
    return 'https://calendar.google.com';
  }
}

// 2. Add a new medical appointment
router.post('/', authenticateToken, (req, res) => {
  const {
    elderly_id, doctor_name, specialty, hospital_clinic,
    appointment_date, appointment_time, location,
    reason_for_visit, clinical_notes
  } = req.body;

  const targetElderlyId = elderly_id || req.user.elderlyProfileId;
  if (!targetElderlyId) {
    return res.status(400).json({ success: false, error: 'Elderly profile ID is required.' });
  }

  if (!doctor_name || !appointment_date || !appointment_time) {
    return res.status(400).json({ success: false, error: 'Doctor name, date, and time are required.' });
  }

  const aptId = 'apt-' + crypto.randomUUID().slice(0, 8);

  try {
    const insertApt = db.prepare(`
      INSERT INTO medical_appointments (
        id, elderly_id, doctor_name, specialty, hospital_clinic,
        appointment_date, appointment_time, location, reason_for_visit,
        status, reminder_sent, clinical_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', 0, ?)
    `);

    insertApt.run(
      aptId, targetElderlyId, doctor_name.trim(), specialty || 'General Physician',
      hospital_clinic || 'City Medical Clinic', appointment_date, appointment_time,
      location || null, reason_for_visit || null, clinical_notes || null
    );

    // Audit log
    db.prepare(`
      INSERT INTO activity_audit_logs (id, user_id, user_name, action, details, ip_address)
      VALUES (?, ?, ?, 'APPOINTMENT_SCHEDULED', ?, ?)
    `).run('aud-' + crypto.randomUUID().slice(0, 8), req.user.id, req.user.name, `Scheduled consultation with ${doctor_name} on ${appointment_date}`, req.ip);

    return res.status(201).json({
      success: true,
      message: `Appointment with ${doctor_name} scheduled for ${appointment_date}.`,
      appointmentId: aptId
    });
  } catch (err) {
    console.error('[Appointments API] Error:', err);
    return res.status(500).json({ success: false, error: 'Could not schedule appointment.' });
  }
});

// 3. Download .ics iCalendar file for direct import to Apple/Outlook/Google Calendar
router.get('/:id/calendar.ics', (req, res) => {
  const apt = db.prepare('SELECT * FROM medical_appointments WHERE id = ?').get(req.params.id);
  if (!apt) {
    return res.status(404).send('Appointment not found');
  }

  const icsDate = apt.appointment_date.replace(/-/g, '');
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AuraCare//Elderly Health Platform//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:auracare-${apt.id}@auracare.health`,
    `DTSTAMP:${icsDate}T090000Z`,
    `DTSTART:${icsDate}T090000Z`,
    `DTEND:${icsDate}T100000Z`,
    `SUMMARY:Medical Appointment - Dr. ${apt.doctor_name} (${apt.specialty})`,
    `DESCRIPTION:Consultation at ${apt.hospital_clinic}. Reason: ${apt.reason_for_visit || 'Follow-up'}`,
    `LOCATION:${apt.hospital_clinic}, ${apt.location || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="appointment-${apt.id}.ics"`);
  return res.send(icsContent);
});

// 4. Health Routines & Vitals Tracker
router.get('/vitals', authenticateToken, (req, res) => {
  const elderlyId = req.query.elderlyId || req.user.elderlyProfileId;

  let targetId = elderlyId;
  if (!targetId) {
    const defaultElder = db.prepare('SELECT id FROM elderly_profiles LIMIT 1').get();
    if (!defaultElder) return res.json({ success: true, vitals: [] });
    targetId = defaultElder.id;
  }

  const vitals = db.prepare(`
    SELECT * FROM health_routines_vitals
    WHERE elderly_id = ?
    ORDER BY recorded_at DESC
    LIMIT 50
  `).all(targetId);

  return res.json({ success: true, vitals });
});

// 5. Record new vital
router.post('/vitals', authenticateToken, (req, res) => {
  const { elderly_id, type, value, unit, notes } = req.body;

  const targetElderlyId = elderly_id || req.user.elderlyProfileId;
  if (!targetElderlyId) {
    return res.status(400).json({ success: false, error: 'Elderly profile ID is required.' });
  }

  if (!type || !value) {
    return res.status(400).json({ success: false, error: 'Type and value are required.' });
  }

  const vitalId = 'vit-' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO health_routines_vitals (
      id, elderly_id, type, value, unit, recorded_at, recorded_by_name, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(vitalId, targetElderlyId, type, value, unit || '', now, req.user.name, notes || null);

  return res.status(201).json({
    success: true,
    message: `Recorded ${type.replace('_', ' ')}: ${value} ${unit || ''}`,
    vitalId
  });
});

export default router;
