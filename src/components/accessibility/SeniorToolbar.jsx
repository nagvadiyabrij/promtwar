import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Volume2, Eye, Type, AlertCircle } from 'lucide-react';

export default function SeniorToolbar() {
  const { seniorMode, setSeniorMode, highContrast, setHighContrast, speak } = useAuth();
  const { setShowEmergencyModal } = useNotification();

  const handleReadCurrentScreen = () => {
    const pageTitle = document.title || 'AuraCare';
    const mainContent = document.querySelector('main')?.innerText || 'Welcome to AuraCare healthcare platform.';
    const snippet = mainContent.slice(0, 350).replace(/\n+/g, ' ');
    speak(`Reading screen: ${pageTitle}. ${snippet}`);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border-2 border-teal-500/30 shadow-2xl rounded-full px-4 py-2 flex items-center gap-2 sm:gap-4 transition-all hover:border-teal-500">
      {/* Read Aloud Button */}
      <button
        onClick={handleReadCurrentScreen}
        title="Listen to this page read aloud"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs sm:text-sm active:scale-95 transition"
      >
        <Volume2 className="w-4 h-4 text-teal-600" />
        <span className="hidden sm:inline">Listen Aloud</span>
      </button>

      {/* Senior Mode Toggle */}
      <button
        onClick={() => setSeniorMode(!seniorMode)}
        title="Toggle Senior-Friendly Large Display"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs sm:text-sm transition active:scale-95 ${
          seniorMode
            ? 'bg-teal-600 text-white shadow-sm'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
      >
        <Type className="w-4 h-4" />
        <span>Senior Mode {seniorMode ? 'ON' : 'OFF'}</span>
      </button>

      {/* High Contrast Toggle */}
      <button
        onClick={() => setHighContrast(!highContrast)}
        title="Toggle High Contrast for Vision Accessibility"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs sm:text-sm transition active:scale-95 ${
          highContrast
            ? 'bg-black text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
      >
        <Eye className="w-4 h-4" />
        <span className="hidden sm:inline">High Contrast</span>
      </button>

      {/* Quick SOS Trigger */}
      <button
        onClick={() => setShowEmergencyModal(true)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-500/20 active:scale-95 transition"
      >
        <AlertCircle className="w-4 h-4" />
        <span>SOS HELP</span>
      </button>
    </div>
  );
}
