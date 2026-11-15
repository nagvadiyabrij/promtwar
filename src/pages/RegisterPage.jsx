import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { HeartHandshake, User, Mail, Lock, Phone, KeyRound, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [role, setRole] = useState('elderly');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('75');
  const [passcode, setPasscode] = useState('1234');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      showToast('Name, email, and password are required.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    setLoading(true);
    const res = await register({
      name,
      email,
      password,
      role,
      phone,
      age: role === 'elderly' ? age : undefined,
      passcode: role === 'elderly' ? passcode : undefined
    });
    setLoading(false);

    if (res.success) {
      showToast('Account registered successfully!', 'success');
      if (role === 'elderly') navigate('/elderly');
      else navigate('/caregiver');
    } else {
      showToast(res.error || 'Registration failed.', 'error');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500 text-white shadow-md shadow-teal-500/20 mb-2">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Create Your AuraCare Account
          </h2>
          <p className="text-sm text-slate-500">
            Join the interconnected care circle for seamless medication safety
          </p>
        </div>

        {/* Role Selector Cards */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Your Role in the Care Circle:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'elderly', label: 'Elderly Senior', icon: '👵' },
              { id: 'caretaker', label: 'Caregiver / Nurse', icon: '🩺' },
              { id: 'family', label: 'Family Member', icon: '👨‍👩‍👧' },
              { id: 'doctor', label: 'Doctor', icon: '👨‍⚕️' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  role === r.id
                    ? 'border-teal-500 bg-teal-50/80 text-teal-900 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-2xl">{r.icon}</span>
                <span className="text-xs leading-tight">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Eleanor Vance"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2831"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@auracare.health"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password (Min 6 Characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Conditional fields for Elderly Senior */}
          {role === 'elderly' && (
            <div className="bg-teal-50/70 p-4 rounded-xl border border-teal-200 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-teal-300 text-sm font-bold bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider mb-1">
                  4-Digit Passcode PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-600" />
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    maxLength={6}
                    placeholder="1234"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-teal-300 text-sm font-mono font-bold bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t">
          Already registered?{' '}
          <Link to="/login" className="text-teal-600 font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
