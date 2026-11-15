import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  Activity, Award, CheckCircle2, AlertCircle, Download, Calendar, Filter
} from 'lucide-react';

export default function AdherenceAnalyticsPage() {
  const { token, activeProfileId, elderlyProfile } = useAuth();
  const { showToast } = useNotification();

  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadAnalytics = async () => {
    try {
      const targetId = activeProfileId || elderlyProfile?.id || 'eld-eleanor-1';
      const [anRes, logRes] = await Promise.all([
        fetch(`/api/adherence/analytics?elderlyId=${targetId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/adherence/today?elderlyId=${targetId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [anData, logData] = await Promise.all([anRes.json(), logRes.json()]);

      if (anData.success) setAnalytics(anData);
      if (logData.success) setLogs(logData.doses || []);
    } catch (err) {
      console.error('[AdherenceAnalytics] Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [activeProfileId, token]);

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = ['Date', 'Day', 'Taken', 'Missed', 'Skipped', 'AdherenceRate%'];
    const rows = analytics?.dailyTrends?.map(d => [
      d.date, d.day, d.taken, d.missed, d.skipped, d.adherenceRate
    ]) || [];

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `adherence-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Adherence CSV report downloaded!', 'success');
  };

  const filteredLogs = filterStatus === 'all'
    ? logs
    : logs.filter(l => l.status === filterStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Adherence Intelligence & Clinical Analytics</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Medication Adherence Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Evaluating historical compliance, streaks, and risk factors over time
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 border border-slate-200"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* High-Level Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Compliance</div>
          <div className="text-4xl font-black text-teal-700">
            {analytics?.stats?.overallAdherenceRate || 94}%
          </div>
          <p className="text-xs text-slate-500">Benchmark: 95% maintains optimal clinical efficacy</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Healthy Streak</div>
          <div className="text-4xl font-black text-emerald-600 flex items-center gap-2">
            <Award className="w-8 h-8 text-amber-500" />
            <span>{analytics?.stats?.currentStreakDays || 5} Days</span>
          </div>
          <p className="text-xs text-slate-500">Consecutive days without any missed doses</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tracked Regimens</div>
          <div className="text-4xl font-black text-slate-900">
            {analytics?.stats?.totalDosesLogged || 28}
          </div>
          <p className="text-xs text-slate-500">Verified through caregiver & senior check-offs</p>
        </div>
      </div>

      {/* Visual Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: 7-Day Adherence Percentage Trend */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-display font-extrabold text-lg text-slate-900">
              7-Day Adherence Percentage
            </h3>
            <p className="text-xs text-slate-400">Daily adherence compliance rate</p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.dailyTrends || []}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="adherenceRate" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#tealGrad)" name="Adherence %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Doses Breakdown: Taken vs Missed */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-display font-extrabold text-lg text-slate-900">
              Doses Taken vs. Missed
            </h3>
            <p className="text-xs text-slate-400">Daily volume of administered doses</p>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.dailyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="taken" fill="#10b981" name="Taken on Time" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" fill="#ef4444" name="Missed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="skipped" fill="#f59e0b" name="Skipped" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Detailed Adherence Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-extrabold text-xl text-slate-900">
              Today's Adherence Audit Log
            </h3>
            <p className="text-xs text-slate-500">Every dose interaction with timestamp and administrator verifications</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border rounded-xl text-xs font-semibold outline-none focus:border-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="taken">Taken</option>
              <option value="pending">Pending</option>
              <option value="missed">Missed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold border-b">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">Dosage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verified By</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{log.scheduled_time}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.medication_name}</td>
                  <td className="py-3.5 px-4 text-teal-700 font-semibold">{log.dosage}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                      log.status === 'taken'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.status === 'missed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{log.logged_by_name || 'Self (Senior)'}</td>
                  <td className="py-3.5 px-4 text-slate-400 italic text-xs">{log.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
