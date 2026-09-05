import React, { useState, useEffect } from 'react';
import {
  Users, Activity, Award, FileSpreadsheet,
  LogIn, LogOut, Eye, EyeOff, Shield, Clock,
  CheckCircle, XCircle, AlertCircle, RefreshCcw, CalendarClock
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

// ─── Admin Login Screen ───────────────────────────────────────────────────────
function AdminLogin() {
  const { login } = useAdminAuth();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(adminId, password);
    if (!result.success) setError(result.error || 'Invalid Admin ID or Password.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Access</h1>
          <p className="text-sm text-slate-500">Restricted area. Authorised personnel only.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin ID</label>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="admin001"
              required
              autoComplete="username"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Authenticating...' : 'Login to Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── GD Requests Table ────────────────────────────────────────────────────────
function GDRequestsTable({ token }: { token: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  // Modal state for approve / reschedule
  const [modalRequest, setModalRequest] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'approve' | 'reschedule'>('approve');
  const [modalFields, setModalFields] = useState({
    assignedDate: '', assignedTime: '', assignedTopic: '', assignedMode: 'chat',
    assignedParticipantCount: 3, adminNotes: '',
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/gd-requests?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const openModal = (r: any, mode: 'approve' | 'reschedule') => {
    setModalRequest(r);
    setModalMode(mode);
    setModalFields({
      assignedDate: r.assignedDate ? r.assignedDate.split('T')[0] : r.preferredDate?.split('T')[0] || '',
      assignedTime: r.assignedTime || r.preferredTime || '',
      assignedTopic: r.assignedTopic || r.topic || '',
      assignedMode: r.assignedMode || r.communicationMode || 'chat',
      assignedParticipantCount: r.assignedParticipantCount || r.numberOfParticipants || 3,
      adminNotes: r.adminNotes || '',
    });
  };

  const handleModalSubmit = async () => {
    if (!modalRequest) return;
    setModalLoading(true);
    const endpoint = modalMode === 'approve'
      ? `${API_URL}/admin/gd-requests/${modalRequest._id}/approve`
      : `${API_URL}/admin/gd-requests/${modalRequest._id}/reschedule`;

    const meetingLink = `${window.location.origin}/live-gd/${modalRequest._id}`;
    await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...modalFields, meetingLink }),
    });
    setModalLoading(false);
    setModalRequest(null);
    fetchRequests();
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason (optional):') || 'No available slots.';
    await fetch(`${API_URL}/admin/gd-requests/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rejectionReason: reason }),
    });
    fetchRequests();
  };

  const statusColors: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    approved:  'bg-green-50 text-green-700 border-green-200',
    rejected:  'bg-red-50 text-red-700 border-red-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <>
      {/* Approve / Reschedule Modal */}
      {modalRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModalRequest(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-blue-600" />
                {modalMode === 'approve' ? 'Approve GD Request' : 'Reschedule Session'}
              </h3>
              <button onClick={() => setModalRequest(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">×</button>
            </div>
            <p className="text-xs text-slate-500">Student: <span className="font-semibold text-slate-700">{modalRequest.userName}</span> · {modalRequest.userEmail}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Topic</label>
                <input value={modalFields.assignedTopic}
                  onChange={e => setModalFields(f => ({ ...f, assignedTopic: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                  <input type="date" value={modalFields.assignedDate}
                    onChange={e => setModalFields(f => ({ ...f, assignedDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Time</label>
                  <input type="time" value={modalFields.assignedTime}
                    onChange={e => setModalFields(f => ({ ...f, assignedTime: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mode</label>
                  <select value={modalFields.assignedMode}
                    onChange={e => setModalFields(f => ({ ...f, assignedMode: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="chat">Chat</option>
                    <option value="voice">Voice</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Participants</label>
                  <input type="number" min={2} max={6} value={modalFields.assignedParticipantCount}
                    onChange={e => setModalFields(f => ({ ...f, assignedParticipantCount: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admin Notes (optional)</label>
                <input value={modalFields.adminNotes}
                  onChange={e => setModalFields(f => ({ ...f, adminNotes: e.target.value }))}
                  placeholder="e.g. Please join 5 mins early"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalRequest(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleModalSubmit} disabled={modalLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                {modalLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {modalLoading ? 'Saving…' : modalMode === 'approve' ? 'Approve & Notify' : 'Reschedule & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-6 rounded-2xl text-left space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-slate-800">Live GD Requests</h3>
            <p className="text-xs text-slate-400">Approve, reject, or reschedule user GD session requests.</p>
          </div>
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected', 'completed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize border transition-all ${
                  statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCcw className="w-4 h-4 animate-spin" /> Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No {statusFilter} requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Topic</th>
                  <th className="pb-3">Date / Time</th>
                  <th className="pb-3">Mode</th>
                  <th className="pb-3">Participants</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/30">
                    <td className="py-3">
                      <div className="font-semibold text-slate-800">{r.userName}</div>
                      <div className="text-slate-400 font-normal">{r.userEmail}</div>
                    </td>
                    <td className="py-3 max-w-[160px] truncate">{r.assignedTopic || r.topic}</td>
                    <td className="py-3">
                      <div>{new Date(r.assignedDate || r.preferredDate).toLocaleDateString('en-IN')}</div>
                      <div className="text-slate-400">{r.assignedTime || r.preferredTime}</div>
                    </td>
                    <td className="py-3 capitalize">{r.assignedMode || r.communicationMode}</td>
                    <td className="py-3">{r.assignedParticipantCount || r.numberOfParticipants}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusColors[r.status] || ''}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {r.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openModal(r, 'approve')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button onClick={() => handleReject(r._id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                      {r.status === 'approved' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openModal(r, 'reschedule')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                            <CalendarClock className="w-3 h-3" /> Reschedule
                          </button>
                          <a href={`/live-gd/${r._id}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors">
                            Open Room
                          </a>
                        </div>
                      )}
                      {(r.status === 'rejected' || r.status === 'completed') && (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { admin, token, isLoading, logout } = useAdminAuth();
  const [data, setData] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(json => { setData(json); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));
  }, [token]);

  // Show login screen if not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCcw className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!admin || !token) {
    return <AdminLogin />;
  }

  const stats = [
    { label: 'Total Enrolled Users', value: data?.totalUsers?.toLocaleString() || (statsLoading ? '...' : '—'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending GD Requests', value: data?.pendingRequests?.toLocaleString() || (statsLoading ? '...' : '0'), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved Sessions', value: data?.approvedRequests?.toLocaleString() || (statsLoading ? '...' : '0'), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Completed Sessions', value: data?.completedSessions?.toLocaleString() || (statsLoading ? '...' : '0'), icon: Award, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  const upcomingSessions = data?.upcomingSessions || [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-slate-950">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Logged in as <span className="font-semibold text-slate-700">{admin.name}</span> ({admin.email}) · Role: <span className="font-semibold capitalize">{admin.role}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => alert('Compiling global diagnostic metrics spreadsheet...')}
            className="btn-gradient px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Generate Reports</span>
          </button>
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-left">
        {stats.map((item, idx) => (
          <div key={idx} className="glass-card p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{item.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color} shadow-sm border border-slate-100`}>
              <item.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {/* GD Requests Table */}
        <GDRequestsTable token={token} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl text-left space-y-4">
            <div>
              <h3 className="font-bold text-slate-800">Upcoming Approved Sessions</h3>
              <p className="text-xs text-slate-400">Next scheduled live GD sessions ready to go.</p>
            </div>
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-slate-400">No upcoming sessions.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">User</th>
                      <th className="pb-3">Topic</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Time</th>
                      <th className="pb-3">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-600">
                    {upcomingSessions.map((s: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/30">
                        <td className="py-3 font-semibold text-slate-800">{s.userName}</td>
                        <td className="py-3 max-w-[140px] truncate">{s.assignedTopic}</td>
                        <td className="py-3">{s.assignedDate ? new Date(s.assignedDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="py-3">{s.assignedTime || '—'}</td>
                        <td className="py-3 capitalize">{s.assignedMode || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* System Monitoring */}
          <div className="glass-card p-6 rounded-2xl text-left space-y-6">
            <div>
              <h3 className="font-bold text-slate-800">System Monitoring</h3>
              <p className="text-xs text-slate-400">Live platform diagnostics and computation health rates.</p>
            </div>
            <div className="space-y-4 text-xs font-medium">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">API Gateway Latency</span>
                  <span className="text-slate-800 font-bold">42 ms (Optimal)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">AI GPU Cluster Allocation</span>
                  <span className="text-slate-800 font-bold">58%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '58%' }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Weekly Diagnostic Errors</span>
                  <span className="text-slate-800 font-bold">0.02%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: '99.98%' }} />
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-1 text-slate-400">
                <Activity className="w-4 h-4 text-green-500" />
                <span>All nodes reporting active.</span>
              </div>
              <button
                onClick={() => alert('Toggling configuration filters...')}
                className="text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer"
              >
                Configure Gateway
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
