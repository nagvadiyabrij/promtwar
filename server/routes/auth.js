import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import db from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. User Registration
router.post('/register', (req, res) => {
  const { name, email, password, role = 'elderly', phone, age, passcode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address format.' });
  }

  // Password length
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  // Check duplicate email
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existingUser) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  const userId = 'usr-' + crypto.randomUUID().slice(0, 8);
  const passwordHash = bcrypt.hashSync(password, 10);

  try {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(userId, name.trim(), email.toLowerCase().trim(), passwordHash, role, phone || null);

    let elderlyProfileId = null;

    // If role is elderly, create corresponding elderly profile with quick passcode PIN
    if (role === 'elderly') {
      elderlyProfileId = 'eld-' + crypto.randomUUID().slice(0, 8);
      const elderPasscode = passcode ? String(passcode).trim() : '1234';
      const insertElder = db.prepare(`
        INSERT INTO elderly_profiles (id, user_id, full_name, age, passcode, emergency_contact_phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertElder.run(elderlyProfileId, userId, name.trim(), age ? parseInt(age, 10) : 75, elderPasscode, phone || null);
    }

    // Log activity
    db.prepare(`
      INSERT INTO activity_audit_logs (id, user_id, user_name, action, details, ip_address)
      VALUES (?, ?, ?, 'USER_REGISTERED', ?, ?)
    `).run('aud-' + crypto.randomUUID().slice(0, 8), userId, name, `New account created with role '${role}'`, req.ip);

    const token = generateToken({
      id: userId,
      name,
      email: email.toLowerCase().trim(),
      role,
      elderlyProfileId
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: userId,
        name,
        email: email.toLowerCase().trim(),
        role,
        phone,
        elderlyProfileId
      },
      token
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while creating account.' });
  }
});

// 2. User Standard Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, error: 'Account has been suspended. Please contact administrator.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  // Check if user has an associated elderly profile
  let elderlyProfileId = null;
  const elder = db.prepare('SELECT id FROM elderly_profiles WHERE user_id = ?').get(user.id);
  if (elder) {
    elderlyProfileId = elder.id;
  }

  // Log activity
  db.prepare(`
    INSERT INTO activity_audit_logs (id, user_id, user_name, action, details, ip_address)
    VALUES (?, ?, ?, 'USER_LOGIN', 'Standard password login successful', ?)
  `).run('aud-' + crypto.randomUUID().slice(0, 8), user.id, user.name, req.ip);

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    elderlyProfileId
  });

  return res.json({
    success: true,
    message: 'Login successful!',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      elderlyProfileId
    },
    token
  });
});

// 3. Quick Elderly Passcode PIN Login (Problem statement key requirement: passcode-based access)
router.post('/passcode-login', (req, res) => {
  const { passcode } = req.body;

  if (!passcode) {
    return res.status(400).json({ success: false, error: 'Passcode PIN is required.' });
  }

  const cleanPasscode = String(passcode).trim();
  const elder = db.prepare('SELECT * FROM elderly_profiles WHERE passcode = ?').get(cleanPasscode);

  if (!elder) {
    return res.status(401).json({ success: false, error: 'Incorrect passcode PIN. Please check or contact your caretaker.' });
  }

  // Get associated user account or create virtual session
  let user = elder.user_id ? db.prepare('SELECT * FROM users WHERE id = ?').get(elder.user_id) : null;
  if (!user) {
    user = {
      id: 'usr-elderly-passcode',
      name: elder.full_name,
      email: `${elder.full_name.toLowerCase().replace(/\s+/g, '')}@auracare.senior`,
      role: 'elderly',
    };
  }

  const token = generateToken({
    id: user.id,
    name: elder.full_name,
    email: user.email,
    role: 'elderly',
    elderlyProfileId: elder.id,
    authMethod: 'passcode'
  });

  // Log activity
  db.prepare(`
    INSERT INTO activity_audit_logs (id, user_id, user_name, action, details, ip_address)
    VALUES (?, ?, ?, 'PASSCODE_LOGIN', ?, ?)
  `).run('aud-' + crypto.randomUUID().slice(0, 8), user.id, elder.full_name, `Quick passcode PIN access granted for ${elder.full_name}`, req.ip);

  return res.json({
    success: true,
    message: `Welcome back, ${elder.full_name}!`,
    user: {
      id: user.id,
      name: elder.full_name,
      email: user.email,
      role: 'elderly',
      elderlyProfileId: elder.id,
      authMethod: 'passcode'
    },
    elderlyProfile: elder,
    token
  });
});

// 4. Forgot Password Simulation & Reset
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    // Return friendly generic success to prevent email enumeration
    return res.json({ success: true, message: 'If an account matches that email, a secure reset instruction has been sent.' });
  }

  // For testing convenience, generate a temp reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Log in notifications
  db.prepare(`
    INSERT INTO notifications_email_logs (id, recipient_email, recipient_name, type, subject, content, status)
    VALUES (?, ?, ?, 'system', 'AuraCare Password Reset Code', ?, 'dispatched')
  `).run(
    'eml-' + crypto.randomUUID().slice(0, 8),
    user.email,
    user.name,
    `Your temporary AuraCare verification code is: ${resetCode}. Use this code to reset your password.`
  );

  return res.json({
    success: true,
    message: `Password reset verification sent to ${email}.`,
    demoVerificationCode: resetCode // Available for smooth hackathon testing
  });
});

// 5. Reset Password
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Valid email and password (minimum 6 characters) are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ success: false, error: 'User account not found.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newHash, user.id);

  return res.json({ success: true, message: 'Password has been successfully updated. You can now log in.' });
});

// 6. Get Current User Profile
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, phone, avatar_url, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  // Also fetch elderly profile if available or linked care circle profiles
  const elder = db.prepare('SELECT * FROM elderly_profiles WHERE user_id = ?').get(user.id);
  const careCircleProfiles = db.prepare(`
    SELECT e.*, c.relationship, c.permission_level
    FROM care_circle c
    JOIN elderly_profiles e ON c.elderly_id = e.id
    WHERE c.user_id = ?
  `).all(user.id);

  return res.json({
    success: true,
    user,
    elderlyProfile: elder || (careCircleProfiles.length > 0 ? careCircleProfiles[0] : null),
    linkedProfiles: careCircleProfiles
  });
});

// 7. Update User Profile
router.put('/profile', authenticateToken, (req, res) => {
  const { name, phone } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name cannot be empty.' });
  }

  db.prepare(`UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
    name.trim(),
    phone || null,
    req.user.id
  );

  return res.json({ success: true, message: 'Profile updated successfully.' });
});

export default router;
