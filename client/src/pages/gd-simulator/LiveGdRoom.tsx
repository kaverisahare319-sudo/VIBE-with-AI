import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, Users, Mic, Send, PhoneOff, MicOff, CameraOff, Award, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import DashboardLayout from '../../components/layout/DashboardLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5005';

interface GDMessage { sender: string; text: string; time: string; isUser?: boolean; }
interface GDMetrics {
  topic: string;
  participationScore: number;
  leadershipScore: number;
  teamworkScore: number;
  communicationScore: number;
  confidenceScore: number;
  overallScore: number;
  performanceFeedback: string;
  suggestions: string[];
}

export default function LiveGdRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<GDMessage[]>([]);
  const [input, setInput] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [sessionTopic, setSessionTopic] = useState('Live Group Discussion');

  // Completion state
  const [isEnding, setIsEnding] = useState(false);
  const [metrics, setMetrics] = useState<GDMetrics | null>(null);
  const [reportSaved, setReportSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── Fetch session info (topic) ────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/gd/request/${roomId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.request?.assignedTopic) setSessionTopic(d.request.assignedTopic);
        else if (d.request?.topic) setSessionTopic(d.request.topic);
      })
      .catch(() => {});
  }, [roomId]);

  // ── Socket connection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !roomId) return;

    const newSocket = io(SOCKET_URL, { transports: ['websocket'] });

    newSocket.on('connect', () => {
      newSocket.emit('join_gd_room', roomId, { id: user.id, name: user.name });
    });

    newSocket.on('user_joined', (newUser: any) => {
      setParticipants(prev => {
        if (prev.find(p => p.id === newUser.id)) return prev;
        return [...prev, newUser];
      });
      setMessages(prev => [...prev, {
        sender: 'System',
        text: `${newUser.name} has joined the discussion.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    });

    newSocket.on('receive_gd_message', (msg: any) => {
      setMessages(prev => [...prev, msg]);
    });

    setSocket(newSocket);
    setParticipants([{ id: user.id, name: user.name + ' (You)' }]);

    return () => { newSocket.disconnect(); };
  }, [roomId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (metrics) return; // stop timer once session ends
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleEndSession(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [metrics]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !roomId || !user) return;
    const newMsg: GDMessage = {
      sender: user.name,
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true,
    };
    socket.emit('send_gd_message', { roomId, message: newMsg });
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  // ── End session: get AI report, save to DB ───────────────────────────────
  const handleEndSession = async () => {
    if (isEnding || metrics) return;
    setIsEnding(true);
    socket?.disconnect();

    try {
      // 1. Get AI evaluation
      const analyzeRes = await fetch(`${API_URL}/gd/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, topic: sessionTopic, messages: messagesRef.current }),
      });
      const analyzeData = await analyzeRes.json();
      const report: GDMetrics = analyzeData.analysis || analyzeData || {
        topic: sessionTopic,
        participationScore: 82, leadershipScore: 78, teamworkScore: 88,
        communicationScore: 85, confidenceScore: 83, overallScore: 83,
        performanceFeedback: 'Good participation in the live discussion. You demonstrated effective communication and team coordination.',
        suggestions: [
          'Try to take the initiative earlier in the discussion.',
          'Use more data-backed arguments to strengthen your points.',
        ],
      };

      setMetrics(report);

      // 2. Save report to backend against the GD request
      const token = localStorage.getItem('token');
      if (token && roomId) {
        const saveRes = await fetch(`${API_URL}/gd/request/${roomId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ evaluationReport: report }),
        });
        if (saveRes.ok) setReportSaved(true);
      }
    } catch {
      // Fallback report if AI call fails
      const fallback: GDMetrics = {
        topic: sessionTopic,
        participationScore: 80, leadershipScore: 75, teamworkScore: 85,
        communicationScore: 82, confidenceScore: 80, overallScore: 80,
        performanceFeedback: 'Session completed. AI analysis could not be retrieved — showing estimated scores.',
        suggestions: ['Ensure a stable internet connection for live AI feedback.'],
      };
      setMetrics(fallback);
    } finally {
      setIsEnding(false);
    }
  };

  // ── Results Screen ────────────────────────────────────────────────────────
  if (metrics) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-10 px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">

            {/* Banner */}
            <div className="p-6 md:p-8 bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0">
                  <div className="text-center">
                    <p className="text-4xl font-black text-blue-600">{metrics.overallScore}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">/ 100</p>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Live GD Evaluation Report</p>
                  <h2 className="text-xl font-bold mb-2">Session Complete! 🎉</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{metrics.performanceFeedback}</p>
                  {reportSaved && (
                    <p className="text-xs text-emerald-400 mt-2 font-semibold">✓ Report saved — viewable from your dashboard</p>
                  )}
                </div>
              </div>
            </div>

            {/* Score Rings */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: 'Participation',  value: metrics.participationScore,  color: '#06B6D4' },
                  { label: 'Leadership',     value: metrics.leadershipScore,      color: '#8B5CF6' },
                  { label: 'Teamwork',       value: metrics.teamworkScore,        color: '#22C55E' },
                  { label: 'Communication',  value: metrics.communicationScore,   color: '#3B82F6' },
                  { label: 'Confidence',     value: metrics.confidenceScore,      color: '#F97316' },
                ].map(({ label, value, color }) => {
                  const r = 36, circ = 2 * Math.PI * r, offset = circ - (value / 100) * circ;
                  return (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <div className="relative" style={{ width: 90, height: 90 }}>
                        <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx={45} cy={45} r={r} fill="none" stroke="#F1F5F9" strokeWidth="8" />
                          <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth="8"
                            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-black text-slate-800">{value}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 text-center">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suggestions */}
            <div className="p-6 md:p-8">
              <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Award className="w-4 h-4" /> Areas for Improvement
              </h4>
              <ul className="space-y-3">
                {metrics.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                    <span className="text-rose-500 mt-0.5">▸</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors">
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Active Room Screen ────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] p-4 flex flex-col lg:flex-row gap-6">

        {/* Main Stage */}
        <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden shadow-xl flex flex-col relative">

          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-slate-900/80 to-transparent z-10">
            <div>
              <h2 className="text-white font-bold text-lg">Live Discussion Room</h2>
              <p className="text-slate-300 text-sm flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Recording • {sessionTopic.length > 40 ? sessionTopic.slice(0, 40) + '…' : sessionTopic}
              </p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur text-white px-4 py-2 rounded-xl font-mono text-xl font-bold shadow-sm border border-slate-700/50">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Participant Grid */}
          <div className="flex-1 p-6 pt-24 grid grid-cols-2 gap-4">
            {participants.map((p, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-slate-700 relative overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                  <span className="text-3xl text-slate-400 font-bold">{p.name[0].toUpperCase()}</span>
                </div>
                <p className="text-white font-medium">{p.name}</p>
                <div className="absolute bottom-3 left-3 bg-slate-900/60 px-3 py-1 rounded-lg text-xs text-slate-300 flex items-center gap-2 backdrop-blur">
                  <Mic className="w-3 h-3 text-green-400" /> Active
                </div>
              </div>
            ))}
          </div>

          {/* Control Bar */}
          <div className="h-24 bg-slate-800 border-t border-slate-700 flex items-center justify-center gap-4 px-6 z-10">
            <button className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors">
              <MicOff className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors">
              <CameraOff className="w-5 h-5" />
            </button>
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="h-12 px-6 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 flex items-center justify-center text-white transition-colors shadow-lg gap-2 font-semibold text-sm"
            >
              {isEnding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
              {isEnding ? 'Generating Report…' : 'End & Get Report'}
            </button>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-full lg:w-80 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Discussion Chat</h3>
            <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" />{participants.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                  {!msg.isUser && (
                    <span className="text-[10px] font-bold text-slate-500 mb-0.5 ml-1">{msg.sender}</span>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                    msg.isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : msg.sender === 'System'
                      ? 'bg-slate-100 text-slate-500 italic text-center w-full rounded-xl'
                      : 'bg-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 mx-1">{msg.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your argument…"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={!input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
