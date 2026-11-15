import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Phone, ShieldCheck, Mail, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-24 sm:pb-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Platform Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white font-bold">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="font-display font-extrabold text-2xl text-white tracking-tight">
                Aura<span className="text-teal-400">Care</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Smart interconnected elderly care and medication management ecosystem. Empowering seniors with dignified independence while keeping caregivers and families proactively informed.
            </p>
            <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>PromptWars x Catalyst Hackathon Edition</span>
            </div>
          </div>

          {/* Col 2: Core Platform Solutions */}
          <div>
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Core Ecosystem</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/elderly" className="hover:text-teal-400 transition">Senior 1-Touch Mode</Link></li>
              <li><Link to="/passcode-access" className="hover:text-teal-400 transition">Passcode PIN Access Portal</Link></li>
              <li><Link to="/caregiver" className="hover:text-teal-400 transition">Caregiver & Family Dashboard</Link></li>
              <li><Link to="/medications" className="hover:text-teal-400 transition">Medication Schedules & Refills</Link></li>
              <li><Link to="/appointments" className="hover:text-teal-400 transition">Appointments & Google Calendar</Link></li>
              <li><Link to="/adherence" className="hover:text-teal-400 transition">Adherence Streak Analytics</Link></li>
            </ul>
          </div>

          {/* Col 3: Innovation & Technology */}
          <div>
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Smart Technology</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Proactive Missed Dose Dispatcher</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Google Gemini AI Drug Interactions</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Web Speech API Voice Readout</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Persistent SQLite / PostgreSQL</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Docker & Google Cloud Run Ready</span>
              </li>
            </ul>
          </div>

          {/* Col 4: 24/7 Senior Emergency Support */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-2">Emergency Safeguards</h4>
            <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <Phone className="w-4 h-4" />
                <span>24/7 Senior Crisis Line</span>
              </div>
              <div className="text-xl font-black text-white font-mono tracking-wider">
                1-800-677-1116
              </div>
              <p className="text-[11px] text-red-200/70">National Eldercare Locator & Emergency Support</p>
            </div>

            <div className="text-xs text-slate-400">
              <p>In immediate life-threatening danger, always call <strong className="text-white">911</strong> or use the 1-click SOS button.</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 AuraCare Platform. Designed with accessibility & clinical safety standards.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-slate-300">About Solution</Link>
            <Link to="/support" className="hover:text-slate-300">Contact & Support</Link>
            <Link to="/admin" className="hover:text-slate-300">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
