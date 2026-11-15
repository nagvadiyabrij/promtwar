# AuraCare Database Schema Specification

AuraCare utilizes a persistent relational schema designed for geriatric care coordination, real-time dosage compliance tracking, and role-based access control.

---

## Entity Relationship Overview

```
 [users] 1 ──── 0..1 [elderly_profiles]
   │                         │
   │ 1                     1 │
   ▼                         ▼
[care_circle] M ──────── M [medications]
                             │
                             ▼
                     [adherence_logs]
```

---

## Tables & Column Definitions

### 1. `users`
Core identity table supporting role-based access control.
- `id` (TEXT PRIMARY KEY): Unique identifier (`usr-xxxx`)
- `name` (TEXT NOT NULL): User's legal or preferred name
- `email` (TEXT UNIQUE NOT NULL): Lowercase email index
- `password_hash` (TEXT NOT NULL): Salted bcrypt hash (cost factor 10)
- `role` (TEXT NOT NULL): `elderly`, `caretaker`, `family`, `doctor`, `admin`
- `phone` (TEXT): Primary contact number
- `avatar_url` (TEXT): Profile photo reference
- `status` (TEXT DEFAULT 'active'): `active` or `suspended`
- `created_at` (DATETIME): Timestamp
- `updated_at` (DATETIME): Timestamp

### 2. `elderly_profiles`
Health records and quick-passcode credential for senior individuals.
- `id` (TEXT PRIMARY KEY): Unique identifier (`eld-xxxx`)
- `user_id` (TEXT UNIQUE): Foreign key to `users.id`
- `full_name` (TEXT NOT NULL): Patient full name
- `age` (INTEGER NOT NULL): Age in years
- `gender` (TEXT): Patient gender
- `passcode` (TEXT NOT NULL): 4 to 6-digit numeric PIN for instant 1-touch login
- `blood_group` (TEXT): e.g., `O+`, `A+`, `B+`
- `emergency_contact_name` (TEXT): Primary contact person
- `emergency_contact_phone` (TEXT): Primary emergency contact telephone
- `primary_doctor_name` (TEXT): Attending physician
- `primary_doctor_phone` (TEXT): Physician direct line
- `known_allergies` (TEXT): Comma-separated list (e.g., Penicillin, Sulfa)
- `chronic_conditions` (TEXT): Comma-separated conditions (e.g., Hypertension)
- `address` (TEXT): Residential address
- `notes` (TEXT): Care routines & cognitive assistance notes
- `created_at` (DATETIME): Timestamp

### 3. `care_circle`
M:N mapping between elderly profiles and authorized caretakers, family, and doctors.
- `id` (TEXT PRIMARY KEY): Circle membership ID (`cir-xxxx`)
- `elderly_id` (TEXT NOT NULL): References `elderly_profiles.id` (CASCADE)
- `user_id` (TEXT NOT NULL): References `users.id` (CASCADE)
- `relationship` (TEXT NOT NULL): `primary_caretaker`, `nurse`, `son`, `daughter`, `spouse`, `doctor`
- `permission_level` (TEXT NOT NULL): `admin`, `editor`, `viewer`
- `receive_alerts` (INTEGER DEFAULT 1): Flag indicating proactive missed-dose notifications
- `created_at` (DATETIME): Timestamp

### 4. `medications`
Prescription schedules, dosages, timing slots, and visual pill descriptors.
- `id` (TEXT PRIMARY KEY): Unique identifier (`med-xxxx`)
- `elderly_id` (TEXT NOT NULL): References `elderly_profiles.id` (CASCADE)
- `name` (TEXT NOT NULL): Drug name (e.g., Metformin HCl)
- `dosage` (TEXT NOT NULL): Unit quantity (e.g., 500 mg)
- `form` (TEXT NOT NULL): `tablet`, `capsule`, `syrup`, `drops`, `injection`
- `frequency` (TEXT NOT NULL): `daily`, `twice_daily`, `thrice_daily`, `weekly`, `as_needed`
- `timing_slots` (TEXT NOT NULL): JSON array (e.g. `["Morning (08:00)", "Evening (19:00)"]`)
- `food_instruction` (TEXT): `after_meal`, `before_meal`, `with_water`, `fasting`
- `pill_shape` (TEXT): `round`, `oval`, `capsule`
- `pill_color` (TEXT): `white`, `yellow`, `blue`, `pink`, `red`
- `stock_remaining` (INTEGER DEFAULT 30): Live inventory counter
- `refill_threshold` (INTEGER DEFAULT 7): Low refill trigger threshold
- `prescribing_doctor` (TEXT): Doctor name
- `purpose` (TEXT): Clinical indication
- `side_effects` (TEXT): Known side effects
- `is_active` (INTEGER DEFAULT 1): Active prescription flag
- `start_date` (TEXT): Prescription start date
- `end_date` (TEXT): Prescription end date
- `created_at` (DATETIME): Timestamp

### 5. `adherence_logs`
Chronological audit record of every scheduled dose interaction.
- `id` (TEXT PRIMARY KEY): Log identifier (`log-xxxx`)
- `elderly_id` (TEXT NOT NULL): References `elderly_profiles.id` (CASCADE)
- `medication_id` (TEXT NOT NULL): References `medications.id` (CASCADE)
- `scheduled_time` (TEXT NOT NULL): Format `HH:MM`
- `scheduled_date` (TEXT NOT NULL): Format `YYYY-MM-DD`
- `status` (TEXT NOT NULL): `taken`, `missed`, `skipped`, `pending`
- `action_timestamp` (DATETIME): Moment dose was recorded
- `logged_by_user_id` (TEXT): User ID who verified
- `logged_by_name` (TEXT): Display name who verified
- `notes` (TEXT): Clinical observation
- `created_at` (DATETIME): Timestamp

### 6. `medical_appointments`
Clinical consultations, hospital follow-ups, and diagnostic screenings.
- `id` (TEXT PRIMARY KEY): Appointment ID (`apt-xxxx`)
- `elderly_id` (TEXT NOT NULL): References `elderly_profiles.id` (CASCADE)
- `doctor_name` (TEXT NOT NULL): Clinician name
- `specialty` (TEXT NOT NULL): e.g. Cardiologist, Rheumatologist
- `hospital_clinic` (TEXT NOT NULL): Clinic facility name
- `appointment_date` (TEXT NOT NULL): `YYYY-MM-DD`
- `appointment_time` (TEXT NOT NULL): `HH:MM` or string
- `location` (TEXT): Room, suite, address
- `reason_for_visit` (TEXT): Clinical purpose
- `status` (TEXT DEFAULT 'upcoming'): `upcoming`, `completed`, `cancelled`
- `reminder_sent` (INTEGER DEFAULT 0): Proactive alert flag
- `clinical_notes` (TEXT): Preparation instructions
- `created_at` (DATETIME): Timestamp

### 7. `health_routines_vitals`
Health metrics tracker.
- `id` (TEXT PRIMARY KEY): `vit-xxxx`
- `elderly_id` (TEXT NOT NULL): References `elderly_profiles.id` (CASCADE)
- `type` (TEXT NOT NULL): `blood_pressure`, `glucose`, `heart_rate`, `weight`, `hydration`
- `value` (TEXT NOT NULL): e.g. `120/80`, `108`
- `unit` (TEXT): e.g. `mmHg`, `mg/dL`, `bpm`
- `recorded_at` (DATETIME): Timestamp
- `recorded_by_name` (TEXT): Name of user
- `notes` (TEXT): Contextual note

### 8. `notifications_email_logs`
Audit record of every proactive reminder dispatched.
- `id` (TEXT PRIMARY KEY): `eml-xxxx`
- `elderly_id` (TEXT): Target patient
- `recipient_email` (TEXT NOT NULL): Destination email
- `recipient_name` (TEXT NOT NULL): Destination name
- `type` (TEXT NOT NULL): `missed_medication`, `upcoming_dose`, `appointment_reminder`, `low_refill`, `emergency_sos`
- `subject` (TEXT NOT NULL): Email subject
- `content` (TEXT NOT NULL): Full responsive HTML body
- `status` (TEXT DEFAULT 'dispatched'): `dispatched` or `failed`
- `sent_at` (DATETIME): Timestamp

### 9. `activity_audit_logs`
Immutable compliance and security trail for administrators.
- `id` (TEXT PRIMARY KEY): `aud-xxxx`
- `user_id` (TEXT): Acting user
- `user_name` (TEXT): User name
- `action` (TEXT NOT NULL): `PASSCODE_LOGIN`, `MEDICATION_ADDED`, `DOSE_STATUS_UPDATED`, etc.
- `details` (TEXT): Context
- `ip_address` (TEXT): Client IP address
- `created_at` (DATETIME): Timestamp
