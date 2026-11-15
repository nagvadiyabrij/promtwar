import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, HeartHandshake, ShieldCheck, HelpCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function SupportPage() {
  const { showToast } = useNotification();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    showToast('Your message has been received by our senior care support team.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
          24/7 Elderly Care Support & Assistance
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Need help configuring medication schedules, linking a family member's passcode, or emergency protocols? Our team is available 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl space-y-2 text-center">
          <Phone className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="font-bold text-red-900 text-base">Emergency Crisis</h3>
          <p className="text-xs text-red-700">Immediate medical distress or acute symptoms</p>
          <div className="font-mono font-black text-xl text-red-700 pt-1">911</div>
        </div>

        <div className="p-6 bg-teal-50 border border-teal-200 rounded-3xl space-y-2 text-center">
          <HeartHandshake className="w-8 h-8 text-teal-600 mx-auto" />
          <h3 className="font-bold text-teal-900 text-base">Eldercare Locator</h3>
          <p className="text-xs text-teal-700">Community resources & caregiver assistance</p>
          <div className="font-mono font-black text-lg text-teal-800 pt-1">1-800-677-1116</div>
        </div>

        <div className="p-6 bg-blue-50 border border-blue-200 rounded-3xl space-y-2 text-center">
          <Mail className="w-8 h-8 text-blue-600 mx-auto" />
          <h3 className="font-bold text-blue-900 text-base">Clinical Support</h3>
          <p className="text-xs text-blue-700">Prescription sync & schedule assistance</p>
          <div className="text-xs font-bold text-blue-800 pt-2 truncate">care@auracare.health</div>
        </div>
      </div>

      {/* Support Message Form */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="font-display font-bold text-xl text-slate-900">
          Send a Support Request
        </h2>

        {sent ? (
          <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl text-center space-y-2">
            <h3 className="font-bold text-base">Thank You! Message Received</h3>
            <p className="text-xs">A support specialist will follow up shortly at {email}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Sarah Vance"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="sarah@example.com"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">How can we assist?</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Describe your inquiry or assistance required..."
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition"
            >
              Submit Support Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
