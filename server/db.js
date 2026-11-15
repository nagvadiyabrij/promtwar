import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'auracare.sqlite');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for maximum reliability and concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initDatabase() {
  console.log('[AuraCare DB] Initializing database tables at:', dbPath);

  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- 'elderly', 'caretaker', 'family', 'doctor', 'admin'
      phone TEXT,
      avatar_url TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Elderly profiles table (stores health profile and quick passcode)
  db.exec(`
    CREATE TABLE IF NOT EXISTS elderly_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT,
      passcode TEXT NOT NULL, -- 4 to 6 digit quick PIN (e.g. '1234')
      blood_group TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      primary_doctor_name TEXT,
      primary_doctor_phone TEXT,
      known_allergies TEXT,
      chronic_conditions TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Care Circle (shared multi-role ecosystem)
  db.exec(`
    CREATE TABLE IF NOT EXISTS care_circle (
      id TEXT PRIMARY KEY,
      elderly_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      relationship TEXT NOT NULL,
      permission_level TEXT NOT NULL DEFAULT 'editor', -- 'admin', 'editor', 'viewer'
      receive_alerts INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Medications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      elderly_id TEXT NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      form TEXT NOT NULL, -- tablet, capsule, syrup, drops, injection
      frequency TEXT NOT NULL, -- daily, twice_daily, thrice_daily, weekly, as_needed
      timing_slots TEXT NOT NULL, -- JSON string: ["Morning", "Night"] or ["08:00", "20:00"]
      food_instruction TEXT, -- after_meal, before_meal, with_food, fasting
      pill_shape TEXT DEFAULT 'round',
      pill_color TEXT DEFAULT 'white',
      stock_remaining INTEGER DEFAULT 30,
      refill_threshold INTEGER DEFAULT 7,
      prescribing_doctor TEXT,
      purpose TEXT,
      side_effects TEXT,
      is_active INTEGER DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
    );
  `);

  // 5. Adherence logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS adherence_logs (
      id TEXT PRIMARY KEY,
      elderly_id TEXT NOT NULL,
      medication_id TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL, -- 'taken', 'missed', 'skipped', 'pending'
      action_timestamp DATETIME,
      logged_by_user_id TEXT,
      logged_by_name TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    );
  `);

  // 6. Medical appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS medical_appointments (
      id TEXT PRIMARY KEY,
      elderly_id TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      hospital_clinic TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      location TEXT,
      reason_for_visit TEXT,
      status TEXT DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled'
      reminder_sent INTEGER DEFAULT 0,
      clinical_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
    );
  `);

  // 7. Health Routines & Vitals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS health_routines_vitals (
      id TEXT PRIMARY KEY,
      elderly_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'blood_pressure', 'glucose', 'heart_rate', 'weight', 'hydration', 'steps'
      value TEXT NOT NULL,
      unit TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      recorded_by_name TEXT,
      notes TEXT,
      FOREIGN KEY (elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
    );
  `);

  // 8. Notifications & Email Dispatch Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications_email_logs (
      id TEXT PRIMARY KEY,
      elderly_id TEXT,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'missed_medication', 'upcoming_dose', 'appointment_reminder', 'low_refill', 'emergency_sos'
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'dispatched',
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Activity Audit Logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default dataset if database is newly created
  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('[AuraCare DB] Seeding realistic default data for Hackathon judges...');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper date generators
  const getOffsetDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Seed Users
  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('admin123', salt);
  const carePass = bcrypt.hashSync('care123', salt);
  const elderPass = bcrypt.hashSync('elder123', salt);
  const familyPass = bcrypt.hashSync('family123', salt);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, phone, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);

  insertUser.run('usr-admin-1', 'Dr. Alistair Finch', 'admin@auracare.health', adminPass, 'admin', '+1 (555) 019-2831');
  insertUser.run('usr-care-1', 'Sarah Vance, RN', 'sarah.vance@auracare.health', carePass, 'caretaker', '+1 (555) 342-9912');
  insertUser.run('usr-elder-1', 'Eleanor Vance', 'eleanor.vance@auracare.health', elderPass, 'elderly', '+1 (555) 887-2104');
  insertUser.run('usr-family-1', 'David Vance', 'david.vance@auracare.health', familyPass, 'family', '+1 (555) 441-7890');
  insertUser.run('usr-doc-1', 'Dr. Robert Chen, MD', 'dr.chen@auracare.health', adminPass, 'doctor', '+1 (555) 602-4411');

  // Seed Elderly Profile for Eleanor Vance
  // Quick Passcode: "1234" (for immediate 1-touch elder login!)
  const insertElder = db.prepare(`
    INSERT INTO elderly_profiles (
      id, user_id, full_name, age, gender, passcode, blood_group,
      emergency_contact_name, emergency_contact_phone,
      primary_doctor_name, primary_doctor_phone,
      known_allergies, chronic_conditions, address, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertElder.run(
    'eld-eleanor-1',
    'usr-elder-1',
    'Eleanor Vance',
    78,
    'Female',
    '1234',
    'O+',
    'Sarah Vance (Daughter / Caretaker)',
    '+1 (555) 342-9912',
    'Dr. Robert Chen (Cardiology)',
    '+1 (555) 602-4411',
    'Penicillin, Sulfa drugs',
    'Hypertension, Type 2 Diabetes, Mild Osteoarthritis',
    '742 Evergreen Terrace, Springfield',
    'Prefers medications after morning oatmeal. Voice speech assistant enabled for vision comfort.'
  );

  // Link Care Circle
  const insertCircle = db.prepare(`
    INSERT INTO care_circle (id, elderly_id, user_id, relationship, permission_level, receive_alerts)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  insertCircle.run('cir-1', 'eld-eleanor-1', 'usr-care-1', 'primary_caretaker', 'admin');
  insertCircle.run('cir-2', 'eld-eleanor-1', 'usr-family-1', 'son', 'editor');
  insertCircle.run('cir-3', 'eld-eleanor-1', 'usr-doc-1', 'doctor', 'editor');

  // Seed Realistic Medications
  const insertMed = db.prepare(`
    INSERT INTO medications (
      id, elderly_id, name, dosage, form, frequency, timing_slots,
      food_instruction, pill_shape, pill_color, stock_remaining,
      refill_threshold, prescribing_doctor, purpose, side_effects
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMed.run(
    'med-1',
    'eld-eleanor-1',
    'Metformin HCl',
    '500 mg',
    'tablet',
    'twice_daily',
    JSON.stringify(['Morning (08:00)', 'Evening (19:00)']),
    'after_meal',
    'oval',
    'white',
    24,
    10,
    'Dr. Robert Chen',
    'Blood glucose management (Type 2 Diabetes)',
    'Mild stomach upset if taken on empty stomach'
  );

  insertMed.run(
    'med-2',
    'eld-eleanor-1',
    'Lisinopril',
    '10 mg',
    'tablet',
    'daily',
    JSON.stringify(['Morning (08:00)']),
    'with_water',
    'round',
    'yellow',
    18,
    7,
    'Dr. Robert Chen',
    'Blood pressure control & cardiovascular protection',
    'Dry cough, mild dizziness upon standing'
  );

  insertMed.run(
    'med-3',
    'eld-eleanor-1',
    'Atorvastatin Calcium',
    '20 mg',
    'tablet',
    'daily',
    JSON.stringify(['Night (21:00)']),
    'after_meal',
    'oval',
    'blue',
    6, // Low refill alert! (Below threshold 7)
    7,
    'Dr. Robert Chen',
    'Cholesterol reduction & arterial health',
    'Muscle aches, fatigue'
  );

  insertMed.run(
    'med-4',
    'eld-eleanor-1',
    'Calcium Citrate + Vitamin D3',
    '600 mg / 400 IU',
    'capsule',
    'daily',
    JSON.stringify(['Afternoon (13:00)']),
    'with_food',
    'capsule',
    'pink',
    45,
    10,
    'Dr. Emily Watson',
    'Bone density support for osteoarthritis',
    'None reported'
  );

  // Seed Adherence Logs for Past 5 Days & Today
  const insertLog = db.prepare(`
    INSERT INTO adherence_logs (
      id, elderly_id, medication_id, scheduled_time, scheduled_date,
      status, action_timestamp, logged_by_user_id, logged_by_name, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let logIdx = 1;
  for (let offset = -5; offset <= 0; offset++) {
    const logDate = getOffsetDate(offset);
    const isToday = offset === 0;

    // Med 1 Morning
    insertLog.run(
      `log-${logIdx++}`,
      'eld-eleanor-1',
      'med-1',
      '08:00',
      logDate,
      'taken',
      `${logDate} 08:14:00`,
      'usr-elder-1',
      'Eleanor Vance (Self)',
      'Taken with warm oatmeal'
    );

    // Med 2 Morning
    insertLog.run(
      `log-${logIdx++}`,
      'eld-eleanor-1',
      'med-2',
      '08:00',
      logDate,
      'taken',
      `${logDate} 08:15:30`,
      'usr-elder-1',
      'Eleanor Vance (Self)',
      'Verified with full glass of water'
    );

    // Med 4 Afternoon
    if (!isToday) {
      insertLog.run(
        `log-${logIdx++}`,
        'eld-eleanor-1',
        'med-4',
        '13:00',
        logDate,
        offset === -2 ? 'missed' : 'taken',
        offset === -2 ? null : `${logDate} 13:20:00`,
        offset === -2 ? null : 'usr-care-1',
        offset === -2 ? 'System Auto-Missed' : 'Sarah Vance, RN',
        offset === -2 ? 'Missed dose alert dispatched to caregiver' : 'Administered after lunch'
      );

      // Med 1 Evening
      insertLog.run(
        `log-${logIdx++}`,
        'eld-eleanor-1',
        'med-1',
        '19:00',
        logDate,
        'taken',
        `${logDate} 19:22:00`,
        'usr-family-1',
        'David Vance',
        'Checked during family dinner call'
      );

      // Med 3 Night
      insertLog.run(
        `log-${logIdx++}`,
        'eld-eleanor-1',
        'med-3',
        '21:00',
        logDate,
        'taken',
        `${logDate} 21:05:00`,
        'usr-elder-1',
        'Eleanor Vance (Self)',
        'Taken before sleep'
      );
    } else {
      // Today pending doses
      insertLog.run(
        `log-${logIdx++}`,
        'eld-eleanor-1',
        'med-4',
        '13:00',
        todayStr,
        'pending',
        null,
        null,
        null,
        'Scheduled with lunch'
      );

      insertLog.run(
        `log-${logIdx++}`,
        'eld-eleanor-1',
        'med-1',
        '19:00',
        todayStr,
        'pending',
        null,
        null,
        null,
        'Scheduled with dinner'
      );

      insertLog.run(
        `log-${logIdx++}`,
        'eld-eleanor-1',
        'med-3',
        '21:00',
        todayStr,
        'pending',
        null,
        null,
        null,
        'Scheduled before bed (Refill reminder active!)'
      );
    }
  }

  // Seed Medical Appointments
  const insertApt = db.prepare(`
    INSERT INTO medical_appointments (
      id, elderly_id, doctor_name, specialty, hospital_clinic,
      appointment_date, appointment_time, location, reason_for_visit,
      status, reminder_sent, clinical_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertApt.run(
    'apt-1',
    'eld-eleanor-1',
    'Dr. Robert Chen, MD',
    'Cardiologist',
    'St. Jude Comprehensive Heart Center',
    getOffsetDate(3),
    '10:30 AM',
    'Suite 402, 1200 Health Parkway, Springfield',
    'Routine 6-Month Hypertension & Echocardiogram Follow-up',
    'upcoming',
    1,
    'Fast for 4 hours prior to visit for lipid panel screening.'
  );

  insertApt.run(
    'apt-2',
    'eld-eleanor-1',
    'Dr. Emily Watson, MD',
    'Rheumatologist',
    'Memorial Joint & Spine Pavilion',
    getOffsetDate(12),
    '02:15 PM',
    'Building B, 88 Mercy Ave',
    'Knee osteoarthritis joint assessment & prescription renewal',
    'upcoming',
    0,
    'Bring recent X-ray films if available.'
  );

  insertApt.run(
    'apt-3',
    'eld-eleanor-1',
    'Dr. Aaron Miller, OD',
    'Optometrist',
    'ClearVision Eye Institute',
    getOffsetDate(-18),
    '11:00 AM',
    '330 Beacon St',
    'Annual macular degeneration and reading vision check',
    'completed',
    1,
    'Prescribed high-contrast reading lenses. Eye pressure normal at 14 mmHg.'
  );

  // Seed Vitals
  const insertVital = db.prepare(`
    INSERT INTO health_routines_vitals (
      id, elderly_id, type, value, unit, recorded_at, recorded_by_name, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVital.run('vit-1', 'eld-eleanor-1', 'blood_pressure', '122/78', 'mmHg', `${todayStr} 08:30:00`, 'Sarah Vance, RN', 'Excellent morning resting pressure.');
  insertVital.run('vit-2', 'eld-eleanor-1', 'glucose', '108', 'mg/dL', `${todayStr} 08:32:00`, 'Sarah Vance, RN', 'Fasting blood glucose within target (90-130).');
  insertVital.run('vit-3', 'eld-eleanor-1', 'heart_rate', '71', 'bpm', `${todayStr} 08:30:00`, 'Sarah Vance, RN', 'Normal sinus rhythm.');
  insertVital.run('vit-4', 'eld-eleanor-1', 'hydration', '1.8', 'Liters', `${todayStr} 09:00:00`, 'Eleanor Vance', '4 glasses of water logged.');
  insertVital.run('vit-5', 'eld-eleanor-1', 'blood_pressure', '126/82', 'mmHg', `${getOffsetDate(-1)} 08:30:00`, 'Sarah Vance, RN', 'Consistent stability.');

  // Seed Email Dispatch Logs (Demonstrates proactive reminder capability)
  const insertEmail = db.prepare(`
    INSERT INTO notifications_email_logs (
      id, elderly_id, recipient_email, recipient_name, type, subject, content, status, sent_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEmail.run(
    'eml-1',
    'eld-eleanor-1',
    'sarah.vance@auracare.health',
    'Sarah Vance (Caretaker)',
    'missed_medication',
    '⚠️ URGENT: Eleanor Vance missed afternoon dose of Calcium Citrate',
    'Dear Sarah Vance, Our proactive adherence monitoring detected that Eleanor Vance has not logged their scheduled 13:00 dose of Calcium Citrate + Vitamin D3 (600 mg). Please check in or verify administration.',
    'dispatched',
    `${getOffsetDate(-2)} 13:45:00`
  );

  insertEmail.run(
    'eml-2',
    'eld-eleanor-1',
    'eleanor.vance@auracare.health',
    'Eleanor Vance',
    'upcoming_dose',
    '🔔 AuraCare Reminder: Your Morning Medications are ready',
    'Good morning Eleanor! Time for your Metformin (500mg) and Lisinopril (10mg). Please take them with your breakfast and a full glass of water.',
    'dispatched',
    `${todayStr} 07:45:00`
  );

  insertEmail.run(
    'eml-3',
    'eld-eleanor-1',
    'david.vance@auracare.health',
    'David Vance (Son)',
    'appointment_reminder',
    '🗓️ Medical Appointment in 3 Days: Dr. Robert Chen Follow-up',
    'Hello David, Eleanor has an upcoming appointment with Dr. Robert Chen on ' + getOffsetDate(3) + ' at 10:30 AM at St. Jude Comprehensive Heart Center.',
    'dispatched',
    `${todayStr} 09:00:00`
  );

  insertEmail.run(
    'eml-4',
    'eld-eleanor-1',
    'sarah.vance@auracare.health',
    'Sarah Vance',
    'low_refill',
    '💊 Refill Warning: Atorvastatin Calcium is running low (6 pills remaining)',
    'Alert: Atorvastatin Calcium stock has fallen below the safety threshold of 7 pills. Please contact Springfield Pharmacy to request a 30-day refill prescription.',
    'dispatched',
    `${todayStr} 09:15:00`
  );

  // Seed Activity Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO activity_audit_logs (id, user_id, user_name, action, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run('aud-1', 'usr-elder-1', 'Eleanor Vance', 'PASSCODE_LOGIN', 'Quick 4-digit PIN verification passed successfully.', '127.0.0.1');
  insertAudit.run('aud-2', 'usr-elder-1', 'Eleanor Vance', 'MEDICATION_TAKEN', 'Confirmed Morning dose of Metformin (500mg) and Lisinopril (10mg).', '127.0.0.1');
  insertAudit.run('aud-3', 'usr-care-1', 'Sarah Vance, RN', 'VITALS_RECORDED', 'Logged BP: 122/78 mmHg, Glucose: 108 mg/dL.', '127.0.0.1');
  insertAudit.run('aud-4', 'usr-admin-1', 'Dr. Alistair Finch', 'SYSTEM_AUDIT', 'Automated adherence cron executed. 4 proactive alerts dispatched.', '127.0.0.1');

  console.log('[AuraCare DB] Default data successfully initialized and seeded.');
}

export default db;
