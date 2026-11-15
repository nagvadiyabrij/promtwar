import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Bell, Mail, CheckCircle2, AlertTriangle, Eye, Send,
  RefreshCw, Sparkles, Clock, ShieldCheck
} from 'lucide-react';

export default function NotificationsPage() {
  const { token } = useAuth();
  const { showToast, setPreviewEmail } = useNotification();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningCron, setRunningCron] = useState(false);

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/reminders/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('[NotificationsPage] Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [token]);

  // Run Proactive Reminder Cron on Demand
  const handleRunCron = async () => {
    setRunningCron(true);
    try {
      const res = await fetch('/api/reminders/run-cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Proactive reminder scheduler ran successfully!', 'success');
        loadLogs();
      } else {
        showToast('Error executing cron check.', 'error');
      }
    } catch {
      showToast('Error executing cron check.', 'error');
    } finally {
      setRunningCron(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4 text-teal-600" />
            <span>Proactive Escalation & Dispatch Center</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Proactive Email Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated alerts dispatched for upcoming doses, missed medications, and doctor visits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleRunCron}
            disabled={runningCron}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{runningCron ? 'Checking...' : 'Run Reminder Engine Now'}</span>
          </button>
        </div>
      </div>

      {/* Overview Notice */}
      <div className="p-6 bg-teal-50/70 border border-teal-200 rounded-3xl flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-teal-900">
          <h4 className="font-bold">Automated Healthcare Safeguard</h4>
          <p className="text-xs sm:text-sm text-teal-800 leading-relaxed">
            The platform checks for overdue doses every 5 minutes. If an elderly person has not marked a scheduled dose within 30 minutes, an automated high-priority email alert is dispatched to designated caregivers and family members. Click <strong>"View Dispatched HTML"</strong> on any log below to inspect the rendered email.
          </p>
        </div>
      </div>

      {/* Dispatched Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display font-extrabold text-lg text-slate-900">
            Recent Proactive Reminders Dispatched ({logs.length})
          </h3>
          <span className="text-xs text-slate-400">Recorded in persistent database</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 font-semibold animate-pulse">
            Loading email logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No email logs found. Click "Run Reminder Engine Now" to trigger proactive checks.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold border-b">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject Line</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-xs">
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{log.recipient_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{log.recipient_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        log.type === 'missed_medication'
                          ? 'bg-rose-100 text-rose-800'
                          : log.type === 'appointment_reminder'
                          ? 'bg-blue-100 text-blue-800'
                          : log.type === 'emergency_sos'
                          ? 'bg-red-600 text-white'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispatched</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setPreviewEmail(log)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-600" />
                        <span>View HTML</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
