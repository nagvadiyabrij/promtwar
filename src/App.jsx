import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import SeniorToolbar from './components/accessibility/SeniorToolbar';
import EmergencyModal from './components/common/EmergencyModal';
import EmailPreviewModal from './components/common/EmailPreviewModal';

import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PasscodeAccessPage from './pages/PasscodeAccessPage';
import ElderlyDashboard from './pages/ElderlyDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import MedicationsPage from './pages/MedicationsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AdherenceAnalyticsPage from './pages/AdherenceAnalyticsPage';
import CareCirclePage from './pages/CareCirclePage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import SupportPage from './pages/SupportPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/passcode-access" element={<PasscodeAccessPage />} />
          <Route path="/elderly" element={<ElderlyDashboard />} />
          <Route path="/caregiver" element={<CaregiverDashboard />} />
          <Route path="/medications" element={<MedicationsPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/adherence" element={<AdherenceAnalyticsPage />} />
          <Route path="/care-circle" element={<CareCirclePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />

      {/* Global Modals & Senior Accessibility Controls */}
      <SeniorToolbar />
      <EmergencyModal />
      <EmailPreviewModal />
    </div>
  );
}
