# AuraCare REST API Documentation

Base URL: `http://localhost:5000/api` (Local) / `https://auracare-xxxx-uc.a.run.app/api` (Production Cloud Run)

All requests and responses use standard JSON (`Content-Type: application/json`).
Authenticated endpoints require a Bearer token: `Authorization: Bearer <JWT_TOKEN>`.

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/passcode-login`
Quick 4-digit PIN access for elderly individuals without passwords.
- **Request Body:**
  ```json
  { "passcode": "1234" }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": { "id": "usr-elder-1", "name": "Eleanor Vance", "role": "elderly", "elderlyProfileId": "eld-eleanor-1" },
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
  ```

### `POST /api/auth/login`
Standard email and password login for caregivers, family, doctors, and administrators.
- **Request Body:**
  ```json
  { "email": "sarah.vance@auracare.health", "password": "care123" }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "user": { "id": "usr-care-1", "name": "Sarah Vance, RN", "role": "caretaker" },
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
  ```

### `POST /api/auth/register`
Create a new user account with role-specific profile linkage.
- **Request Body:**
  ```json
  {
    "name": "David Vance",
    "email": "david@example.com",
    "password": "password123",
    "role": "family",
    "phone": "+1 555 441-7890"
  }
  ```

### `GET /api/auth/me`
Retrieve currently authenticated user profile and connected elderly records.
- **Headers:** `Authorization: Bearer <TOKEN>`

---

## 2. Elderly & Care Circle (`/api/elderly`)

### `GET /api/elderly`
Retrieve all elderly profiles accessible to the user.

### `GET /api/elderly/:id`
Retrieve detailed health profile, emergency contacts, and Care Circle members.

### `POST /api/elderly/link-by-passcode`
Link an elder's profile to the user's Care Circle using their 4-digit PIN.
- **Request Body:**
  ```json
  { "passcode": "1234", "relationship": "daughter" }
  ```

### `POST /api/elderly/:id/sos`
Trigger Emergency Distress SOS broadcast to all care circle members.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Emergency SOS dispatched to 3 care circle members!",
    "emergencyContact": { "phone": "+1 (555) 342-9912" }
  }
  ```

---

## 3. Medications Management (`/api/medications`)

### `GET /api/medications?elderlyId=:id`
List all prescribed medications for the specified elder.

### `POST /api/medications`
Add a new medication prescription with timing slots and pill visual descriptors.
- **Request Body:**
  ```json
  {
    "elderly_id": "eld-eleanor-1",
    "name": "Metformin HCl",
    "dosage": "500 mg",
    "form": "tablet",
    "frequency": "twice_daily",
    "timing_slots": ["Morning (08:00)", "Evening (19:00)"],
    "food_instruction": "after_meal",
    "pill_color": "white",
    "pill_shape": "oval",
    "stock_remaining": 30,
    "refill_threshold": 7,
    "purpose": "Type 2 Diabetes regulation"
  }
  ```

### `POST /api/medications/:id/refill`
Add 30 pills to remaining medication inventory.

### `DELETE /api/medications/:id`
Archive or remove a medication from the active schedule.

---

## 4. Adherence Tracking (`/api/adherence`)

### `GET /api/adherence/today?elderlyId=:id`
Fetch today's prescribed doses checklist with taken/pending/missed status.

### `POST /api/adherence/log-dose`
Record dose administration (1-touch take, skip, or notes).
- **Request Body:**
  ```json
  { "log_id": "log-1", "status": "taken", "notes": "Taken with breakfast" }
  ```

### `GET /api/adherence/analytics?elderlyId=:id`
Retrieve 7-day adherence trends, streaks, and compliance metrics for Recharts.

---

## 5. Medical Appointments (`/api/appointments`)

### `GET /api/appointments?elderlyId=:id`
List all scheduled consultations with direct Google Calendar URLs.

### `POST /api/appointments`
Schedule an appointment.

### `GET /api/appointments/:id/calendar.ics`
Download universal iCalendar `.ics` file for Outlook/Apple Calendar.

### `GET /api/appointments/vitals?elderlyId=:id`
Retrieve logged vital signs (Blood Pressure, Blood Glucose, Heart Rate).

### `POST /api/appointments/vitals`
Log a new vital sign measurement.

---

## 6. Proactive Reminders Engine (`/api/reminders`)

### `GET /api/reminders/logs`
View history of all dispatched proactive email reminders.

### `POST /api/reminders/run-cron`
Trigger on-demand execution of the proactive compliance scheduler.

### `POST /api/reminders/send-immediate`
Dispatch an immediate proactive reminder email for testing purposes.

---

## 7. AI Health Companion (`/api/ai`)

### `POST /api/ai/check-interactions`
Analyzes drug-drug and drug-food interactions using Google Gemini 1.5 Flash.
- **Request Body:**
  ```json
  {
    "medications": ["Metformin", "Lisinopril", "Atorvastatin"],
    "conditions": ["Hypertension"],
    "allergies": ["Penicillin"]
  }
  ```

### `POST /api/ai/explain-medication`
Explains a medication in warm, simple, plain English suitable for seniors.

---

## 8. Administrative Workspace (`/api/admin`)

*Strictly requires `admin` role.*

### `GET /api/admin/metrics`
System statistics (total users, elderly profiles, adherence %, proactive emails).

### `GET /api/admin/users?search=&role=`
List and search registered users.

### `PATCH /api/admin/users/:id/status`
Suspend or activate a user account.

### `DELETE /api/admin/users/:id`
Safely delete a user account (prevents deleting the last admin).

### `GET /api/admin/audit-logs`
Chronological activity and security audit trail.
