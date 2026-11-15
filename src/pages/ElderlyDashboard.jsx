import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import triggerConfetti from '../utils/confetti';
import {
  HeartHandshake, Volume2, CheckCircle2, Clock, Pill,
  AlertCircle, Sparkles, Calendar, Phone, ShieldAlert, Info
} from 'lucide-react';

export default function ElderlyDashboard() {
  const { user, elderlyProfile, activeProfileId, token, speak } = useAuth();
  const { showToast, setShowEmergencyModal } = useNotification();

  const [doses, setDoses] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [explainingMed, setExplainingMed] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch today's doses
  const fetchTodayDoses = async () => {
    try {
      const targetId = activeProfileId || elderlyProfile?.id || 'eld-eleanor-1';
      const res = await fetch(`/api/adherence/today?elderlyId=${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDoses(data.doses || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('[ElderlyDashboard] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayDoses();
  }, [activeProfileId, token]);

  // Handle 1-Click Dose Take
  const handleMarkTaken = async (dose) => {
    try {
      const res = await fetch('/api/adherence/log-dose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          log_id: dose.id,
          status: 'taken',
          notes: 'Confirmed by senior in 1-Touch Mode'
        })
      });
      const data = await res.json();

      if (data.success) {
        // Trigger celebratory confetti
        triggerConfetti();

        speak(`Great job! You confirmed taking ${dose.medication_name}.`);
        showToast(`Confirmed! ${dose.medication_name} recorded as taken.`, 'success');
        fetchTodayDoses();
      }
    } catch {
      showToast('Could not record dose. Please try again.', 'error');
    }
  };

  // Read entire daily routine aloud via Web Speech API
  const handleReadScheduleAloud = () => {
    if (doses.length === 0) {
      speak('You have no medications scheduled for today.');
      return;
    }

    const pending = doses.filter(d => d.status === 'pending');
    const taken = doses.filter(d => d.status === 'taken');

    let speechText = `Hello ${elderlyProfile?.full_name || 'Eleanor'}! `;
    if (pending.length === 0) {
      speechText += `Wonderful news! You have taken all your scheduled medications for today! Total adherence is 100 percent.`;
    } else {
      speechText += `You have ${pending.length} medication doses remaining for today. `;
      pending.forEach(d => {
        speechText += `At ${d.scheduled_time}, take ${d.medication_name}, ${d.dosage}, ${d.food_instruction?.replace('_', ' ') || 'with water'}. `;
      });
    }

    speak(speechText);
  };

  // AI Explain Medication in Simple Words
  const handleAskAiExplainer = async (medName) => {
    setExplainingMed(medName);
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/explain-medication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ medicationName: medName })
      });
      const data = await res.json();
      if (data.success) {
        setAiExplanation(data.explanation);
        speak(`Here is what ${medName} does: ` + data.explanation.replace(/[*#]/g, ''));
      }
    } catch {
      setAiExplanation('Unable to load AI explanation right now.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Friendly Senior Greeting Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white p-6 sm:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <HeartHandshake className="w-4 h-4" />
            <span>Senior Healthcare Companion</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight">
            Good Day, {elderlyProfile?.full_name || 'Eleanor'}! 🌸
          </h1>
          <p className="text-teal-100 text-base sm:text-lg max-w-xl">
            Here is your personalized medication schedule. Press the green button once you take each dose.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={handleReadScheduleAloud}
            className="px-6 py-4 bg-white text-teal-900 font-extrabold text-base sm:text-lg rounded-2xl shadow-lg hover:bg-slate-100 active:scale-95 transition flex items-center justify-center gap-2.5"
          >
            <Volume2 className="w-6 h-6 text-teal-600" />
            <span>Read Today's Routine</span>
          </button>

          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-lg shadow-red-500/30 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-6 h-6" />
            <span>Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* Adherence Progress Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-display font-extrabold text-xl text-slate-900">Today's Progress</h3>
          <p className="text-slate-500 text-sm">
            {summary.taken || 0} of {summary.total || 0} doses completed today
          </p>
        </div>

        <div className="w-full sm:w-64 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Adherence</span>
            <span className="text-teal-600 font-black">{summary.adherenceRate || 0}%</span>
          </div>
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.adherenceRate || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Medication Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
            Today's Prescribed Doses
          </h2>
          <span className="text-xs sm:text-sm font-bold text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 font-semibold animate-pulse">
            Loading your schedule...
          </div>
        ) : doses.length === 0 ? (
          <div className="p-10 bg-white rounded-3xl border text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto" />
            <h3 className="font-bold text-xl text-slate-800">No Medications Scheduled Today</h3>
            <p className="text-sm text-slate-500">All caught up! Check back tomorrow or review your doctor visits.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doses.map((dose) => {
              const isTaken = dose.status === 'taken';
              const isMissed = dose.status === 'missed';

              return (
                <div
                  key={dose.id}
                  className={`p-6 sm:p-8 rounded-3xl border-2 transition-all shadow-md flex flex-col justify-between gap-6 ${
                    isTaken
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : isMissed
                      ? 'bg-rose-50/70 border-rose-300'
                      : 'bg-white border-slate-200 hover:border-teal-500'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Time Badge and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 font-bold text-sm sm:text-base">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <span>Scheduled: {dose.scheduled_time}</span>
                      </div>

                      {isTaken ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs sm:text-sm">
                          <CheckCircle2 className="w-4 h-4" /> Taken
                        </span>
                      ) : isMissed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-xs sm:text-sm">
                          <AlertCircle className="w-4 h-4" /> Missed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs sm:text-sm">
                          Pending Dose
                        </span>
                      )}
                    </div>

                    {/* Medication Details */}
                    <div>
                      <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
                        {dose.medication_name}
                      </h3>
                      <div className="text-base sm:text-lg font-bold text-teal-700 mt-0.5">
                        {dose.dosage} • <span className="capitalize">{dose.form}</span>
                      </div>
                    </div>

                    {/* Visual Pill & Food Instruction */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-slate-500" />
                        <span>
                          <strong>Appearance:</strong> {dose.pill_color || 'White'} {dose.pill_shape || 'round'} pill
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-teal-600" />
                        <span>
                          <strong>Directions:</strong> {dose.food_instruction ? dose.food_instruction.replace('_', ' ') : 'Take with water'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="space-y-3 pt-2">
                    {!isTaken ? (
                      <button
                        onClick={() => handleMarkTaken(dose)}
                        className="w-full py-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-lg sm:text-xl rounded-2xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-3"
                      >
                        <CheckCircle2 className="w-7 h-7" />
                        <span>MARK AS TAKEN</span>
                      </button>
                    ) : (
                      <div className="py-3 bg-emerald-100/80 text-emerald-900 font-bold text-center rounded-xl text-sm">
                        ✓ Taken at {dose.action_timestamp ? new Date(dose.action_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled slot'}
                      </div>
                    )}

                    {/* AI Medication Explainer Button */}
                    <button
                      onClick={() => handleAskAiExplainer(dose.medication_name)}
                      className="w-full py-2.5 text-xs sm:text-sm text-teal-700 hover:text-teal-900 font-semibold flex items-center justify-center gap-1.5 hover:bg-teal-50 rounded-xl transition"
                    >
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>What does this medicine do? (AI Explainer)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Doctor Appointment Notice Card */}
      <div className="p-6 sm:p-8 bg-blue-50/70 border border-blue-200 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display font-extrabold text-xl text-slate-900">
              Upcoming Medical Checkup with Dr. Robert Chen
            </h4>
            <p className="text-sm text-slate-600">
              St. Jude Comprehensive Heart Center • Fast 4 hours prior to visit for lab work.
            </p>
          </div>
        </div>

        <button
          onClick={() => speak('Your appointment with Doctor Robert Chen is coming up in three days at 10:30 AM at St. Jude Heart Center.')}
          className="px-5 py-3 bg-white text-blue-900 font-bold text-sm rounded-xl shadow-xs border border-blue-200 hover:bg-blue-100 flex items-center gap-2 shrink-0"
        >
          <Volume2 className="w-4 h-4 text-blue-600" />
          <span>Listen Details</span>
        </button>
      </div>

      {/* AI Medication Explainer Modal */}
      {explainingMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-teal-700">
                <Sparkles className="w-6 h-6 text-teal-600" />
                <h3 className="font-display font-extrabold text-xl text-slate-900">
                  {explainingMed}
                </h3>
              </div>
              <button
                onClick={() => setExplainingMed(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 text-slate-800 text-base leading-relaxed whitespace-pre-line">
              {aiLoading ? 'Asking Google Gemini AI Health Companion...' : aiExplanation}
            </div>

            <button
              onClick={() => setExplainingMed(null)}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl"
            >
              Thank You, Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
