# AuraCare — Smart Interconnected Elderly Care & Medication Management Platform

> **Google for Developers | PromptWars x Catalyst Hackathon Edition**  
> *Category:* Elderly Care & Medication Management Platform  
> *GitHub Repository:* https://github.com/nagvadiyabrij/promntwar  
> *Stack:* React (Vite), Tailwind CSS, Node.js / Express, SQLite / PostgreSQL, Google Gemini AI, Nodemailer, Google Cloud Run

[![Deploy to Cloud Run](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run/?git_repo=https://github.com/nagvadiyabrij/promntwar.git)

---

## 🌟 Executive Summary

**AuraCare** is an innovative, production-ready, full-stack healthcare platform engineered specifically around the **PromptWars x Catalyst Challenge Problem Statement**.

Generic medication apps fail senior citizens because they rely on complex smartphone interactions, isolated alarms, and small typography. **AuraCare** replaces this with an interconnected healthcare ecosystem:
1. **Senior Independence:** Seniors log in using a simple **4-digit Passcode PIN**, view oversized visual pill cards, listen to schedules read aloud via the **Web Speech API**, and confirm doses in **1-touch** with celebration confetti.
2. **Proactive Safety Net:** Caregivers and family members are proactively notified via **automated email reminders** whenever a scheduled dose is missed, when refills drop low, or when doctor appointments approach.
3. **Clinical Intelligence:** Integrated **Google Gemini 1.5 Flash AI** analyzes drug-drug and drug-food interactions (e.g. grapefruit contraindications with statins) and explains complex medications in warm, reassuring, plain English.

---

## 🏆 Key Features Implemented

### 1. Passcode-Based Quick Access (Core Problem Statement Requirement)
- Seniors unlock their daily routine using a quick 4-digit PIN (e.g., `1234`), eliminating forgotten passwords.
- Caregivers and family members can securely link new elderly profiles using the elder's passcode PIN.
- Includes an oversized numeric keypad optimized for seniors with tremors or low vision.

### 2. Senior 1-Touch Mode with Voice Speech Synthesis
- Ultra-accessible daily schedule grouped by morning, afternoon, evening, and bedtime.
- **Listen Aloud:** Web Speech API reads out medications, dosages, and food instructions.
- 1-Touch "Mark as Taken" button that increments adherence streaks and decrements pill inventory.
- **1-Click Emergency SOS:** Broadcasts immediate distress emails to all care circle members with emergency contact info and clinical allergies.

### 3. Proactive Email Reminders & Notification Engine
- Background scheduler checks adherence compliance every 5 minutes.
- Auto-escalates missed doses past a 30-minute safety window to caregivers and family members.
- Generates responsive HTML email alerts:
  - *Missed Medication Urgency Alert*
  - *Upcoming Daily Dose Routine*
  - *Doctor Appointment Reminder*
  - *Pharmacy Refill Warning*
- **Interactive Live Preview Modal:** Judges can test and preview the exact dispatched HTML email with a single click in the UI.

### 4. Collaborative Shared Care Circle
- Real-time directory connecting the Elderly Senior, Primary Caregiver/Nurse, Family Members (Son, Daughter), and Cardiologist.
- Generates temporary 24-hour invitation PINs for new caregivers.

### 5. Medication Management & Visual Pill Identifiers
- Complete CRUD for prescriptions with dosages, frequencies, and food instructions.
- Visual pill shapes (round, oval, capsule) and colors (white, yellow, blue, pink) to help seniors identify pills visually.
- Inventory tracking with low-refill threshold warnings.

### 6. Medical Appointments & Google Calendar Sync
- Upcoming consultation calendar with specialty, clinic location, and preparation notes.
- **1-Click Add to Google Calendar** web integration.
- Universal **Downloadable `.ics` iCalendar file** for Apple/Outlook Calendar.
- Health Routines & Vitals tracking (Blood Pressure, Blood Glucose, Heart Rate, Hydration).

### 7. Google Gemini 1.5 Flash AI Health Companion
- **AI Drug Interaction Checker:** Live clinical analysis of drug-drug contraindications and food interactions.
- **Senior Plain-English Explainer:** Replaces dense pharma leaflets with 3 clear, reassuring bullet points.

### 8. Full Administrative Workspace
- Real-time system metrics (Total Users, Active Profiles, System Adherence %, Total Proactive Emails Dispatched).
- User Management: Search, filter roles, suspend/activate accounts, safe deletion.
- Activity & Security Audit feed.

---

## ⚡ Quick Start Demo Credentials

For immediate testing, use the **Persona Switcher** in the top navbar or these pre-configured credentials:

| Persona | Role | Login Method | Credentials |
| :--- | :--- | :--- | :--- |
| **Eleanor Vance** | Elderly Senior | 4-Digit Passcode PIN | **PIN:** `1234` |
| **Sarah Vance, RN** | Caregiver / Nurse | Email & Password | `sarah.vance@auracare.health` / `care123` |
| **David Vance** | Family Member (Son) | Email & Password | `david.vance@auracare.health` / `family123` |
| **Dr. Robert Chen** | Doctor (Cardiologist) | Email & Password | `dr.chen@auracare.health` / `admin123` |
| **Dr. Alistair Finch** | Master Administrator | Email & Password | `admin@auracare.health` / `admin123` |

---

## 🛠️ Local Development & Running

### Prerequisites
- Node.js 18+ (tested on Node v24 LTS)
- npm 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Production Bundle
```bash
npm run build
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Server
```bash
npm start
```
The application will launch on `http://localhost:5000` (serving both the API and the compiled frontend).

---

## 🚀 Google Cloud Run Deployment

Deploy directly using the included `Dockerfile` and `cloudbuild.yaml`:

```bash
# Direct one-command deployment to Google Cloud Run
gcloud run deploy auracare \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars NODE_ENV=production,PORT=8080
```

Refer to [DEPLOYMENT_GUIDE.md](file:///e:/not%20work/promntwar/DEPLOYMENT_GUIDE.md) for step-by-step instructions.

---

## 📂 Project Structure

```
promntwar/
├── server/
│   ├── index.js                  # Express API server & static frontend serving
│   ├── db.js                     # Native SQLite / PostgreSQL schema & initial seed data
│   ├── middleware/
│   │   └── auth.js               # JWT authentication & role-based route protection
│   ├── routes/
│   │   ├── auth.js               # User auth & passcode-based login
│   │   ├── elderly.js            # Elderly profiles, passcode linking, SOS alert
│   │   ├── medications.js        # Prescriptions, visual pill descriptors, refill logic
│   │   ├── adherence.js          # 1-touch logging, adherence streaks, analytics
│   │   ├── appointments.js       # Appointments, Google Calendar sync, vitals tracker
│   │   ├── reminders.js          # Proactive email logs & scheduler triggers
│   │   ├── ai.js                 # Google Gemini AI interaction checker & explainer
│   │   └── admin.js              # Admin metrics, user management, audit logs
│   └── services/
│       ├── emailService.js       # Nodemailer transporter & responsive HTML templates
│       └── cronService.js        # Automated proactive reminder scheduler
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx       # Global auth, persona switching, Web Speech TTS
│   │   └── NotificationContext.jsx # Live toasts, email preview modal, SOS modal
│   ├── components/
│   │   ├── layout/               # Navbar & Footer
│   │   ├── accessibility/        # Floating Senior Accessibility Toolbar
│   │   └── common/               # EmergencyModal, EmailPreviewModal
│   ├── pages/
│   │   ├── LandingPage.jsx       # Startup landing page with live interactive simulator
│   │   ├── AboutPage.jsx         # Solution architecture & hackathon breakdown
│   │   ├── LoginPage.jsx         # Dual login: Senior PIN & Email/Password
│   │   ├── RegisterPage.jsx      # Role-based registration
│   │   ├── PasscodeAccessPage.jsx # Dedicated 4-digit PIN access portal
│   │   ├── ElderlyDashboard.jsx  # Senior 1-Touch Mode with voice speech & pill cards
│   │   ├── CaregiverDashboard.jsx # Caregiver hub, vitals, trigger proactive reminder
│   │   ├── MedicationsPage.jsx   # Prescriptions CRUD, inventory, Gemini AI checker
│   │   ├── AppointmentsPage.jsx  # Google Calendar sync, clinical notes, .ics download
│   │   ├── AdherenceAnalyticsPage.jsx # Recharts 7-day adherence trends & CSV export
│   │   ├── CareCirclePage.jsx    # Shared ecosystem directory & invite PIN generator
│   │   ├── NotificationsPage.jsx # Proactive email dispatch logs & view HTML modal
│   │   ├── ProfilePage.jsx       # User profile, emergency contacts, allergies
│   │   ├── AdminDashboard.jsx    # Master admin portal & user status controls
│   │   ├── SupportPage.jsx       # 24/7 Senior care hotline & support form
│   │   └── NotFoundPage.jsx      # Custom 404 page
│   ├── utils/
│   │   └── confetti.js           # Zero-dependency canvas confetti animation
│   ├── App.jsx                   # React Router route registry
│   └── main.jsx                  # React DOM mount point
├── tests/
│   └── api.test.js               # Automated Node.js test suite
├── Dockerfile                    # Multi-stage production container
├── cloudbuild.yaml               # Google Cloud Build pipeline configuration
├── DEPLOYMENT_GUIDE.md           # Step-by-step Google Cloud Run deployment instructions
├── DATABASE_SCHEMA.md            # Relational database schema specification
├── API_DOCUMENTATION.md          # REST API documentation
├── TEST_REPORT.md                # Quality assurance test report
├── package.json                  # Dependencies & npm scripts
├── vite.config.js                # Vite build configuration
└── tailwind.config.js            # Healthcare & Senior Mode design system
```

---

## 📜 Problem Statement Alignment

| Problem Statement Requirement | AuraCare Solution |
| :--- | :--- |
| **Passcode-based Access** | 4-digit PIN instant senior access (`/passcode-access` and `/elderly`) + Care Circle linking |
| **Medication Schedules** | Full CRUD, morning/afternoon/evening/night slots, visual pill shape/color |
| **Adherence Tracking** | 1-touch logging, streak counter, 7-day interactive Recharts trend analysis |
| **Doctor Appointments** | Calendar scheduling, Google Calendar sync link, `.ics` iCalendar download |
| **Proactive Email Reminders** | Automated 5-min cron, Nodemailer alerts for missed doses, live HTML preview modal |
| **Shared Ecosystem** | Care Circle directory connecting elderly, caregivers, family members, and clinicians |
| **Senior UX & Accessibility** | High-contrast toggle, Web Speech API speech synthesis, 52px button targets |
| **Google Cloud Run & Gemini** | Docker container, cloudbuild.yaml, Google Gemini 1.5 Flash AI drug safety checker |

---

*AuraCare — Built for Google for Developers | PromptWars x Catalyst Hackathon.*
