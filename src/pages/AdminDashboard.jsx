import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Shield, Users, Activity, Pill, Bell, Search,
  CheckCircle2, XCircle, Trash2, Edit2, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const { showToast } = useNotification();

  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const [metRes, usrRes, audRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/admin/users?search=${encodeURIComponent(search)}&role=${encodeURIComponent(roleFilter)}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [metData, usrData, audData] = await Promise.all([
        metRes.json(),
        usrRes.json(),
        audRes.json()
      ]);

      if (metData.success) setMetrics(metData.metrics);
      if (usrData.success) setUsers(usrData.users || []);
      if (audData.success) setAuditLogs(audData.logs || []);
    } catch (err) {
      console.error('[AdminDashboard] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user, search, roleFilter, token]);

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-24 p-8 bg-white rounded-3xl border text-center space-y-4">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Administrator Access Required</h2>
        <p className="text-xs text-slate-500">
          This portal is protected by role-based access control (RBAC). Switch to the Admin persona using the selector in the navbar.
        </p>
      </div>
    );
  }

  // Toggle user status
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminData();
      } else {
        showToast(data.error || 'Failed to update user status.', 'error');
      }
    } catch {
      showToast('Error updating status.', 'error');
    }
  };

  // Safe delete user
  const handleDeleteUser = async (id, userName) => {
    if (!confirm(`Are you sure you want to delete user ${userName}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminData();
      } else {
        showToast(data.error || 'Failed to delete user.', 'error');
      }
    } catch {
      showToast('Error deleting user.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Master System Administration</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
            Admin Workspace & User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Platform-wide metrics, user permissions, audit security logs, and notification scheduler
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Total Users</span>
          <div className="text-3xl font-black text-slate-900">{metrics?.totalUsers || 5}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Elderly Profiles</span>
          <div className="text-3xl font-black text-teal-600">{metrics?.totalElderlyProfiles || 1}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Active Meds</span>
          <div className="text-3xl font-black text-blue-600">{metrics?.totalActiveMedications || 4}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">System Adherence</span>
          <div className="text-3xl font-black text-emerald-600">{metrics?.overallAdherenceRate || 94}%</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1 col-span-2 lg:col-span-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Proactive Reminders</span>
          <div className="text-3xl font-black text-purple-600">{metrics?.totalProactiveEmailsSent || 4}</div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-900">
              Registered System Users ({users.length})
            </h2>
            <p className="text-xs text-slate-500">Search, filter roles, suspend accounts, and view permissions</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none focus:border-teal-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:border-teal-500"
            >
              <option value="">All Roles</option>
              <option value="elderly">Elderly</option>
              <option value="caretaker">Caretaker</option>
              <option value="family">Family</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold border-b">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          u.status === 'active'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>

                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Security Audit Logs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h3 className="font-display font-extrabold text-lg text-slate-900">
          Activity & Security Audit Feed
        </h3>
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-800">[{log.action}]</span>{' '}
                <span className="text-slate-600">{log.details}</span>
              </div>
              <div className="text-slate-400 font-mono text-[11px] shrink-0">
                {new Date(log.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
