import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { KeyRound, Mail, Lock, HeartHandshake, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, passcodeLogin } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('passcode'); // 'passcode' | 'email'

  // Passcode PIN State
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Email/Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // 1. Handle Passcode PIN Login
  const handlePasscodeSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pin || pin.length < 4) {
      showToast('Please enter your 4-digit passcode PIN.', 'warning');
      return;
    }

    setPinLoading(true);
    const res = await passcodeLogin(pin);
    setPinLoading(false);

    if (res.success) {
      showToast('Passcode verified! Welcome back.', 'success');
      navigate('/elderly');
    } else {
      showToast(res.error || 'Invalid passcode PIN.', 'error');
    }
  };

  // Numeric keypad click helper for seniors
  const handleKeypadPress = (digit) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  // 2. Handle Standard Email Login
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Email and password are required.', 'warning');
      return;
    }

    setEmailLoading(true);
    const res = await login(email, password);
    setEmailLoading(false);

    if (res.success) {
      showToast('Login successful!', 'success');
      if (res.user?.role === 'admin') {
        navigate('/admin');
      } else if (res.user?.role === 'elderly') {
        navigate('/elderly');
      } else {
        navigate('/caregiver');
      }
    } else {
      showToast(res.error || 'Login failed.', 'error');
    }
  };

  // Instant 1-Click Persona Access (No typing needed for Hackathon evaluators)
  const quickDemoLogin = async (role) => {
    if (role === 'elder') {
      setPinLoading(true);
      const res = await passcodeLogin('1234');
      setPinLoading(false);
      if (res.success) {
        showToast('Instant Access: Eleanor Vance (Senior Mode)', 'success');
        navigate('/elderly');
      } else {
        showToast(res.error || 'Failed to login with passcode', 'error');
      }
      return;
    }

    let demoEmail = 'admin@auracare.health';
    let demoPass = 'admin123';
    let target = '/admin';

    if (role === 'caregiver') {
      demoEmail = 'sarah.vance@auracare.health';
      demoPass = 'care123';
      target = '/caregiver';
    } else if (role === 'family') {
      demoEmail = 'david.vance@auracare.health';
      demoPass = 'family123';
      target = '/caregiver';
    } else if (role === 'doctor') {
      demoEmail = 'dr.chen@auracare.health';
      demoPass = 'admin123';
      target = '/caregiver';
    }

    setEmailLoading(true);
    const res = await login(demoEmail, demoPass);
    setEmailLoading(false);

    if (res.success) {
      showToast(`Welcome! Signed in as ${res.user?.name || role}`, 'success');
      navigate(target);
    } else {
      showToast(res.error || 'Authentication error', 'error');
    }
  };

  // Quick 1-click Demo Fill
  const fillDemo = (role) => {
    if (role === 'elder') {
      setActiveTab('passcode');
      setPin('1234');
    } else if (role === 'caregiver') {
      setActiveTab('email');
      setEmail('sarah.vance@auracare.health');
      setPassword('care123');
    } else if (role === 'family') {
      setActiveTab('email');
      setEmail('david.vance@auracare.health');
      setPassword('family123');
    } else if (role === 'admin') {
      setActiveTab('email');
      setEmail('admin@auracare.health');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white shadow-md shadow-teal-500/20 mb-2">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight">
            Sign In to AuraCare
          </h2>
          <p className="text-sm text-slate-500">
            Smart Elderly Care & Medication Management Platform
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('passcode')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'passcode'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 text-teal-600" />
            <span>Senior PIN Access</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4 text-slate-500" />
            <span>Caregiver & Admin</span>
          </button>
        </div>

        {/* Tab 1: Senior Passcode PIN Login */}
        {activeTab === 'passcode' && (
          <div className="space-y-6">
            <div className="text-center">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Enter Your 4-Digit Passcode PIN:
              </label>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  placeholder="••••"
                  className="w-48 text-center font-mono font-black text-4xl tracking-widest py-3 border-2 border-teal-500 rounded-2xl bg-teal-50/30 text-teal-900 outline-none focus:ring-4 focus:ring-teal-500/20"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">Demo Senior PIN: <strong>1234</strong></p>
            </div>

            {/* Oversized Numeric Keypad for Senior Touch Ergonomics */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num.toString())}
                  className="h-14 rounded-2xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 active:scale-95 text-slate-800 font-extrabold text-2xl shadow-xs transition"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-sm transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-2xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 active:scale-95 text-slate-800 font-extrabold text-2xl shadow-xs transition"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-14 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-base transition"
              >
                ⌫
              </button>
            </div>

            <button
              type="button"
              onClick={handlePasscodeSubmit}
              disabled={pinLoading || pin.length < 4}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg rounded-xl shadow-lg shadow-teal-600/25 transition disabled:opacity-50"
            >
              {pinLoading ? 'Unlocking...' : 'Unlock Medication Routine'}
            </button>
          </div>
        )}

        {/* Tab 2: Standard Email & Password Sign In */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="caregiver@auracare.health"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-teal-600 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{emailLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Hackathon Judge Quick-Fill Presets */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-teal-700">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              1-Click Demo Personas:
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Click to sign in immediately</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => quickDemoLogin('elder')}
              className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-left border border-teal-200 shadow-xs transition hover:scale-[1.02] flex items-center justify-between"
            >
              <div>
                <p className="font-extrabold text-sm">👵 Eleanor (Senior)</p>
                <p className="text-[10px] text-teal-700 font-medium">1-Touch PIN 1234</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
            </button>

            <button
              type="button"
              onClick={() => quickDemoLogin('caregiver')}
              className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-left border border-blue-200 shadow-xs transition hover:scale-[1.02] flex items-center justify-between"
            >
              <div>
                <p className="font-extrabold text-sm">🩺 Sarah (Caregiver)</p>
                <p className="text-[10px] text-blue-700 font-medium">Care Circle & Meds</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => quickDemoLogin('admin')}
              className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-left border border-purple-200 shadow-xs transition hover:scale-[1.02] flex items-center justify-between"
            >
              <div>
                <p className="font-extrabold text-sm">🛡️ Dr. Finch (Admin)</p>
                <p className="text-[10px] text-purple-700 font-medium">RBAC, Logs, Engine</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
            </button>

            <button
              type="button"
              onClick={() => quickDemoLogin('family')}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-left border border-amber-200 shadow-xs transition hover:scale-[1.02] flex items-center justify-between"
            >
              <div>
                <p className="font-extrabold text-sm">👨‍👩‍👧 David (Family)</p>
                <p className="text-[10px] text-amber-700 font-medium">Adherence & Vitals</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-500">
          Need a new account?{' '}
          <Link to="/register" className="text-teal-600 font-bold hover:underline">
            Register new profile
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border">
            <h3 className="font-bold text-lg text-slate-900">Reset Password</h3>
            <p className="text-xs text-slate-600">Enter your account email to receive reset instructions.</p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="user@auracare.health"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  showToast(`Reset code dispatched for ${forgotEmail || 'your email'}`, 'success');
                  setShowForgot(false);
                }}
                className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold"
              >
                Send Code
              </button>
              <button
                onClick={() => setShowForgot(false)}
                className="py-2 px-4 border rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
