import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  TrendingUp, Target, Zap, AlertCircle, RefreshCw, Sparkles, Building2, BookOpen
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/useAuth';

interface CompanyPrediction {
  name: string;
  matchPercentage: number;
  status: string;
}

interface PredictionData {
  readinessOverall: number;
  interviewReadiness: number;
  communicationReadiness: number;
  technicalReadiness: number;
  companyWise: CompanyPrediction[];
  skillGaps: string[];
  roadmap: string[];
  createdAt: string;
}

// ── Score Ring Component (Reused style) ─────────────────────────────────────
function ScoreRing({ score, label, color, size = 120 }: { score: number; label: string; color: string; size?: number }) {
  const shouldReduceMotion = useReducedMotion();
  const safeScore = (typeof score !== 'number' || isNaN(score)) ? 0 : score;
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (safeScore / 100) * circ;
  const colorMap: Record<string, { stroke: string; text: string }> = {
    purple: { stroke: '#8B5CF6', text: 'text-purple-600' },
    green:  { stroke: '#22C55E', text: 'text-green-600'  },
    blue:   { stroke: '#3B82F6', text: 'text-blue-600'   },
    cyan:   { stroke: '#06B6D4', text: 'text-cyan-600'   },
    orange: { stroke: '#F97316', text: 'text-orange-600' },
    rose:   { stroke: '#F43F5E', text: 'text-rose-600'   },
  };
  const c = colorMap[color] || colorMap.blue;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="8" />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={c.stroke} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: shouldReduceMotion ? 0 : 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black tracking-tighter ${c.text}`}>
            {Math.round(safeScore)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">%</span>
        </div>
      </div>
      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function PlacementPrediction() {
  const shouldReduceMotion = useReducedMotion();
  const animProps = shouldReduceMotion ? { transition: { duration: 0 } } : {};
  const { user, token } = useAuth();
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const fetchPrediction = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5005/api/placement/predict?userId=${user?.id || 'guest'}`, {
        headers: authHeaders
      });
      if (!res.ok) {
        if (res.status === 404) return; // No prediction yet
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch prediction data');
      }
      const json = await res.json();
      setData(json);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load placement data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateNewPrediction = useCallback(async () => {
    setGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const res = await fetch('http://localhost:5005/api/placement/predict', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ userId: user?.id || 'guest' })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to generate new prediction');
      }
      const json = await res.json();
      setData(json);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate placement readiness report.');
    } finally {
      setGenerating(false);
    }
  }, [user, token]);

  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchTimerRef.current = setTimeout(() => {
      fetchPrediction();
    }, 0);
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [fetchPrediction]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-transparent">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-600 tracking-tight flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-600" /> Placement Readiness Predictor
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                AI-driven analysis of your performance across all modules to predict your placement probability.
              </p>
            </div>
            <button
              onClick={generateNewPrediction}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }}
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Calculating...' : 'Recalculate Readiness'}
            </button>
          </div>

          {error && (
            <div className="rounded-xl p-4 border border-red-200 bg-red-50 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-slate-500 font-medium text-sm">Loading your prediction data...</p>
            </div>
          ) : !data && !generating ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Prediction Data Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                Complete mock interviews, coding tests, and communication analysis to build your readiness profile.
              </p>
              <button
                onClick={generateNewPrediction}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md"
              >
                Generate Initial Prediction
              </button>
            </div>
          ) : data ? (
            <AnimatePresence>
              <motion.div {...animProps}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* ── Top Metrics ─────────────────────────────────────── */}
                <div className="grid md:grid-cols-4 gap-6">
                  {/* Hero Overall Score */}
                  <div className="md:col-span-2 rounded-3xl p-8 border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row items-center justify-around gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
                    <div className="space-y-2 text-center sm:text-left z-10">
                      <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Overall Probability</h2>
                      <div className="text-2xl font-bold text-slate-800">Placement Readiness</div>
                      <p className="text-xs text-slate-500 max-w-[200px]">Aggregated from communication, technical, and behavioral metrics.</p>
                    </div>
                    <div className="z-10">
                      <ScoreRing score={data.readinessOverall} label="" color="blue" size={140} />
                    </div>
                  </div>

                  {/* Sub Metrics */}
                  <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center text-center">
                    <ScoreRing score={data.technicalReadiness} label="Technical" color="purple" size={100} />
                  </div>
                  <div className="rounded-3xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center text-center">
                    <ScoreRing score={data.communicationReadiness} label="Communication" color="green" size={100} />
                  </div>
                </div>

                {/* ── Company Grid & Roadmap ─────────────────────────────────────── */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Companies List */}
                  <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-slate-600" />
                      <h3 className="font-bold text-slate-800">Target Companies</h3>
                    </div>
                    <div className="p-6 grid sm:grid-cols-2 gap-4">
                      {data.companyWise.map((company, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 transition-colors">
                          <div>
                            <div className="font-bold text-slate-800 text-sm mb-1">{company.name}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block ${
                              company.status === 'Ready' ? 'bg-green-100 text-green-700' :
                              company.status === 'Almost Ready' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {company.status}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black text-slate-700">{company.matchPercentage}%</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Match</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skill Gaps & Roadmap */}
                  <div className="space-y-6">
                    {/* Skill Gaps */}
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <h3 className="font-bold text-slate-800 text-sm">Critical Skill Gaps</h3>
                      </div>
                      <ul className="p-5 space-y-3">
                        {data.skillGaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-orange-500 mt-0.5">•</span> {gap}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Learning Roadmap */}
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <h3 className="font-bold text-slate-800 text-sm">AI Learning Roadmap</h3>
                      </div>
                      <div className="p-5 space-y-4">
                        {data.roadmap.map((step, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {i + 1}
                              </div>
                              {i < data.roadmap.length - 1 && <div className="w-px h-full bg-slate-100 mt-1" />}
                            </div>
                            <div className="text-sm text-slate-600 pb-2 pt-0.5">{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

              </motion.div>
            </AnimatePresence>
          ) : null}

        </div>
      </div>
    </DashboardLayout>
  );
}


