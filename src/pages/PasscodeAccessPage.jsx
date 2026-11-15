import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { KeyRound, ShieldCheck, HeartHandshake, ArrowRight, UserCheck } from 'lucide-react';

export default function PasscodeAccessPage() {
  const { user, token, passcodeLogin } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [relationship, setRelationship] = useState('family');
  const [loading, setLoading] = useState(false);

  const handleUnlockOrLink = async (e) => {
    e.preventDefault();

    if (!pin || pin.length < 4) {
      showToast('Please enter a valid 4-digit passcode PIN.', 'warning');
      return;
    }

    setLoading(true);

    // If user is already logged in as caretaker/family, link the elderly profile
    if (user && user.role !== 'elderly') {
      try {
        const res = await fetch('/api/elderly/link-by-passcode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ passcode: pin, relationship })
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message, 'success');
          navigate('/caregiver');
        } else {
          showToast(data.error || 'Failed to link profile.', 'error');
        }
      } catch (err) {
        showToast('Network error while linking profile.', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Otherwise, direct Senior Passcode Login
    const res = await passcodeLogin(pin);
    setLoading(false);

    if (res.success) {
      showToast('Passcode verified! Welcome to your Senior Dashboard.', 'success');
      navigate('/elderly');
    } else {
      showToast(res.error || 'Incorrect passcode PIN.', 'error');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500 text-white shadow-md shadow-teal-500/20 mb-2">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            {user && user.role !== 'elderly' ? 'Link Elder by Passcode PIN' : 'Senior Passcode Access'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {user && user.role !== 'elderly'
              ? 'Enter the 4-digit PIN provided by the senior or their primary physician'
              : 'Enter your 4-digit PIN to open your medication schedule and daily routine'}
          </p>
        </div>

        <form onSubmit={handleUnlockOrLink} className="space-y-6">
          <div className="text-center">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Passcode PIN
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              placeholder="1234"
              className="w-48 mx-auto text-center font-mono font-black text-3xl tracking-widest py-3 border-2 border-teal-500 rounded-2xl bg-teal-50/20 text-teal-900 outline-none focus:ring-4 focus:ring-teal-500/20"
            />
            <p className="text-xs text-slate-400 mt-2">Default demo PIN: <strong>1234</strong> (Eleanor Vance)</p>
          </div>

          {user && user.role !== 'elderly' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Relationship to Patient
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:border-teal-500"
              >
                <option value="primary_caretaker">Primary Caretaker / Nurse</option>
                <option value="daughter">Daughter</option>
                <option value="son">Son</option>
                <option value="spouse">Spouse</option>
                <option value="doctor">Attending Physician</option>
                <option value="other">Care Circle Assistant</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base sm:text-lg rounded-xl shadow-lg shadow-teal-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Verifying...' : user && user.role !== 'elderly' ? 'Link to My Care Circle' : 'Unlock Senior Routine'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Problem Statement Passcode Specification:</span>
          </div>
          <p>
            The platform provides passcode-based access so seniors, caretakers, and family members can securely access and coordinate on the elderly person's healthcare profile without barrier.
          </p>
        </div>
      </div>
    </div>
  );
}
