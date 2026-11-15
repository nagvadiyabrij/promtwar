import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  HeartHandshake, Pill, Calendar, Activity, Users,
  Shield, Bell, LogOut, Menu, X, KeyRound, UserCheck, Sparkles, ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, elderlyProfile, logout, switchDemoRole } = useAuth();
  const { setShowEmergencyModal } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleRoleSwitch = async (role) => {
    setRoleMenuOpen(false);
    await switchDemoRole(role);
    if (role === 'elderly') navigate('/elderly');
    else if (role === 'admin') navigate('/admin');
    else navigate('/caregiver');
  };

  const navLinks = [
    { name: 'Senior Mode', path: '/elderly', icon: HeartHandshake, show: true },
    { name: 'Caregiver Portal', path: '/caregiver', icon: Users, show: true },
    { name: 'Medications', path: '/medications', icon: Pill, show: true },
    { name: 'Appointments', path: '/appointments', icon: Calendar, show: true },
    { name: 'Adherence', path: '/adherence', icon: Activity, show: true },
    { name: 'Care Circle', path: '/care-circle', icon: Users, show: !!user },
    { name: 'Admin', path: '/admin', icon: Shield, show: user?.role === 'admin' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-1">
                Aura<span className="text-teal-600">Care</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ml-1">AI 360</span>
              </span>
              <p className="text-[11px] text-slate-500 -mt-1 hidden sm:block font-medium">Smart Elderly & Medication Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.filter(l => l.show).map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Role Switcher (Crucial for Hackathon Evaluators) */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-teal-800 text-xs sm:text-sm font-semibold transition"
                title="Switch demo persona for testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Demo Persona:</span>
                <span className="capitalize font-bold text-teal-900">{user ? user.role : 'Guest'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                  <div className="px-3 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Switch Persona for Evaluation:
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('elderly')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 flex items-center justify-between text-slate-800 font-medium"
                  >
                    <span>👵 Eleanor (Elderly Senior)</span>
                    <span className="text-[10px] text-teal-600 font-bold">PIN: 1234</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('caretaker')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 flex items-center justify-between text-slate-800 font-medium"
                  >
                    <span>🩺 Sarah (Nurse & Caregiver)</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('family')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 flex items-center justify-between text-slate-800 font-medium"
                  >
                    <span>👨‍👩‍👧 David (Family Member)</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 flex items-center justify-between text-slate-800 font-medium"
                  >
                    <span>🛡️ Dr. Finch (System Admin)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Button */}
            <Link
              to="/notifications"
              className="relative p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              title="View Healthcare & Reminder Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
            </Link>

            {/* User Account / Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/passcode-access"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>PIN Access</span>
                </Link>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition"
                >
                  Log In
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1">
          {navLinks.filter(l => l.show).map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold ${
                  isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 text-teal-600" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
