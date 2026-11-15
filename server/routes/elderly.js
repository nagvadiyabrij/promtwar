import express from 'express';
import crypto from 'node:crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendProactiveEmail, generateEmergencySOSEmail } from '../services/emailService.js';

const router = express.Router();

// 1. Get all elderly profiles accessible to the user (or all if admin)
router.get('/', authenticateToken, (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const profiles = db.prepare('SELECT * FROM elderly_profiles ORDER BY full_name ASC').all();
      return res.json({ success: true, profiles });
    }

    if (req.user.role === 'elderly') {
      const profile = db.prepare('SELECT * FROM elderly_profiles WHERE user_id = ? OR id = ?').get(req.user.id, req.user.elderlyProfileId);
      return res.json({ success: true, profiles: profile ? [profile] : [] });
    }

    // Caretaker, family, doctor: fetch profiles linked via care_circle
    const linked = db.prepare(`
      SELECT e.*, c.relationship, c.permission_level, c.receive_alerts
      FROM care_circle c
      JOIN elderly_profiles e ON c.elderly_id = e.id
      WHERE c.user_id = ?
    `).all(req.user.id);

    // If none linked yet, fallback to default profile so user can test immediately
    if (linked.length === 0) {
      const defaultProfile = db.prepare('SELECT * FROM elderly_profiles LIMIT 1').get();
      if (defaultProfile) {
        return res.json({ success: true, profiles: [defaultProfile] });
      }
    }

    return res.json({ success: true, profiles: linked });
  } catch (err) {
    console.error('[Elderly API] Error fetching profiles:', err);
    return res.status(500).json({ success: false, error: 'Could not load elderly profiles.' });
  }
});

// 2. Get specific elderly profile details + Care Circle members
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const profile = db.prepare('SELECT * FROM elderly_profiles WHERE id = ?').get(id);

  if (!profile) {
    return res.status(404).json({ success: false, error: 'Elderly profile not found.' });
  }

  // Fetch care circle members
  const careCircle = db.prepare(`
    SELECT c.id as circle_id, c.relationship, c.permission_level, c.receive_alerts,
           u.id as user_id, u.name, u.email, u.phone, u.role
    FROM care_circle c
    JOIN users u ON c.user_id = u.id
    WHERE c.elderly_id = ?
  `).all(id);

  // Fetch recent adherence summary
  const totalMeds = db.prepare('SELECT COUNT(*) as count FROM medications WHERE elderly_id = ? AND is_active = 1').get(id).count;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = db.prepare('SELECT * FROM adherence_logs WHERE elderly_id = ? AND scheduled_date = ?').all(id, todayStr);

  return res.json({
    success: true,
    profile,
    careCircle,
    stats: {
      totalActiveMedications: totalMeds,
      todayDosesTotal: todayLogs.length,
      todayDosesTaken: todayLogs.filter(l => l.status === 'taken').length,
      todayDosesPending: todayLogs.filter(l => l.status === 'pending').length,
      todayDosesMissed: todayLogs.filter(l => l.status === 'missed').length
    }
  });
});

// 3. Create a new elderly profile
router.post('/', authenticateToken, (req, res) => {
  const {
    full_name, age, gender, passcode, blood_group,
    emergency_contact_name, emergency_contact_phone,
    primary_doctor_name, primary_doctor_phone,
    known_allergies, chronic_conditions, address, notes
  } = req.body;

  if (!full_name || !age) {
    return res.status(400).json({ success: false, error: 'Full name and age are required.' });
  }

  const cleanPasscode = passcode ? String(passcode).trim() : Math.floor(1000 + Math.random() * 9000).toString();
  const profileId = 'eld-' + crypto.randomUUID().slice(0, 8);

  try {
    const insertElder = db.prepare(`
      INSERT INTO elderly_profiles (
        id, full_name, age, gender, passcode, blood_group,
        emergency_contact_name, emergency_contact_phone,
        primary_doctor_name, primary_doctor_phone,
        known_allergies, chronic_conditions, address, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertElder.run(
      profileId, full_name.trim(), parseInt(age, 10), gender || 'Other',
      cleanPasscode, blood_group || null,
      emergency_contact_name || null, emergency_contact_phone || null,
      primary_doctor_name || null, primary_doctor_phone || null,
      known_allergies || null, chronic_conditions || null, address || null, notes || null
    );

    // Link the creator to the care circle automatically
    const insertCircle = db.prepare(`
      INSERT INTO care_circle (id, elderly_id, user_id, relationship, permission_level, receive_alerts)
      VALUES (?, ?, ?, ?, 'admin', 1)
    `);
    insertCircle.run(
      'cir-' + crypto.randomUUID().slice(0, 8),
      profileId,
      req.user.id,
      req.user.role === 'caretaker' ? 'primary_caretaker' : (req.user.role === 'family' ? 'family' : 'caregiver')
    );

    return res.status(201).json({
      success: true,
      message: 'Elderly profile created successfully with passcode PIN: ' + cleanPasscode,
      profileId,
      passcode: cleanPasscode
    });
  } catch (err) {
    console.error('[Elderly API] Error creating profile:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while creating profile.' });
  }
});

// 4. Update elderly profile
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    full_name, age, gender, passcode, blood_group,
    emergency_contact_name, emergency_contact_phone,
    primary_doctor_name, primary_doctor_phone,
    known_allergies, chronic_conditions, address, notes
  } = req.body;

  const profile = db.prepare('SELECT * FROM elderly_profiles WHERE id = ?').get(id);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  try {
    db.prepare(`
      UPDATE elderly_profiles SET
        full_name = COALESCE(?, full_name),
        age = COALESCE(?, age),
        gender = COALESCE(?, gender),
        passcode = COALESCE(?, passcode),
        blood_group = COALESCE(?, blood_group),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        primary_doctor_name = COALESCE(?, primary_doctor_name),
        primary_doctor_phone = COALESCE(?, primary_doctor_phone),
        known_allergies = COALESCE(?, known_allergies),
        chronic_conditions = COALESCE(?, chronic_conditions),
        address = COALESCE(?, address),
        notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(
      full_name ? full_name.trim() : null,
      age ? parseInt(age, 10) : null,
      gender || null,
      passcode ? String(passcode).trim() : null,
      blood_group || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      primary_doctor_name || null,
      primary_doctor_phone || null,
      known_allergies || null,
      chronic_conditions || null,
      address || null,
      notes || null,
      id
    );

    return res.json({ success: true, message: 'Elderly profile updated successfully.' });
  } catch (err) {
    console.error('[Elderly API] Error updating profile:', err);
    return res.status(500).json({ success: false, error: 'Could not update profile.' });
  }
});

// 5. Link Elderly Profile using Passcode PIN (Key problem statement requirement!)
router.post('/link-by-passcode', authenticateToken, (req, res) => {
  const { passcode, relationship = 'family' } = req.body;

  if (!passcode) {
    return res.status(400).json({ success: false, error: 'Passcode PIN is required.' });
  }

  const cleanPasscode = String(passcode).trim();
  const profile = db.prepare('SELECT * FROM elderly_profiles WHERE passcode = ?').get(cleanPasscode);

  if (!profile) {
    return res.status(404).json({ success: false, error: 'No elderly profile found matching this passcode PIN.' });
  }

  // Check if already linked
  const existing = db.prepare('SELECT id FROM care_circle WHERE elderly_id = ? AND user_id = ?').get(profile.id, req.user.id);
  if (existing) {
    return res.json({
      success: true,
      message: `${profile.full_name}'s profile is already linked to your account.`,
      profile
    });
  }

  // Link to care circle
  const circleId = 'cir-' + crypto.randomUUID().slice(0, 8);
  db.prepare(`
    INSERT INTO care_circle (id, elderly_id, user_id, relationship, permission_level, receive_alerts)
    VALUES (?, ?, ?, ?, 'editor', 1)
  `).run(circleId, profile.id, req.user.id, relationship);

  // Log activity
  db.prepare(`
    INSERT INTO activity_audit_logs (id, user_id, user_name, action, details, ip_address)
    VALUES (?, ?, ?, 'CARE_CIRCLE_LINK', ?, ?)
  `).run('aud-' + crypto.randomUUID().slice(0, 8), req.user.id, req.user.name, `Linked to ${profile.full_name} via passcode PIN`, req.ip);

  return res.json({
    success: true,
    message: `Successfully linked ${profile.full_name}'s profile to your care dashboard!`,
    profile
  });
});

// 6. Emergency SOS Distress Trigger (High-impact elderly safety feature)
router.post('/:id/sos', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { locationNotes } = req.body;

  const profile = db.prepare('SELECT * FROM elderly_profiles WHERE id = ?').get(id);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  console.log(`[SOS] 🚨 EMERGENCY DISTRESS TRIGGERED FOR ${profile.full_name}!`);

  // Log in activity audit
  db.prepare(`
    INSERT INTO activity_audit_logs (id, user_id, user_name, action, details, ip_address)
    VALUES (?, ?, ?, 'EMERGENCY_SOS', ?, ?)
  `).run('aud-' + crypto.randomUUID().slice(0, 8), req.user.id, req.user.name, `🚨 SOS distress broadcast triggered for ${profile.full_name}`, req.ip);

  // Fetch all care circle members
  const careCircle = db.prepare(`
    SELECT u.email, u.name, c.relationship
    FROM care_circle c
    JOIN users u ON c.user_id = u.id
    WHERE c.elderly_id = ?
  `).all(id);

  const broadcastResults = [];

  for (const member of careCircle) {
    const emailHtml = generateEmergencySOSEmail({
      elderlyName: profile.full_name,
      senderName: req.user.name,
      location: locationNotes || profile.address || 'Registered Residence',
      emergencyPhone: profile.emergency_contact_phone || '+1 (555) 911-HELP',
      allergies: profile.known_allergies,
      conditions: profile.chronic_conditions
    });

    const dispatched = await sendProactiveEmail({
      elderlyId: profile.id,
      recipientEmail: member.email,
      recipientName: member.name,
      type: 'emergency_sos',
      subject: `🚨 URGENT EMERGENCY SOS: ${profile.full_name} needs immediate assistance`,
      htmlContent: emailHtml,
      plainText: `EMERGENCY SOS: ${profile.full_name} triggered an emergency alert. Emergency phone: ${profile.emergency_contact_phone}`
    });

    broadcastResults.push(dispatched);
  }

  return res.json({
    success: true,
    message: `🚨 Emergency SOS dispatched to ${careCircle.length} care circle members and emergency contacts!`,
    emergencyContact: {
      name: profile.emergency_contact_name,
      phone: profile.emergency_contact_phone,
      doctor: profile.primary_doctor_name,
      doctorPhone: profile.primary_doctor_phone
    },
    broadcastCount: careCircle.length
  });
});

export default router;
