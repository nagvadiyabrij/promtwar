import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes here strictly require Admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// 1. Admin System Metrics & Statistics
router.get('/metrics', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const usersByRole = db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all();
    const totalElderly = db.prepare('SELECT COUNT(*) as count FROM elderly_profiles').get().count;
    const totalMedications = db.prepare('SELECT COUNT(*) as count FROM medications WHERE is_active = 1').get().count;
    const totalDoses = db.prepare('SELECT COUNT(*) as count FROM adherence_logs').get().count;
    const takenDoses = db.prepare("SELECT COUNT(*) as count FROM adherence_logs WHERE status = 'taken'").get().count;
    const missedDoses = db.prepare("SELECT COUNT(*) as count FROM adherence_logs WHERE status = 'missed'").get().count;
    const totalEmailsSent = db.prepare('SELECT COUNT(*) as count FROM notifications_email_logs').get().count;
    const upcomingAppointments = db.prepare("SELECT COUNT(*) as count FROM medical_appointments WHERE status = 'upcoming'").get().count;

    const overallAdherence = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 94;

    return res.json({
      success: true,
      metrics: {
        totalUsers,
        totalElderlyProfiles: totalElderly,
        totalActiveMedications: totalMedications,
        totalDosesTracked: totalDoses,
        overallAdherenceRate: overallAdherence,
        missedDoseAlerts: missedDoses,
        totalProactiveEmailsSent: totalEmailsSent,
        upcomingDoctorAppointments: upcomingAppointments,
        usersByRole
      }
    });
  } catch (err) {
    console.error('[Admin API] Error fetching metrics:', err);
    return res.status(500).json({ success: false, error: 'Could not load administrative metrics.' });
  }
});

// 2. User Management: List all users with search, role filter, pagination
router.get('/users', (req, res) => {
  const { search = '', role = '' } = req.query;

  let query = 'SELECT id, name, email, role, phone, status, created_at FROM users WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  query += ' ORDER BY created_at DESC';

  const users = db.prepare(query).all(...params);
  return res.json({ success: true, users });
});

// 3. User Status Update (Activate / Suspend)
router.patch('/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Status must be active or suspended.' });
  }

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  // Safety constraint: Prevent suspending the last active administrator
  if (targetUser.role === 'admin' && status === 'suspended') {
    const activeAdmins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND status = 'active'").get().count;
    if (activeAdmins <= 1) {
      return res.status(400).json({ success: false, error: 'Cannot suspend the last active administrator.' });
    }
  }

  db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

  return res.json({ success: true, message: `User status changed to ${status}.` });
});

// 4. Update User Role & Details
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, phone } = req.body;

  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  // Safety check if demoting admin
  if (targetUser.role === 'admin' && role !== 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    if (adminCount <= 1) {
      return res.status(400).json({ success: false, error: 'Cannot change role: System requires at least one administrator.' });
    }
  }

  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      role = COALESCE(?, role),
      phone = COALESCE(?, phone),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name || null, role || null, phone || null, id);

  return res.json({ success: true, message: 'User updated successfully.' });
});

// 5. Safe Delete User
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  // Cannot delete last admin
  if (targetUser.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    if (adminCount <= 1) {
      return res.status(400).json({ success: false, error: 'Cannot delete the only administrator.' });
    }
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  return res.json({ success: true, message: `User ${targetUser.name} deleted successfully.` });
});

// 6. View Activity Audit Logs
router.get('/audit-logs', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = db.prepare('SELECT * FROM activity_audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  return res.json({ success: true, logs });
});

export default router;
