import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Users, Activity, Bell, Calendar, Pill, AlertTriangle,
  CheckCircle2, Plus, HeartHandshake, Sparkles, Send, RefreshCw, Eye
} from 'lucide-react';

export default function CaregiverDashboard() {
  const { user, token, activeProfileId, setActiveProfileId } = useAuth();
  const { showToast, setPreviewEmail } = useNotification();

  const [profiles, setProfiles] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [doses, setDoses] = useState([]);
  const [summary, setSummary] = useState({});
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vitals quick input
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [vitalType, setVitalType] = useState('blood_pressure');
  const [vitalValue, setVitalValue] = useState('');
  const [vitalUnit, setVitalUnit] = useState('mmHg');

  // Triggering proactive reminder email
  const [dispatching, setDispatching] = useState(false);

  // 1. Fetch accessible elderly profiles
  const loadProfiles = async () => {
    try {
      const res = await fetch('/api/elderly', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.profiles?.length > 0) {
        setProfiles(data.profiles);
        if (!activeProfileId) {
          setActiveProfileId(data.profiles[0].id);
        }
      }
    } catch (err) {
      console.error('[CaregiverDashboard] Error loading profiles:', err);
    }
  };

  // 2. Fetch active profile data, today's doses, and vitals
  const loadDashboardData = async () => {
    const targetId = activeProfileId || 'eld-eleanor-1';
    try {
      const [profRes, doseRes, vitRes] = await Promise.all([
        fetch(`/api/elderly/${targetId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/adherence/today?elderlyId=${targetId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/appointments/vitals?elderlyId=${targetId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [profData, doseData, vitData] = await Promise.all([
        profRes.json(),
        doseRes.json(),
        vitRes.json()
      ]);

      if (profData.success) setProfileData(profData);
      if (doseData.success) {
        setDoses(doseData.doses || []);
        setSummary(doseData.summary || {});
      }
      if (vitData.success) setVitals(vitData.vitals || []);
    } catch (err) {
      console.error('[CaregiverDashboard] Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [token]);

  useEffect(() => {
    if (activeProfileId) {
      loadDashboardData();
    }
  }, [activeProfileId, token]);

  // Handle Dose Confirmation by Caregiver
  const handleUpdateDoseStatus = async (logId, status) => {
    try {
      const res = await fetch('/api/adherence/log-dose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          log_id: logId,
          status,
          notes: `Verified by caregiver (${user?.name || 'Staff'})`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadDashboardData();
      }
    } catch {
      showToast('Could not update dose status.', 'error');
    }
  };

  // Dispatch Proactive Reminder Email
  const handleSendProactiveReminder = async (type = 'upcoming_dose') => {
    setDispatching(true);
    try {
      const targetId = activeProfileId || 'eld-eleanor-1';
      const res = await fetch('/api/reminders/send-immediate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          elderly_id: targetId,
          recipient_email: user?.email || 'sarah.vance@auracare.health',
          recipient_name: user?.name || 'Sarah Vance, RN',
          message_type: type
        })
      });
      const data = await res.json();
      if (data.success && data.dispatchedEmail) {
        showToast('Proactive email reminder generated and dispatched!', 'success');
        setPreviewEmail(data.dispatchedEmail);
      }
    } catch {
      showToast('Error dispatching reminder email.', 'error');
    } finally {
      setDispatching(false);
    }
  };

  // Record Vital
  const handleRecordVital = async (e) => {
    e.preventDefault();
    if (!vitalValue) return;

    try {
      const targetId = activeProfileId || 'eld-eleanor-1';
      const res = await fetch('/api/appointments/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          elderly_id: targetId,
          type: vitalType,
          value: vitalValue,
          unit: vitalUnit,
          notes: 'Routine checkup logged by Caregiver'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setShowVitalModal(false);
        setVitalValue('');
        loadDashboardData();
      }
    } catch {
      showToast('Error saving vital.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar: Profile Selector & Action Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Caregiver & Family Ecosystem</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            {profileData?.profile?.full_name || 'Eleanor Vance'}'s Care Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Age {profileData?.profile?.age || 78} • Passcode PIN: <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{profileData?.profile?.passcode || '1234'}</span> • Emergency: {profileData?.profile?.emergency_contact_phone || '+1 (555) 342-9912'}
          </p>
        </div>

        {/* Profile Switcher dropdown & Proactive Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          {profiles.length > 1 && (
            <select
              value={activeProfileId || ''}
              onChange={(e) => setActiveProfileId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold outline-none focus:border-teal-500"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name} (Age {p.age})</option>
              ))}
            </select>
          )}

          {/* Trigger Proactive Reminder Button */}
          <button
            onClick={() => handleSendProactiveReminder('missed_medication')}
            disabled={dispatching}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-2"
            title="Demonstrate proactive email reminder dispatch"
          >
            <Send className="w-4 h-4" />
            <span>{dispatching ? 'Sending...' : 'Trigger Proactive Alert'}</span>
          </button>

          <button
            onClick={() => setShowVitalModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Log Vitals</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Adherence Rate</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{summary.adherenceRate || 92}%</div>
          <p className="text-[11px] text-teal-600 font-bold">Target: 95%+ for health safety</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Doses Taken Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {summary.taken || 0} / {summary.total || 0}
          </div>
          <p className="text-[11px] text-slate-400">Doses confirmed</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Doses</span>
            <Pill className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{summary.pending || 0}</div>
          <p className="text-[11px] text-slate-400">Scheduled for later today</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Care Circle Members</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-600">{profileData?.careCircle?.length || 3}</div>
          <p className="text-[11px] text-slate-400">Family & clinicians notified</p>
        </div>
      </div>

      {/* Main Grid: Today's Administration Checklist + Health Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Col 1 & 2: Today's Medication Checklist */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-xl text-slate-900">
                Today's Medication Schedule
              </h2>
              <p className="text-xs text-slate-500">Live monitoring & dose administration status</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="p-2 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100"
              title="Refresh Doses"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {doses.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No scheduled doses for today.</div>
            ) : (
              doses.map((dose) => (
                <div
                  key={dose.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {dose.scheduled_time}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        dose.status === 'taken'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dose.status === 'missed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {dose.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">
                      {dose.medication_name} ({dose.dosage})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Instruction: {dose.food_instruction?.replace('_', ' ') || 'Take with water'} • Stock remaining: {dose.stock_remaining} pills
                    </p>
                  </div>

                  {/* Caregiver Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {dose.status !== 'taken' && (
                      <button
                        onClick={() => handleUpdateDoseStatus(dose.id, 'taken')}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Taken</span>
                      </button>
                    )}

                    {dose.status !== 'missed' && dose.status !== 'taken' && (
                      <button
                        onClick={() => handleUpdateDoseStatus(dose.id, 'missed')}
                        className="flex-1 sm:flex-none px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
                      >
                        Mark Missed
                      </button>
                    )}

                    {dose.status === 'taken' && (
                      <span className="text-xs text-slate-400 italic">
                        Verified at {dose.action_timestamp ? new Date(dose.action_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Col 3: Vitals & Clinical Health Routines */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-lg text-slate-900">
                Health Vitals & Routines
              </h3>
              <button
                onClick={() => setShowVitalModal(true)}
                className="text-xs text-teal-600 hover:underline font-bold"
              >
                + Add Reading
              </button>
            </div>

            <div className="space-y-3">
              {vitals.length === 0 ? (
                <p className="text-xs text-slate-400">No vitals logged yet today.</p>
              ) : (
                vitals.slice(0, 5).map((vital) => (
                  <div key={vital.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 capitalize">
                        {vital.type.replace('_', ' ')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Logged by {vital.recorded_by_name || 'Caregiver'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-700 text-sm">
                        {vital.value} <span className="text-xs font-normal text-slate-500">{vital.unit}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clinical Profile Summary Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-teal-400">
              Elderly Clinical Safeguards
            </h3>
            <div className="text-xs space-y-2 text-slate-300">
              <div>
                <strong className="text-white">Chronic Conditions:</strong>
                <p className="text-slate-400">{profileData?.profile?.chronic_conditions || 'Hypertension, Type 2 Diabetes'}</p>
              </div>
              <div>
                <strong className="text-rose-400">Critical Allergies:</strong>
                <p className="text-rose-200">{profileData?.profile?.known_allergies || 'Penicillin, Sulfa drugs'}</p>
              </div>
              <div>
                <strong className="text-white">Primary Cardiologist:</strong>
                <p className="text-slate-400">{profileData?.profile?.primary_doctor_name || 'Dr. Robert Chen (+1 555 602-4411)'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Vital Modal */}
      {showVitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleRecordVital} className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border">
            <h3 className="font-bold text-lg text-slate-900">Record Health Vital</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vital Type</label>
              <select
                value={vitalType}
                onChange={(e) => {
                  setVitalType(e.target.value);
                  if (e.target.value === 'blood_pressure') setVitalUnit('mmHg');
                  else if (e.target.value === 'glucose') setVitalUnit('mg/dL');
                  else if (e.target.value === 'heart_rate') setVitalUnit('bpm');
                  else if (e.target.value === 'hydration') setVitalUnit('Liters');
                }}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              >
                <option value="blood_pressure">Blood Pressure (e.g. 120/80)</option>
                <option value="glucose">Blood Glucose (e.g. 105)</option>
                <option value="heart_rate">Heart Rate (e.g. 72)</option>
                <option value="hydration">Hydration (e.g. 1.8)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reading Value</label>
              <input
                type="text"
                value={vitalValue}
                onChange={(e) => setVitalValue(e.target.value)}
                placeholder="120/80"
                required
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm">
                Save Reading
              </button>
              <button
                type="button"
                onClick={() => setShowVitalModal(false)}
                className="py-2.5 px-4 border rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
