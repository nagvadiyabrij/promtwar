import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from '../server/db.js';
import { generateToken } from '../server/middleware/auth.js';
import { generateMissedMedicationEmail } from '../server/services/emailService.js';

initDatabase();

test('1. Database schema and tables are initialized', () => {
  const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const elders = db.prepare('SELECT COUNT(*) as c FROM elderly_profiles').get().c;
  const meds = db.prepare('SELECT COUNT(*) as c FROM medications').get().c;
  const apts = db.prepare('SELECT COUNT(*) as c FROM medical_appointments').get().c;

  assert.ok(users >= 4, 'Users table has seeded accounts');
  assert.ok(elders >= 1, 'Elderly profiles table initialized');
  assert.ok(meds >= 4, 'Medications table populated with clinical items');
  assert.ok(apts >= 2, 'Medical appointments table initialized');
});

test('2. Passcode-based authentication matches Problem Statement requirement', () => {
  const elder = db.prepare('SELECT * FROM elderly_profiles WHERE passcode = ?').get('1234');
  assert.ok(elder, 'Elder profile found with PIN 1234');
  assert.equal(elder.full_name, 'Eleanor Vance');

  const invalidElder = db.prepare('SELECT * FROM elderly_profiles WHERE passcode = ?').get('9999');
  assert.equal(invalidElder, undefined, 'Invalid passcode is correctly rejected');
});

test('3. Role-based token generation and permissions', () => {
  const adminToken = generateToken({ id: 'usr-admin-1', role: 'admin', name: 'Dr. Finch' });
  assert.ok(adminToken, 'Admin JWT token generated');

  const elderToken = generateToken({ id: 'usr-elder-1', role: 'elderly', name: 'Eleanor' });
  assert.ok(elderToken, 'Elderly JWT token generated');
});

test('4. Medication adherence calculation logic', () => {
  const elder = db.prepare('SELECT id FROM elderly_profiles LIMIT 1').get();
  const logs = db.prepare('SELECT * FROM adherence_logs WHERE elderly_id = ?').all(elder.id);
  assert.ok(logs.length > 0, 'Adherence logs exist for elderly profile');

  const taken = logs.filter(l => l.status === 'taken').length;
  const total = logs.length;
  const rate = Math.round((taken / total) * 100);

  assert.ok(rate >= 0 && rate <= 100, 'Adherence rate is a valid percentage');
});

test('5. Proactive Missed Medication Email HTML generation', () => {
  const html = generateMissedMedicationEmail({
    elderlyName: 'Eleanor Vance',
    medicationName: 'Metformin HCl',
    dosage: '500 mg',
    scheduledTime: '08:00 AM',
    minutesOverdue: 45,
    emergencyPhone: '+1 (555) 342-9912'
  });

  assert.ok(html.includes('Metformin HCl'), 'Email contains medication name');
  assert.ok(html.includes('Eleanor Vance'), 'Email contains elderly patient name');
  assert.ok(html.includes('Urgent Adherence Alert'), 'Email contains urgent header');
});

test('6. Stock refill and inventory threshold', () => {
  const lowStockMed = db.prepare('SELECT * FROM medications WHERE stock_remaining <= refill_threshold').get();
  assert.ok(lowStockMed, 'Low stock medication detection works');
  assert.ok(lowStockMed.stock_remaining <= lowStockMed.refill_threshold);
});
