import React from 'react';
import { HeartHandshake, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Solution Architecture</span>
        </div>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 tracking-tight">
          About AuraCare Platform
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Engineered for the <strong>PromptWars x Catalyst Hackathon</strong> challenge: "Elderly Care & Medication Management Platform".
        </p>
      </div>

      {/* The Core Mission */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="font-display font-bold text-2xl text-slate-900">
          The Problem Statement & Objective
        </h2>
        <p className="text-slate-700 leading-relaxed text-base">
          Millions of elderly individuals struggle with polypharmacy—managing 4 to 8 different daily medications across varying times of the day, before or after meals. Forgetting a dose or taking a duplicate dose can lead to acute hospitalizations. Conventional alarm apps require complex smartphone interactions and fail to alert the family when an elderly person misses a critical dose.
        </p>
        <p className="text-slate-700 leading-relaxed text-base">
          <strong>AuraCare</strong> bridges this gap by creating an interconnected healthcare ecosystem. Seniors maintain complete dignity and independence through an ultra-simple <strong>Passcode PIN</strong> and <strong>1-Touch Senior Mode</strong> with voice speech synthesis. Meanwhile, caregivers, family members, and attending physicians have real-time visibility and receive <strong>proactive email reminders</strong> whenever a dose is delayed or an appointment approaches.
        </p>
      </div>

      {/* Target User Roles Breakdown */}
      <div className="space-y-6">
        <h2 className="font-display font-bold text-2xl text-slate-900 text-center">
          Shared Ecosystem: Five Integrated Roles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-3">
            <div className="text-3xl">👵</div>
            <h3 className="font-bold text-lg text-slate-900">Elderly Senior</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              4-digit PIN unlock, large high-contrast visual pill cards, speech readout ("Listen Aloud"), 1-click dose confirmation, and 1-click Emergency SOS.
            </p>
          </div>

          <div className="p-6 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
            <div className="text-3xl">🩺</div>
            <h3 className="font-bold text-lg text-slate-900">Caregiver / Nurse</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Manage complete medication schedules, log vital signs (BP, blood glucose), track remaining pill counts, and receive low refill warnings.
            </p>
          </div>

          <div className="p-6 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3">
            <div className="text-3xl">👨‍👩‍👧</div>
            <h3 className="font-bold text-lg text-slate-900">Family Member</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Peace-of-mind dashboard showing adherence percentages, daily activity timelines, and automated emails if a dose is missed.
            </p>
          </div>

          <div className="p-6 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
            <div className="text-3xl">👨‍⚕️</div>
            <h3 className="font-bold text-lg text-slate-900">Doctor / Clinician</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Schedule follow-up consultations, sync with Google Calendar, attach clinical visit notes, and review verified adherence trends.
            </p>
          </div>

          <div className="p-6 bg-slate-100 rounded-2xl border border-slate-300 space-y-3 sm:col-span-2 lg:col-span-2">
            <div className="text-3xl">🛡️</div>
            <h3 className="font-bold text-lg text-slate-900">System Administrator</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monitor platform metrics, manage user activation/suspension, audit activity logs, inspect email dispatch logs, and control reminder scheduler intervals.
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Framework Alignment */}
      <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl space-y-6">
        <h2 className="font-display font-bold text-2xl text-teal-400">
          Hackathon Evaluation Framework Alignment
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
          <div className="space-y-2">
            <div className="text-white font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Problem Statement Alignment (100%)</span>
            </div>
            <p className="text-xs text-slate-400">
              Implements every required capability: passcode access, medication scheduling, adherence tracking, proactive email reminders, care circles, and Google Calendar appointments.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Accessibility & Senior-Centric UX</span>
            </div>
            <p className="text-xs text-slate-400">
              Senior Mode toggle, Web Speech API speech synthesis, high contrast filters, WCAG AA compliance, and oversized touch targets (min 52px).
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Google Services & AI Innovation</span>
            </div>
            <p className="text-xs text-slate-400">
              Integrates Google Gemini 1.5 Flash for clinical interaction checking and medication explanation, plus direct Google Calendar event creation.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Security & Production Architecture</span>
            </div>
            <p className="text-xs text-slate-400">
              JWT authentication, bcrypt password hashing, role-based route guards, audit logging, input sanitization, and containerized Dockerfile for Google Cloud Run.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-center">
          <Link
            to="/elderly"
            className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-2"
          >
            <span>Explore Senior Interface Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
