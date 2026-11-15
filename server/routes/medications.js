import express from 'express';
import crypto from 'node:crypto';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all medications for an elderly profile
router.get('/', authenticateToken, (req, res) => {
  const elderlyId = req.query.elderlyId || req.user.elderlyProfileId;

  if (!elderlyId) {
    // If not specified, get the first available profile
    const first = db.prepare('SELECT id FROM elderly_profiles LIMIT 1').get();
    if (!first) {
      return res.json({ success: true, medications: [] });
    }
    const meds = db.prepare('SELECT * FROM medications WHERE elderly_id = ? ORDER BY is_active DESC, created_at DESC').all(first.id);
    return res.json({ success: true, medications: meds.map(formatMed) });
  }

  const meds = db.prepare('SELECT * FROM medications WHERE elderly_id = ? ORDER BY is_active DESC, created_at DESC').all(elderlyId);
  return res.json({ success: true, medications: meds.map(formatMed) });
});

// Helper to parse timing_slots JSON
function formatMed(m) {
  let slots = [];
  try {
    slots = JSON.parse(m.timing_slots || '[]');
  } catch {
    slots = [m.timing_slots || 'Morning'];
  }
  return {
    ...m,
    timing_slots: slots,
    is_low_stock: m.stock_remaining <= m.refill_threshold
  };
}

// 2. Get specific medication details
router.get('/:id', authenticateToken, (req, res) => {
  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
  if (!med) {
    return res.status(404).json({ success: false, error: 'Medication not found.' });
  }
  return res.json({ success: true, medication: formatMed(med) });
});

// 3. Add a new medication
router.post('/', authenticateToken, (req, res) => {
  const {
    elderly_id, name, dosage, form = 'tablet', frequency = 'daily',
    timing_slots = ['Morning (08:00)'], food_instruction = 'after_meal',
    pill_shape = 'round', pill_color = 'white',
    stock_remaining = 30, refill_threshold = 7,
    prescribing_doctor, purpose, side_effects, start_date, end_date
  } = req.body;

  const targetElderlyId = elderly_id || req.user.elderlyProfileId;
  if (!targetElderlyId) {
    return res.status(400).json({ success: false, error: 'Elderly profile ID is required.' });
  }

  if (!name || !dosage) {
    return res.status(400).json({ success: false, error: 'Medication name and dosage are required.' });
  }

  const medId = 'med-' + crypto.randomUUID().slice(0, 8);
  const slotsJson = JSON.stringify(Array.isArray(timing_slots) ? timing_slots : [timing_slots]);

  try {
    const insertMed = db.prepare(`
      INSERT INTO medications (
        id, elderly_id, name, dosage, form, frequency, timing_slots,
        food_instruction, pill_shape, pill_color, stock_remaining,
        refill_threshold, prescribing_doctor, purpose, side_effects,
        is_active, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insertMed.run(
      medId, targetElderlyId, name.trim(), dosage.trim(), form, frequency, slotsJson,
      food_instruction, pill_shape, pill_color,
      parseInt(stock_remaining, 10) || 30,
      parseInt(refill_threshold, 10) || 7,
      prescribing_doctor || null, purpose || null, side_effects || null,
      start_date || new Date().toISOString().split('T')[0], end_date || null
    );

    // Auto-create today's pending log entries for each timing slot
    const todayStr = new Date().toISOString().split('T')[0];
    const slots = Array.isArray(timing_slots) ? timing_slots : [timing_slots];

    for (const slot of slots) {
      const timeMatch = slot.match(/\d{2}:\d{2}/);
      const timeFormatted = timeMatch ? timeMatch[0] : (slot.toLowerCase().includes('morning') ? '08:00' : '20:00');

      db.prepare(`
        INSERT INTO adherence_logs (
          id, elderly_id, medication_id, scheduled_time, scheduled_date, status, notes
        ) VALUES (?, ?, ?, ?, ?, 'pending', 'Created with new medication prescription')
      `).run('log-' + crypto.randomUUID().slice(0, 8), targetElderlyId, medId, timeFormatted, todayStr);
    }

    // Log in activity audit
    db.prepare(`
      INSERT INTO activity_audit_logs (id, user_id, user_name, action, details, ip_address)
      VALUES (?, ?, ?, 'MEDICATION_ADDED', ?, ?)
    `).run('aud-' + crypto.randomUUID().slice(0, 8), req.user.id, req.user.name, `Added medication ${name} (${dosage})`, req.ip);

    return res.status(201).json({
      success: true,
      message: `Medication '${name}' added to schedule.`,
      medicationId: medId
    });
  } catch (err) {
    console.error('[Medications API] Error creating medication:', err);
    return res.status(500).json({ success: false, error: 'Could not add medication.' });
  }
});

// 4. Update medication details
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    name, dosage, form, frequency, timing_slots, food_instruction,
    pill_shape, pill_color, stock_remaining, refill_threshold,
    prescribing_doctor, purpose, side_effects, is_active
  } = req.body;

  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(id);
  if (!med) {
    return res.status(404).json({ success: false, error: 'Medication not found.' });
  }

  const slotsJson = timing_slots ? JSON.stringify(Array.isArray(timing_slots) ? timing_slots : [timing_slots]) : null;

  try {
    db.prepare(`
      UPDATE medications SET
        name = COALESCE(?, name),
        dosage = COALESCE(?, dosage),
        form = COALESCE(?, form),
        frequency = COALESCE(?, frequency),
        timing_slots = COALESCE(?, timing_slots),
        food_instruction = COALESCE(?, food_instruction),
        pill_shape = COALESCE(?, pill_shape),
        pill_color = COALESCE(?, pill_color),
        stock_remaining = COALESCE(?, stock_remaining),
        refill_threshold = COALESCE(?, refill_threshold),
        prescribing_doctor = COALESCE(?, prescribing_doctor),
        purpose = COALESCE(?, purpose),
        side_effects = COALESCE(?, side_effects),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      dosage ? dosage.trim() : null,
      form || null,
      frequency || null,
      slotsJson,
      food_instruction || null,
      pill_shape || null,
      pill_color || null,
      stock_remaining !== undefined ? parseInt(stock_remaining, 10) : null,
      refill_threshold !== undefined ? parseInt(refill_threshold, 10) : null,
      prescribing_doctor || null,
      purpose || null,
      side_effects || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id
    );

    return res.json({ success: true, message: 'Medication updated successfully.' });
  } catch (err) {
    console.error('[Medications API] Error updating medication:', err);
    return res.status(500).json({ success: false, error: 'Could not update medication.' });
  }
});

// 5. Refill stock
router.post('/:id/refill', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { addQuantity = 30 } = req.body;

  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(id);
  if (!med) {
    return res.status(404).json({ success: false, error: 'Medication not found.' });
  }

  const newStock = med.stock_remaining + parseInt(addQuantity, 10);
  db.prepare('UPDATE medications SET stock_remaining = ? WHERE id = ?').run(newStock, id);

  db.prepare(`
    INSERT INTO activity_audit_logs (id, user_id, user_name, action, details, ip_address)
    VALUES (?, ?, ?, 'MEDICATION_REFILLED', ?, ?)
  `).run('aud-' + crypto.randomUUID().slice(0, 8), req.user.id, req.user.name, `Refilled ${med.name} (+${addQuantity} pills, new total: ${newStock})`, req.ip);

  return res.json({
    success: true,
    message: `Refilled ${med.name} (+${addQuantity} units). New stock: ${newStock}`,
    stock_remaining: newStock
  });
});

// 6. Delete or deactivate medication
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const med = db.prepare('SELECT * FROM medications WHERE id = ?').get(id);
  if (!med) {
    return res.status(404).json({ success: false, error: 'Medication not found.' });
  }

  db.prepare('DELETE FROM medications WHERE id = ?').run(id);

  return res.json({ success: true, message: `Medication '${med.name}' removed from active schedule.` });
});

export default router;
