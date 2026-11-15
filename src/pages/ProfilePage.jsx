import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { User, Phone, Mail, KeyRound, Shield, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, elderlyProfile, token } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [allergies, setAllergies] = useState(elderlyProfile?.known_allergies || 'Penicillin, Sulfa drugs');
  const [conditions, setConditions] = useState(elderlyProfile?.chronic_conditions || 'Hypertension, Type 2 Diabetes');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
    if (elderlyProfile) {
      setAllergies(elderlyProfile.known_allergies || '');
      setConditions(elderlyProfile.chronic_conditions || '');
    }
  }, [user, elderlyProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to update profile.', 'error');
      }
    } catch {
      showToast('Error updating profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-slate-900">
          Profile & Medical Preferences
        </h1>
        <p className="text-sm text-slate-500">
          Manage your personal details, emergency contacts, and clinical safeguards
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email (Account ID)</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2831"
                className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role in Care Ecosystem</label>
            <div className="p-3 bg-teal-50 text-teal-800 rounded-xl text-sm font-bold capitalize flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>{user?.role || 'Elderly'}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </form>
    </div>
  );
}
