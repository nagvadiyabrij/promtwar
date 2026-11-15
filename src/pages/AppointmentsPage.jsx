import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Calendar, Clock, MapPin, User, FileText, Download,
  Plus, ExternalLink, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function AppointmentsPage() {
  const { token, activeProfileId, elderlyProfile } = useAuth();
  const { showToast } = useNotification();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Cardiologist');
  const [hospitalClinic, setHospitalClinic] = useState('St. Jude Comprehensive Heart Center');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:30 AM');
  const [location, setLocation] = useState('Suite 402, 1200 Health Parkway');
  const [reason, setReason] = useState('Routine 6-Month Hypertension Follow-up');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAppointments = async () => {
    try {
      const targetId = activeProfileId || elderlyProfile?.id || 'eld-eleanor-1';
      const res = await fetch(`/api/appointments?elderlyId=${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('[AppointmentsPage] Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [activeProfileId, token]);

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!doctorName || !appointmentDate || !appointmentTime) return;

    setSubmitting(true);
    try {
      const targetId = activeProfileId || elderlyProfile?.id || 'eld-eleanor-1';
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          elderly_id: targetId,
          doctor_name: doctorName,
          specialty,
          hospital_clinic: hospitalClinic,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          location,
          reason_for_visit: reason,
          clinical_notes: clinicalNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setShowAddModal(false);
        loadAppointments();
      } else {
        showToast(data.error || 'Failed to schedule appointment.', 'error');
      }
    } catch {
      showToast('Error scheduling appointment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Healthcare Appointments & Clinical Visits</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Medical Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Proactive consultation reminders, location details, and Google Calendar sync
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Appointment</span>
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-semibold animate-pulse">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-lg text-slate-700">No Appointments Scheduled</h3>
          <p className="text-xs text-slate-400">Click "Schedule Appointment" to add a consultation or hospital visit.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {appointments.map((apt) => {
            const isUpcoming = apt.status === 'upcoming';

            return (
              <div
                key={apt.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 p-6 sm:p-8 shadow-xs transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display font-black text-lg text-teal-700">
                      {apt.appointment_date}
                    </span>
                    <span className="text-xs font-bold text-slate-400">•</span>
                    <span className="font-bold text-sm text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      {apt.appointment_time}
                    </span>
                    <span className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isUpcoming ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {apt.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-black text-2xl text-slate-900">
                      {apt.doctor_name}
                    </h3>
                    <p className="text-sm font-semibold text-teal-600">
                      {apt.specialty} • {apt.hospital_clinic}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{apt.location || 'Consultation Clinic'}</span>
                    </div>
                    {apt.reason_for_visit && (
                      <div><strong>Reason:</strong> {apt.reason_for_visit}</div>
                    )}
                    {apt.clinical_notes && (
                      <div className="bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200 mt-2">
                        <strong>Preparation Note:</strong> {apt.clinical_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Calendar Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                  <a
                    href={apt.googleCalendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Add to Google Calendar</span>
                  </a>

                  <a
                    href={`/api/appointments/${apt.id}/calendar.ics`}
                    download
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .ics File</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAddAppointment}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border"
          >
            <h3 className="font-display font-extrabold text-xl text-slate-900">
              Schedule Medical Consultation
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Dr. Robert Chen"
                  required
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Specialty</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Cardiologist"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hospital / Clinic</label>
              <input
                type="text"
                value={hospitalClinic}
                onChange={(e) => setHospitalClinic(e.target.value)}
                placeholder="Memorial Medical Center"
                required
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time</label>
                <input
                  type="text"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  placeholder="10:30 AM"
                  required
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinic Address / Suite</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Suite 402, 1200 Health Parkway"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Visit</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Blood pressure review & echocardiogram"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preparation Note (Optional)</label>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="e.g. Fast for 4 hours prior to blood sample"
                className="w-full px-3 py-2 border rounded-xl text-sm h-20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm"
              >
                {submitting ? 'Saving...' : 'Save Appointment'}
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
