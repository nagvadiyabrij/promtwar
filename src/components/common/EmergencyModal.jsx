import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { AlertTriangle, Phone, ShieldAlert, X, CheckCircle } from 'lucide-react';

export default function EmergencyModal() {
  const { user, elderlyProfile, activeProfileId, token, speak } = useAuth();
  const { showEmergencyModal, setShowEmergencyModal, showToast } = useNotification();
  const [triggering, setTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [countdown, setCountdown] = useState(3);

  if (!showEmergencyModal) return null;

  const handleTriggerSOS = async () => {
    setTriggering(true);
    speak('Emergency SOS alert activated. Alerting your family and caretakers immediately.');

    try {
      const targetId = activeProfileId || elderlyProfile?.id || 'eld-eleanor-1';
      const res = await fetch(`/api/elderly/${targetId}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          locationNotes: 'Living Room - Home Residence'
        })
      });
      const data = await res.json();

      if (data.success) {
        setTriggered(true);
        showToast(data.message, 'error', 8000);
      } else {
        showToast('Error broadcasting SOS: ' + data.error, 'error');
      }
    } catch (err) {
      showToast('Network error while broadcasting SOS.', 'error');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-red-500 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3 animate-pulse">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-wide">Emergency SOS Distress Broadcast</h2>
          <p className="text-red-100 text-sm mt-1">Instant Notification to Care Circle & Emergency Contacts</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!triggered ? (
            <div className="space-y-5 text-center">
              <p className="text-slate-700 font-medium text-base">
                Pressing the button below will immediately dispatch an <strong className="text-red-600">Urgent Alert Email & SMS Notification</strong> to all linked caregivers, family members, and emergency medical personnel.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left text-sm text-red-900 space-y-1">
                <div><strong>Patient:</strong> {elderlyProfile?.full_name || 'Eleanor Vance (Age 78)'}</div>
                <div><strong>Emergency Contact:</strong> {elderlyProfile?.emergency_contact_name || 'Sarah Vance (Daughter / Caretaker)'}</div>
                <div><strong>Direct Phone:</strong> <span className="font-mono font-bold text-red-700">{elderlyProfile?.emergency_contact_phone || '+1 (555) 342-9912'}</span></div>
                <div><strong>Allergies:</strong> {elderlyProfile?.known_allergies || 'Penicillin, Sulfa drugs'}</div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  onClick={handleTriggerSOS}
                  disabled={triggering}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xl rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                  {triggering ? 'BROADCASTING SOS...' : 'BROADCAST EMERGENCY SOS NOW'}
                </button>

                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-100"
                >
                  Cancel (False Alarm)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">SOS Alerts Dispatched Successfully!</h3>
              <p className="text-slate-600 text-sm">
                Emergency emails have been broadcast to your care circle. Caretaker <strong>Sarah Vance</strong> and family member <strong>David Vance</strong> have been notified.
              </p>

              <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-center gap-3 text-slate-900 font-bold">
                <Phone className="w-5 h-5 text-teal-600" />
                <span>Call Caregiver Now: {elderlyProfile?.emergency_contact_phone || '+1 (555) 342-9912'}</span>
              </div>

              <button
                onClick={() => {
                  setTriggered(false);
                  setShowEmergencyModal(false);
                }}
                className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800"
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
