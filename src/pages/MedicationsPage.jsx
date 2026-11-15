import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Pill, Plus, Sparkles, AlertTriangle, ShieldCheck,
  RefreshCw, Trash2, Edit3, CheckCircle2, Clock
} from 'lucide-react';

export default function MedicationsPage() {
  const { token, activeProfileId, elderlyProfile } = useAuth();
  const { showToast } = useNotification();

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState('tablet');
  const [frequency, setFrequency] = useState('daily');
  const [timingSlots, setTimingSlots] = useState(['Morning (08:00)']);
  const [foodInstruction, setFoodInstruction] = useState('after_meal');
  const [pillShape, setPillShape] = useState('round');
  const [pillColor, setPillColor] = useState('white');
  const [stockRemaining, setStockRemaining] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(7);
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Interaction Checker State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // 1. Fetch Medications
  const loadMedications = async () => {
    try {
      const targetId = activeProfileId || elderlyProfile?.id || 'eld-eleanor-1';
      const res = await fetch(`/api/medications?elderlyId=${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMedications(data.medications || []);
      }
    } catch (err) {
      console.error('[MedicationsPage] Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, [activeProfileId, token]);

  // 2. Add Medication
  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!name || !dosage) return;

    setSubmitting(true);
    try {
      const targetId = activeProfileId || elderlyProfile?.id || 'eld-eleanor-1';
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          elderly_id: targetId,
          name,
          dosage,
          form,
          frequency,
          timing_slots: timingSlots,
          food_instruction: foodInstruction,
          pill_shape: pillShape,
          pill_color: pillColor,
          stock_remaining: stockRemaining,
          refill_threshold: refillThreshold,
          purpose
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        setShowAddModal(false);
        resetForm();
        loadMedications();
      } else {
        showToast(data.error || 'Failed to add medication.', 'error');
      }
    } catch {
      showToast('Network error while adding medication.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setForm('tablet');
    setFrequency('daily');
    setTimingSlots(['Morning (08:00)']);
    setFoodInstruction('after_meal');
    setPillShape('round');
    setPillColor('white');
    setStockRemaining(30);
    setRefillThreshold(7);
    setPurpose('');
  };

  // 3. Refill Stock
  const handleRefill = async (id, medName) => {
    try {
      const res = await fetch(`/api/medications/${id}/refill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ addQuantity: 30 })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadMedications();
      }
    } catch {
      showToast('Error refilling stock.', 'error');
    }
  };

  // 4. Delete Medication
  const handleDelete = async (id, medName) => {
    if (!confirm(`Are you sure you want to remove ${medName} from the schedule?`)) return;

    try {
      const res = await fetch(`/api/medications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadMedications();
      }
    } catch {
      showToast('Error deleting medication.', 'error');
    }
  };

  // 5. Run AI Drug Interaction Checker
  const handleCheckInteractions = async () => {
    setAiLoading(true);
    const medNames = medications.map(m => m.name);

    try {
      const res = await fetch('/api/ai/check-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          medications: medNames,
          conditions: ['Hypertension', 'Type 2 Diabetes'],
          allergies: ['Penicillin']
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data);
      }
    } catch {
      showToast('Error evaluating drug safety.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Pill className="w-4 h-4 text-teal-600" />
            <span>Medication Management & Safety</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Prescription Schedule & Refills
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage daily dosages, timing slots, visual pill shapes, and automated refill tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckInteractions}
            disabled={aiLoading || medications.length === 0}
            className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>{aiLoading ? 'Analyzing...' : 'AI Interaction Check'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* AI Drug Interaction Report Card (If triggered) */}
      {aiAnalysis && (
        <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-900 font-extrabold text-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Google Gemini AI Drug Interaction Analysis</span>
              <span className="text-xs font-semibold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                {aiAnalysis.source}
              </span>
            </div>
            <button
              onClick={() => setAiAnalysis(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Close Assessment ✕
            </button>
          </div>

          <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
            {aiAnalysis.analysis}
          </div>
        </div>
      )}

      {/* Medications Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-semibold animate-pulse">
          Loading medications...
        </div>
      ) : medications.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border text-center space-y-3">
          <Pill className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-lg text-slate-700">No Medications Added Yet</h3>
          <p className="text-xs text-slate-400">Click "Add Medication" above to create the first daily prescription.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map((med) => {
            const isLowStock = med.stock_remaining <= med.refill_threshold;

            return (
              <div
                key={med.id}
                className={`bg-white rounded-3xl border p-6 flex flex-col justify-between gap-5 transition hover:shadow-md ${
                  isLowStock ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  {/* Form & Stock Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                      {med.form} • {med.frequency.replace('_', ' ')}
                    </span>

                    {isLowStock ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {med.stock_remaining} pills left
                      </span>
                    )}
                  </div>

                  {/* Name & Dosage */}
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-900">{med.name}</h3>
                    <p className="text-sm font-bold text-teal-600 mt-0.5">{med.dosage}</p>
                  </div>

                  {/* Purpose & Timing */}
                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div>
                      <strong className="text-slate-800">Purpose:</strong> {med.purpose || 'Prescribed health maintenance'}
                    </div>
                    <div>
                      <strong className="text-slate-800">Scheduled Slots:</strong>{' '}
                      {med.timing_slots ? med.timing_slots.join(', ') : 'Daily'}
                    </div>
                    <div>
                      <strong className="text-slate-800">Visual Pill:</strong>{' '}
                      <span className="capitalize">{med.pill_color || 'white'}</span> {med.pill_shape || 'round'}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleRefill(med.id, med.name)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                    title="Add 30 pills to remaining inventory"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Refill (+30)</span>
                  </button>

                  <button
                    onClick={() => handleDelete(med.id, med.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Remove medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAddMedication}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-xl text-slate-900">
                Add New Medication
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Medication Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metformin HCl"
                  required
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dosage</label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 500 mg"
                  required
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Form</label>
                <select
                  value={form}
                  onChange={(e) => setForm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="tablet">Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="syrup">Liquid / Syrup</option>
                  <option value="drops">Drops</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Daily Timing Slot</label>
              <select
                value={timingSlots[0]}
                onChange={(e) => setTimingSlots([e.target.value])}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              >
                <option value="Morning (08:00)">Morning (08:00)</option>
                <option value="Afternoon (13:00)">Afternoon (13:00)</option>
                <option value="Evening (19:00)">Evening (19:00)</option>
                <option value="Night (21:00)">Night (21:00)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pill Color</label>
                <select
                  value={pillColor}
                  onChange={(e) => setPillColor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="white">White</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="pink">Pink</option>
                  <option value="red">Red</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pill Shape</label>
                <select
                  value={pillShape}
                  onChange={(e) => setPillShape(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="round">Round</option>
                  <option value="oval">Oval</option>
                  <option value="capsule">Capsule</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Remaining</label>
                <input
                  type="number"
                  value={stockRemaining}
                  onChange={(e) => setStockRemaining(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Refill Threshold</label>
                <input
                  type="number"
                  value={refillThreshold}
                  onChange={(e) => setRefillThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Purpose / Indication</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Blood pressure regulation"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm"
              >
                {submitting ? 'Saving...' : 'Save Medication to Schedule'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="py-3 px-5 border rounded-xl text-sm font-semibold"
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
