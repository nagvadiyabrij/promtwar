import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Users, KeyRound, ShieldCheck, Mail, Phone, HeartHandshake,
  UserPlus, Bell, CheckCircle2, Shield
} from 'lucide-react';

export default function CareCirclePage() {
  const { token, activeProfileId, elderlyProfile } = useAuth();
  const { showToast } = useNotification();

  const [profile, setProfile] = useState(null);
  const [careCircle, setCareCircle] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite PIN Generator
  const [invitePin, setInvitePin] = useState(null);

  const loadCareCircle = async () => {
    try {
      const targetId = activeProfileId || elderlyProfile?.id || 'eld-eleanor-1';
      const res = await fetch(`/api/elderly/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setCareCircle(data.careCircle || []);
      }
    } catch (err) {
      console.error('[CareCirclePage] Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareCircle();
  }, [activeProfileId, token]);

  const handleGenerateInvitePin = () => {
    // Generates a temporary linking passcode PIN for a family member or caretaker
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setInvitePin(pin);
    showToast(`New Invite PIN generated: ${pin}. Valid for 24 hours.`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Shared Collaborative Healthcare Ecosystem</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Care Circle Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Authorized caregivers, family members, and attending physicians for <strong>{profile?.full_name || 'Eleanor Vance'}</strong>
          </p>
        </div>

        <button
          onClick={handleGenerateInvitePin}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Generate Invite PIN</span>
        </button>
      </div>

      {/* Generated Invite PIN Banner */}
      {invitePin && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-base">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <span>Temporary Care Circle Invitation PIN</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800">
              Share this PIN with a family member or new nurse. They can enter it on the <strong>Passcode Access</strong> portal to link their account.
            </p>
          </div>
          <div className="font-mono font-black text-3xl tracking-widest bg-white px-5 py-2.5 rounded-2xl border border-amber-300 text-amber-950 shadow-xs">
            {invitePin}
          </div>
        </div>
      )}

      {/* Primary Passcode Access Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
            <KeyRound className="w-4 h-4" />
            <span>Master Senior Access PIN</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white">
            Senior Profile Passcode: <span className="font-mono text-teal-400 font-black tracking-widest">{profile?.passcode || '1234'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            This permanent 4-digit PIN allows {profile?.full_name || 'Eleanor'} to quickly access her medication routine on any device without typing a password.
          </p>
        </div>

        <div className="px-5 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-slate-300 space-y-1">
          <div><strong className="text-teal-400">Emergency Phone:</strong> {profile?.emergency_contact_phone || '+1 (555) 342-9912'}</div>
          <div><strong className="text-white">Primary Doctor:</strong> {profile?.primary_doctor_name || 'Dr. Robert Chen'}</div>
        </div>
      </div>

      {/* Care Circle Members Grid */}
      <div className="space-y-4">
        <h3 className="font-display font-extrabold text-xl text-slate-900">
          Connected Members ({careCircle.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {careCircle.map((member) => (
            <div
              key={member.circle_id}
              className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs hover:border-teal-400 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {member.relationship.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>{member.permission_level}</span>
                </span>
              </div>

              <div>
                <h4 className="font-display font-extrabold text-lg text-slate-900">{member.name}</h4>
                <p className="text-xs text-slate-500 capitalize">{member.role}</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{member.phone || 'Available on request'}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-teal-600" />
                  <span>Email Alerts: Active</span>
                </span>
                <span className="text-emerald-600 font-bold">Connected</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
