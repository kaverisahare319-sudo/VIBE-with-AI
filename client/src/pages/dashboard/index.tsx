import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io as SocketIO } from 'socket.io-client';
import {
  FileText, GitBranch, Code2, MessagesSquare, Sparkles,
  ArrowRight, TrendingUp, Activity, RefreshCw, Clock,
  CheckCircle2, XCircle, CalendarClock, ExternalLink, FileBarChart2,
  Brain, Lightbulb, BarChart2, Target,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/useAuth';

interface DashboardOverview {
  overallPlacementReadiness: number;
  latestAtsScore: number;
  codingScore: number;
  communicationScore: number;
  interviewReadinessScore: number;
  recentActivities: { id: string; type: string; description: string; date: string }[];
}

interface GDRequestItem {
  _id: string; topic: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  preferredDate: string; preferredTime: string;
  assignedDate?: string; assignedTime?: string; assignedTopic?: string;
  assignedMode?: string; meetingLink?: string; rejectionReason?: string;
  evaluationReport?: any; createdAt: string;
}

interface AnalyticsSession {
  date: string; coding: number; interview: number;
  ats: number; communication: number; confidence: number;
}

function isJoinable(req: GDRequestItem): boolean {
  if (req.status !== 'approved') return false;
  const dateStr = req.assignedDate || req.preferredDate;
  const timeStr = req.assignedTime || req.preferredTime;
  if (!dateStr || !timeStr) return false;
  const sessionStart = new Date(`${dateStr.split('T')[0]}T${timeStr}`);
  const diffMs = sessionStart.getTime() - Date.now();
  return diffMs <= 10 * 60 * 1000;
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending Approval', color: 'text-amber-600 bg-amber-50 border-amber-200',       icon: Clock },
  approved:  { label: 'Approved',         color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',         color: 'text-red-600 bg-red-50 border-red-200',             icon: XCircle },
  completed: { label: 'Completed',        color: 'text-blue-600 bg-blue-50 border-blue-200',          icon: FileBarChart2 },
  cancelled: { label: 'Cancelled',        color: 'text-slate-500 bg-slate-50 border-slate-200',       icon: XCircle },
};

// ─── SVG SPARKLINE ────────────────────────────────────────────────────────────
function Sparkline({ values, color, height = 48 }: { values: number[]; color: string; height?: number }) {
  const W = 200, H = height;
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return `${x},${y}`;
  });
  const linePath = `M ${pts.join(' L ')}`;
  const areaPath = `M ${pts[0]} L ${pts.join(' L ')} L ${W},${H} L 0,${H} Z`;
  const gradId = `sg-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        if (i !== values.length - 1) return null;
        const x = (i / (values.length - 1)) * W;
        const y = H - ((v - min) / (max - min)) * H;
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />;
      })}
    </svg>
  );
}

// ─── SVG RADAR CHART ──────────────────────────────────────────────────────────
function RadarChart({ scores }: { scores: { label: string; value: number; color: string }[] }) {
  const CX = 120, CY = 120, R = 85;
  const N = scores.length;
  const angleStep = (2 * Math.PI) / N;
  const getPoint = (i: number, r: number) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  };

  const rings = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = scores.map((s, i) => getPoint(i, (s.value / 100) * R));
  const polyPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto">
      {rings.map((r, ri) => {
        const pts = Array.from({ length: N }, (_, i) => getPoint(i, r * R));
        return <polygon key={ri} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {scores.map((_, i) => {
        const outer = getPoint(i, R);
        return <line key={i} x1={CX} y1={CY} x2={outer.x} y2={outer.y} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      <path d={polyPath} fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={scores[i].color} />)}
      {scores.map((s, i) => {
        const pt = getPoint(i, R + 18);
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fontWeight="700" fill="#64748b">
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── INSIGHT CARD ─────────────────────────────────────────────────────────────
function InsightCard({ icon: Icon, title, desc, accent }: { icon: React.ElementType; title: string; desc: string; accent: string }) {
  return (
    <div className={`glass-card p-4 rounded-2xl border-l-4 ${accent} flex gap-3 items-start`}>
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [gdRequests, setGdRequests] = useState<GDRequestItem[]>([]);
  const [gdLoading, setGdLoading] = useState(true);
  const [reportModal, setReportModal] = useState<GDRequestItem | null>(null);
  const [analyticsSessions, setAnalyticsSessions] = useState<AnalyticsSession[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

  useEffect(() => {
    fetch(`${API_URL}/dashboard`)
      .then(res => { if (!res.ok) throw new Error('Failed'); return res.json(); })
      .then(json => { setData(json); setLoading(false); })
      .catch(() => {
        setData({
          overallPlacementReadiness: 87, latestAtsScore: 82, codingScore: 89,
          communicationScore: 91, interviewReadinessScore: 85,
          recentActivities: [
            { id: '1', type: 'resume',    description: `Resume "${user?.name ? user.name.split(' ')[0] : 'User'}_Software_Developer.pdf" uploaded and ATS scanned`, date: '2 hours ago' },
            { id: '2', type: 'coding',    description: 'Completed "Binary Tree Inorder Traversal" — Passed 8/8 test cases', date: '1 day ago' },
            { id: '3', type: 'interview', description: 'Completed TCS Technical Mock Interview round', date: '3 days ago' },
            { id: '4', type: 'gd',        description: 'Participated in AI Group Discussion on "Web3 vs Web2"', date: '4 days ago' },
          ],
        });
        setLoading(false);
      });
  }, [API_URL, user]);

  // Fetch analytics trend data
  useEffect(() => {
    fetch(`${API_URL}/user/analytics`)
      .then(r => r.json())
      .then(d => { if (d.sessions) setAnalyticsSessions(d.sessions); })
      .catch(() => {
        const now = Date.now(), DAY = 86400000;
        setAnalyticsSessions(Array.from({ length: 7 }, (_, i) => ({
          date: new Date(now - (6 - i) * DAY).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          coding:        62 + i * 4 + (i % 2) * 3,
          interview:     58 + i * 4 + (i % 3) * 2,
          ats:           70 + i * 3 + (i % 2) * 2,
          communication: 65 + i * 4 + (i % 2) * 4,
          confidence:    60 + i * 4 + (i % 3) * 3,
        })));
      });
  }, [API_URL]);

  const socketRef = useRef<ReturnType<typeof SocketIO> | null>(null);

  const fetchGDRequests = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { setGdLoading(false); return; }
    fetch(`${API_URL}/gd/my-requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setGdRequests(d.requests || []); setGdLoading(false); })
      .catch(() => setGdLoading(false));
  }, [API_URL]);

  useEffect(() => {
    fetchGDRequests();
    const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5005/api').replace('/api', '');
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = SocketIO(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user._id) socket.emit('join-personal-room', { userId: user._id });
    });
    socket.on('gd-request-updated', fetchGDRequests);
    return () => { socket.disconnect(); };
  }, [fetchGDRequests]);

  const quickActions = useMemo(() => [
    { label: 'Resume',           icon: FileText,      path: '/resume-analyzer',         color: 'text-violet-600' },
    { label: 'Interview',        icon: Brain,          path: '/ai-placement-assessment', color: 'text-emerald-600' },
    { label: 'Coding',           icon: Code2,          path: '/coding-assessment',        color: 'text-cyan-600' },
    { label: 'Group Discussion', icon: MessagesSquare, path: '/gd-simulator',             color: 'text-orange-600' },
    { label: 'Reports',          icon: TrendingUp,     path: '/reports',                  color: 'text-rose-600' },
  ], []);

  const modules = useMemo(() => [
    { title: 'Resume Analyzer',         desc: 'AI-powered ATS scoring and keyword optimization.',                          path: '/resume-analyzer',         icon: FileText,      score: `${data?.latestAtsScore}`,            scoreLabel: 'ATS Score',   color: 'text-violet-600',  border: 'border-l-4 border-l-violet-500'  },
    { title: 'Career Roadmap',          desc: 'Step-by-step custom curriculum to secure modern placement roles.',          path: '/roadmap',                 icon: GitBranch,     score: '3 Months',                           scoreLabel: 'Timeline',    color: 'text-purple-600',  border: 'border-l-4 border-l-purple-500'  },
    { title: 'Coding Assessment',       desc: 'Algorithms compiler and Big-O computational analysis.',                     path: '/coding-assessment',       icon: Code2,         score: `${data?.codingScore}%`,               scoreLabel: 'Score',       color: 'text-cyan-600',    border: 'border-l-4 border-l-cyan-500'    },
    { title: 'AI Placement Assessment', desc: 'Unified AI interview simulation analyzing voice, video, and body language.', path: '/ai-placement-assessment', icon: Sparkles,      score: `${data?.interviewReadinessScore}%`,   scoreLabel: 'Confidence',  color: 'text-emerald-600', border: 'border-l-4 border-l-emerald-500' },
    { title: 'Group Discussion',        desc: 'Compete against responsive AI participants in multi-agent rooms.',          path: '/gd-simulator',            icon: MessagesSquare,score: 'Active',                             scoreLabel: 'Rooms',       color: 'text-orange-600',  border: 'border-l-4 border-l-orange-500'  },
    { title: 'Placement Predictor',     desc: 'Multi-parameter calculation outlining recruitment chances.',                path: '/reports',                 icon: TrendingUp,    score: `${data?.overallPlacementReadiness}%`, scoreLabel: 'Readiness',   color: 'text-rose-600',    border: 'border-l-4 border-l-rose-500'    },
  ], [data]);

  const trendLines = useMemo<{ key: keyof AnalyticsSession; label: string; color: string; textColor: string }[]>(() => [
    { key: 'coding',        label: 'Coding',       color: '#06b6d4', textColor: 'text-cyan-600'    },
    { key: 'interview',     label: 'Interview',    color: '#10b981', textColor: 'text-emerald-600' },
    { key: 'ats',           label: 'ATS Score',    color: '#8b5cf6', textColor: 'text-violet-600'  },
    { key: 'communication', label: 'Communication',color: '#6366f1', textColor: 'text-indigo-600'  },
    { key: 'confidence',    label: 'Confidence',   color: '#f59e0b', textColor: 'text-amber-600'   },
  ], []);

  const radarScores = useMemo(() => {
    const last = analyticsSessions[analyticsSessions.length - 1];
    if (!last) return [];
    return [
      { label: 'Coding',    value: data?.codingScore                ?? last.coding,        color: '#06b6d4' },
      { label: 'Interview', value: data?.interviewReadinessScore    ?? last.interview,     color: '#10b981' },
      { label: 'ATS',       value: data?.latestAtsScore             ?? last.ats,           color: '#8b5cf6' },
      { label: 'Comm.',     value: data?.communicationScore         ?? last.communication, color: '#6366f1' },
      { label: 'Ready',     value: data?.overallPlacementReadiness  ?? last.confidence,    color: '#f59e0b' },
    ];
  }, [analyticsSessions, data]);

  const insights = useMemo(() => {
    if (!data) return [];
    return [
      { score: data.codingScore,               label: 'Coding',        path: '/coding-assessment',       tip: 'Practice 2 algorithm problems daily to push past the 90% mark.' },
      { score: data.interviewReadinessScore,   label: 'Interview',     path: '/ai-placement-assessment', tip: 'Try Voice mode in AI Placement Assessment to sharpen spoken answers.' },
      { score: data.latestAtsScore,            label: 'ATS',           path: '/resume-analyzer',         tip: 'Add role-specific keywords to push your ATS score above 90.' },
      { score: data.communicationScore,        label: 'Communication', path: '/gd-simulator',            tip: 'Join a Group Discussion session to sharpen your communication.' },
      { score: data.overallPlacementReadiness, label: 'Readiness',     path: '/reports',                 tip: 'Review your placement prediction report for focused improvements.' },
    ].sort((a, b) => a.score - b.score).slice(0, 3);
  }, [data]);

  const assessmentHistory = useMemo(() =>
    (data?.recentActivities ?? []).map(act => ({
      id: act.id, description: act.description, date: act.date,
      icon: act.type === 'coding' ? Code2 : act.type === 'resume' ? FileText : act.type === 'interview' ? Brain : MessagesSquare,
      color: act.type === 'coding' ? 'bg-cyan-100 text-cyan-600' : act.type === 'resume' ? 'bg-violet-100 text-violet-600' : act.type === 'interview' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600',
    }))
  , [data]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-500 font-medium">Synchronizing diagnostics dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-slate-950">Welcome Back!</h1>
          <p className="text-slate-500 text-sm mt-1">Here is a general summary of your interview and placement diagnostics.</p>
        </div>
        <Link to="/reports" className="btn-gradient px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm">
          View Placement Predictions <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Placement Ready', value: data?.overallPlacementReadiness, color: 'text-blue-600',    bar: 'bg-blue-500',    suffix: '%'    },
          { label: 'ATS Score',       value: data?.latestAtsScore,            color: 'text-purple-600',  bar: 'bg-purple-500',  suffix: '/100' },
          { label: 'Coding Score',    value: data?.codingScore,               color: 'text-cyan-600',    bar: 'bg-cyan-500',    suffix: '%'    },
          { label: 'Communication',   value: data?.communicationScore,        color: 'text-indigo-600',  bar: 'bg-indigo-500',  suffix: '%'    },
          { label: 'Interview Skill', value: data?.interviewReadinessScore,   color: 'text-emerald-600', bar: 'bg-emerald-500', suffix: '%'    },
        ].map(({ label, value, color, bar, suffix }) => (
          <div key={label} className="glass-card p-5 rounded-2xl border border-slate-200 col-span-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
            <p className={`text-3xl font-extrabold ${color} mt-2`}>{value}{suffix}</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className={`${bar} h-full rounded-full`} style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 rounded-2xl mb-8">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickActions.map((action, idx) => (
            <button key={idx} onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all font-semibold text-slate-700 text-xs sm:text-sm text-center ${action.color}`}>
              <action.icon className="w-5 h-5 mb-2" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* My Live GD Requests */}
      <div className="glass-card p-6 rounded-2xl mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">My Live GD Requests</h3>
            <p className="text-xs text-slate-400 mt-0.5">Track the status of your submitted Group Discussion session requests.</p>
          </div>
          <button onClick={() => navigate('/gd-simulator')}
            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            <MessagesSquare className="w-3.5 h-3.5" /> New Request
          </button>
        </div>
        {gdLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading your GD requests...
          </div>
        ) : gdRequests.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
            <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No GD requests yet</p>
            <p className="text-xs text-slate-400 mt-1">Submit a Live GD request from the GD Simulator page.</p>
            <button onClick={() => navigate('/gd-simulator')}
              className="mt-4 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
              Request a Live GD Session →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Topic', 'Scheduled', 'Mode', 'Status', 'Action'].map((h, i) => (
                    <th key={h} className={`text-xs font-semibold text-slate-400 uppercase tracking-wider py-3 ${i === 4 ? 'text-right' : 'text-left pr-4'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gdRequests.map(req => {
                  const rawStatus = (req.status || '').trim().toLowerCase();
                  const normalizedStatus: keyof typeof STATUS_CONFIG =
                    rawStatus === 'approved' ? 'approved' : rawStatus === 'rejected' ? 'rejected' :
                    rawStatus === 'completed' ? 'completed' : rawStatus === 'cancelled' ? 'cancelled' : 'pending';
                  const cfg = STATUS_CONFIG[normalizedStatus];
                  const StatusIcon = cfg.icon;
                  const joinable = isJoinable({ ...req, status: normalizedStatus as any });
                  const sessionDate = req.assignedDate || req.preferredDate;
                  const sessionTime = req.assignedTime || req.preferredTime;
                  const displayDate = sessionDate
                    ? new Date(sessionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                  return (
                    <tr key={req._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 pr-4"><p className="font-semibold text-slate-800 text-xs line-clamp-2 max-w-[200px]">{req.assignedTopic || req.topic}</p></td>
                      <td className="py-3.5 pr-4 text-xs text-slate-500 whitespace-nowrap">{displayDate}<br /><span className="text-slate-400">{sessionTime}</span></td>
                      <td className="py-3.5 pr-4"><span className="text-xs font-medium text-slate-600 capitalize">{req.assignedMode || 'Chat'}</span></td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />{cfg.label}
                        </span>
                        {req.status === 'rejected' && req.rejectionReason && (
                          <p className="text-[10px] text-red-400 mt-1 max-w-[150px] truncate" title={req.rejectionReason}>{req.rejectionReason}</p>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        {req.status === 'completed' ? (
                          <button onClick={() => setReportModal(req)} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 ml-auto">
                            <FileBarChart2 className="w-3.5 h-3.5" /> View Report
                          </button>
                        ) : req.status === 'approved' ? (
                          <button onClick={() => joinable && navigate(`/live-gd/${req._id}`)} disabled={!joinable}
                            title={!joinable ? 'Available 10 minutes before session start' : 'Join your live GD room'}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 ml-auto ${joinable ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                            <ExternalLink className="w-3.5 h-3.5" />{joinable ? 'Join GD' : 'Not Started'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportModal && reportModal.evaluationReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReportModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">GD Evaluation Report</h3>
              <button onClick={() => setReportModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">×</button>
            </div>
            <p className="text-xs text-slate-500 font-medium">Topic: {reportModal.assignedTopic || reportModal.topic}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Overall',       value: reportModal.evaluationReport.overallScore },
                { label: 'Participation', value: reportModal.evaluationReport.participationScore },
                { label: 'Leadership',    value: reportModal.evaluationReport.leadershipScore },
                { label: 'Teamwork',      value: reportModal.evaluationReport.teamworkScore },
                { label: 'Communication', value: reportModal.evaluationReport.communicationScore },
                { label: 'Confidence',    value: reportModal.evaluationReport.confidenceScore },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="text-2xl font-extrabold text-blue-600">{value ?? '—'}</p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mt-1">{label}</p>
                </div>
              ))}
            </div>
            {reportModal.evaluationReport.performanceFeedback && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">AI Feedback</p>
                <p className="text-xs text-slate-600 leading-relaxed">{reportModal.evaluationReport.performanceFeedback}</p>
              </div>
            )}
            {reportModal.evaluationReport.suggestions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Improvement Areas</p>
                <ul className="space-y-1.5">
                  {reportModal.evaluationReport.suggestions.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      <span className="text-rose-500 mt-0.5">▸</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={() => setReportModal(null)} className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Module Cards + Activities */}
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Diagnostic Modules</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {modules.map((m, idx) => (
              <div key={idx} onClick={() => navigate(m.path)}
                className={`glass-card glass-card-hover p-5 rounded-2xl cursor-pointer ${m.border} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-800">{m.title}</span>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{m.desc}</p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{m.scoreLabel}</span>
                  <span className={`text-sm font-extrabold ${m.color}`}>{m.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Activities</h3>
          <div className="glass-card p-6 rounded-2xl space-y-5">
            {data?.recentActivities.map(act => (
              <div key={act.id} className="flex items-start space-x-3 text-left">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mt-0.5 border border-slate-200/50">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{act.description}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{act.date}</span>
                </div>
              </div>
            ))}
            <Link to="/reports" className="w-full flex items-center justify-center space-x-1 py-2 text-xs font-semibold text-blue-600 hover:text-blue-500 border border-dashed border-blue-200 rounded-lg bg-blue-50/20 transition-colors">
              <span>View Detailed Progress Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ANALYTICS SECTION — purely additive below existing content            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {analyticsSessions.length > 0 && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-3 mb-7">
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performance Analytics</span>
            </div>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Performance Trend Sparklines — 7-session history */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {trendLines.map(tl => {
              const vals = analyticsSessions.map(s => s[tl.key] as number);
              const latest = vals[vals.length - 1];
              const prev   = vals[vals.length - 2] ?? latest;
              const delta  = latest - prev;
              return (
                <div key={String(tl.key)} className="glass-card p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{tl.label}</span>
                    <span className={`text-[10px] font-bold ${delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}
                    </span>
                  </div>
                  <p className={`text-2xl font-extrabold ${tl.textColor} mb-2`}>{latest}%</p>
                  <Sparkline values={vals} color={tl.color} height={40} />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] text-slate-400">{analyticsSessions[0].date}</span>
                    <span className="text-[9px] text-slate-400">{analyticsSessions[analyticsSessions.length - 1].date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Radar + Insights */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Skill Radar */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-700">Skill Radar</h3>
                <span className="ml-auto text-[10px] text-slate-400 font-semibold">Current snapshot</span>
              </div>
              <RadarChart scores={radarScores} />
              <div className="grid grid-cols-5 gap-1 mt-3">
                {radarScores.map(s => (
                  <div key={s.label} className="text-center">
                    <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: s.color }} />
                    <p className="text-[9px] text-slate-500 font-semibold">{s.label}</p>
                    <p className="text-[10px] font-extrabold text-slate-700">{s.value}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalized Insights */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-700">Personalized Insights</h3>
              </div>
              <div className="space-y-4">
                {insights.map((ins, i) => (
                  <div key={i}>
                    <InsightCard
                      icon={i === 0 ? TrendingUp : i === 1 ? Brain : Target}
                      title={`Improve your ${ins.label} score (${ins.score}%)`}
                      desc={ins.tip}
                      accent={i === 0 ? 'border-l-rose-400' : i === 1 ? 'border-l-amber-400' : 'border-l-blue-400'}
                    />
                    <button onClick={() => navigate(ins.path)}
                      className="mt-1.5 ml-11 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                      Practice now <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assessment History Timeline */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700">Assessment History</h3>
              <span className="ml-auto text-[10px] text-slate-400 font-semibold">Last {assessmentHistory.length} sessions</span>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-5">
                {assessmentHistory.map(item => (
                  <div key={item.id} className="flex items-start gap-4 pl-10 relative">
                    <div className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ${item.color} border-2 border-white shadow-sm`}>
                      <item.icon className="w-2.5 h-2.5" />
                    </div>
                    <div className="flex-1 min-w-0 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{item.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{item.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
