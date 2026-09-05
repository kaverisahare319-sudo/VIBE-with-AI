import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import {
  Brain,
  Sparkles,
  Info,
  RefreshCw,
  Database,
  Code2,
  MessageSquare,
  Users,
  Video,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
interface PlacementPrediction {
  placementReadinessScore: number;
  interviewReadinessScore: number;
  communicationReadinessScore: number;
  technicalReadinessScore: number;
  companyReadiness: Record<string, number>;
  recommendations: string[];
}

interface AnalyticsSession {
  date: string;
  coding: number | null;
  interview: number | null;
  ats: number | null;
  communication: number | null;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'predictor'>('analytics');
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  
  // Live analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSession[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [improvementSuggestions, setImprovementSuggestions] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);
  const [scores, setScores] = useState<any>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(true);

  // Placement Predictor States
  const [prediction, setPrediction] = useState<PlacementPrediction | null>(null);
  const [loadingPredictor, setLoadingPredictor] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const predictorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

  // ── PDF Report Generator ──────────────────────────────────────────────────
  const downloadReportAsPDF = async () => {
    setDownloadingPDF(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210; // A4 width
      let y = 0;

      const addPage = () => { doc.addPage(); y = 20; };
      const checkY = (needed: number) => { if (y + needed > 270) addPage(); };

      // ── Header Banner ───────────────────────────────────────────────────
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, W, 38, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text('MOCKMATE — Performance Report', 14, 17);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 27);
      doc.setFontSize(9);
      doc.text('Confidential — For candidate use only', W - 14, 27, { align: 'right' });
      y = 50;

      // ── Overall Score Card ───────────────────────────────────────────────
      if (overallScore > 0) {
        doc.setFillColor(238, 242, 255);
        doc.roundedRect(14, y, W - 28, 22, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(67, 56, 202);
        doc.text('Overall Placement Readiness Score', 20, y + 9);
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59);
        doc.text(`${overallScore} / 100`, W - 20, y + 13, { align: 'right' });
        y += 30;
      }

      // ── Module Scores ───────────────────────────────────────────────────
      const moduleScores = [
        { label: 'Technical',        val: scores.technical },
        { label: 'Coding',           val: scores.coding },
        { label: 'Communication',    val: scores.communication },
        { label: 'Mock Interview',   val: scores.mockInterview },
        { label: 'Group Discussion', val: scores.gd },
        { label: 'Confidence',       val: scores.confidence },
      ].filter(s => s.val > 0);

      if (moduleScores.length > 0) {
        checkY(8 + moduleScores.length * 9 + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('Module-wise Scores', 14, y);
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y, W - 14, y);
        y += 5;

        moduleScores.forEach(s => {
          const pct = Math.min(Math.round(s.val), 100);
          const barW = ((W - 28 - 50) * pct) / 100;
          const scoreColor: [number, number, number] = pct >= 80 ? [22, 163, 74] : pct >= 60 ? [217, 119, 6] : [220, 38, 38];
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          doc.text(s.label, 14, y + 4);
          // bar bg
          doc.setFillColor(241, 245, 249);
          doc.roundedRect(70, y, W - 28 - 50, 5, 1, 1, 'F');
          // bar fill
          doc.setFillColor(...scoreColor);
          doc.roundedRect(70, y, barW, 5, 1, 1, 'F');
          // score label
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...scoreColor);
          doc.text(`${pct}%`, W - 14, y + 4, { align: 'right' });
          y += 9;
        });
        y += 4;
      }

      // ── AI Insights ─────────────────────────────────────────────────────
      if (aiInsights.length > 0) {
        checkY(16 + aiInsights.length * 8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('AI Performance Insights', 14, y);
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y, W - 14, y);
        y += 5;
        aiInsights.forEach(insight => {
          checkY(10);
          doc.setFillColor(238, 242, 255);
          doc.roundedRect(14, y - 3, W - 28, 8, 1, 1, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(67, 56, 202);
          const lines = doc.splitTextToSize(`• ${insight}`, W - 32);
          doc.text(lines, 18, y + 2);
          y += lines.length * 5 + 4;
        });
        y += 4;
      }

      // ── Improvement Suggestions ──────────────────────────────────────────
      if (Object.keys(improvementSuggestions).length > 0) {
        checkY(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('Improvement Suggestions', 14, y);
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y, W - 14, y);
        y += 5;
        Object.entries(improvementSuggestions).forEach(([cat, tips]: any) => {
          checkY(14);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(126, 34, 206);
          doc.text(cat.toUpperCase(), 14, y);
          y += 5;
          tips.forEach((tip: string) => {
            checkY(7);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);
            const lines = doc.splitTextToSize(`  – ${tip}`, W - 32);
            doc.text(lines, 18, y);
            y += lines.length * 4.5 + 1;
          });
          y += 3;
        });
        y += 4;
      }

      // ── Assessment History ────────────────────────────────────────────────
      if (history.length > 0) {
        checkY(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('Assessment History', 14, y);
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y, W - 14, y);
        y += 5;

        history.forEach((item: any, i: number) => {
          checkY(10);
          const bg = i % 2 === 0;
          if (bg) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, y - 3, W - 28, 9, 'F');
          }
          const scoreColor: [number, number, number] = item.score >= 80 ? [22, 163, 74] : item.score >= 60 ? [217, 119, 6] : [220, 38, 38];
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          doc.text(item.module?.replace(/_/g, ' ') || 'Assessment', 18, y + 2);
          doc.setTextColor(100, 116, 139);
          doc.text(new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 100, y + 2);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...scoreColor);
          doc.text(`${item.score} / 100`, W - 14, y + 2, { align: 'right' });
          y += 9;
        });
        y += 4;
      }

      // ── Footer on each page ──────────────────────────────────────────────
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('MockMate AI • Placement Intelligence Platform', 14, 292);
        doc.text(`Page ${p} of ${totalPages}`, W - 14, 292, { align: 'right' });
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 288, W - 14, 288);
      }

      doc.save(`MockMate_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Fetch live analytics from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/user/analytics`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.status !== 'no_data') {
          setAnalyticsData(data.sessions || []);
          setOverallScore(data.overallScore || 0);
          setAiInsights(data.aiInsights || []);
          setImprovementSuggestions(data.improvementSuggestions || {});
          setHistory(data.history || []);
          setScores(data.scores || {});
          setIsFallback(false);
        } else {
          setIsFallback(true);
        }
      })
      .catch(() => setIsFallback(true))
      .finally(() => setAnalyticsLoading(false));
  }, [API_URL]);

  // Build chart-ready data — fill nulls with a sensible fallback so charts never break
  const historyData = analyticsData.map(s => ({
    name: s.date,
    ATS:       s.ats       ?? s.coding ?? 75,
    Coding:    s.coding    ?? 75,
    Comm:      s.communication ?? 78,
    Placement: s.interview ?? 77,
  }));

  const latestSession = analyticsData[analyticsData.length - 1];
  const skillData = [
    { subject: 'ATS Scanning',    A: scores.ats || latestSession?.ats || 82,  fullMark: 100 },
    { subject: 'Coding Skill',    A: scores.coding || latestSession?.coding || 89,  fullMark: 100 },
    { subject: 'Communication',   A: scores.communication || latestSession?.communication || 91,  fullMark: 100 },
    { subject: 'Mock Interviews', A: scores.mockInterview || latestSession?.interview || 85,  fullMark: 100 },
    { subject: 'Confidence',      A: scores.confidence || 89,  fullMark: 100 },
    { subject: 'Group Discussion',A: scores.gd || 85,  fullMark: 100 },
  ];

  // Fetch placement predictions from Server
  useEffect(() => {
    if (activeTab !== 'predictor') return;

    const t0 = setTimeout(() => {
      setLoadingPredictor(true);
    }, 0);
    predictorTimerRef.current = t0;

    // Simulate current student diagnostic metrics
    const scores = {
      atsScore: 82,
      codingScore: 89,
      communicationScore: 91,
      bodyLanguageScore: 89,
      gdScore: 85,
      interviewScore: 85
    };

    const token = localStorage.getItem('token');
    fetch(`${API_URL}/placement/predict`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({})
    })
      .then((res) => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then((json) => {
        if (!json || json.status === 'no_data') {
          setPrediction(null);
          setIsFallback(true);
          setLoadingPredictor(false);
          return;
        }
        setIsFallback(false);
        const getComp = (name: string) => json.companyWise?.find((c: any) => c.name.toLowerCase() === name.toLowerCase())?.matchPercentage || 0;
        const formatted = {
          placementReadinessScore: json.readinessOverall || 0,
          interviewReadinessScore: json.interviewReadiness || 0,
          communicationReadinessScore: json.communicationReadiness || 0,
          technicalReadinessScore: json.technicalReadiness || 0,
          companyReadiness: {
            tcs: getComp('tcs'),
            infosys: getComp('infosys'),
            wipro: getComp('wipro'),
            cognizant: getComp('cognizant'),
            accenture: getComp('accenture'),
            capgemini: getComp('capgemini'),
            productCompanies: getComp('google') || getComp('amazon') || 80,
            startups: 82
          },
          recommendations: json.roadmap || []
        };
        const t1 = setTimeout(() => {
          setPrediction(formatted);
          setLoadingPredictor(false);
        }, 1200);
        predictorTimerRef.current = t1;
      })
      .catch((err) => {
        console.error(err);
        // Fallback Predictions
        const t2 = setTimeout(() => {
          setPrediction({
            placementReadinessScore: 87,
            interviewReadinessScore: 85,
            communicationReadinessScore: 88,
            technicalReadinessScore: 86,
            companyReadiness: {
              tcs: 92,
              infosys: 89,
              wipro: 88,
              cognizant: 90,
              accenture: 94,
              capgemini: 91,
              productCompanies: 78,
              startups: 82
            },
            recommendations: [
              'Practice complex DSA problems (graphs, dynamic programming) to increase compatibility with product-based companies.',
              'Optimize resume with missing keywords like "Cloud Computing", "CI/CD pipelines", and "System Design".',
              'Improve speaking speed stability and reduce filler word counts in Mock Interviews.'
            ]
          });
          setLoadingPredictor(false);
        }, 1200);
        predictorTimerRef.current = t2;
      });

    return () => {
      if (predictorTimerRef.current) clearTimeout(predictorTimerRef.current);
    };
  }, [activeTab, API_URL]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-slate-950">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Track your growth metrics and performance ratios across all training sessions.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'analytics' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Performance Analytics
          </button>
          <button
            onClick={() => setActiveTab('predictor')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'predictor' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            AI Placement Predictor
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <div className="w-full space-y-6">

          {/* Data freshness badge */}
          {!analyticsLoading && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold w-fit px-3 py-1 rounded-full border ${
              isFallback
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              <Database className="w-3 h-3" />
              {isFallback ? 'Showing sample data — complete assessments to see your real data' : 'Live data from your assessments'}
            </div>
          )}

          {/* ── Row 1: 4 Summary Cards ───────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Best Coding Score</span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-bold">7-day</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-800">
                {analyticsLoading ? '—' : `${Math.max(...analyticsData.map(s => s.coding ?? 0), 0)}`}
                <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2">Highest coding score in 7 days.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Best Interview</span>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">7-day</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-800">
                {analyticsLoading ? '—' : `${Math.max(...analyticsData.map(s => s.interview ?? 0), 0)}`}
                <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2">Highest mock interview score.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ATS Score Peak</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">Tier A</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-800">82
                <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2">Resume Analyzer peak score.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Overall Score</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold">Live</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-800">
                {overallScore > 0 ? overallScore : '—'}
                <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-2">Placement readiness composite.</p>
            </div>
          </div>

          {/* ── Row 2: Charts (8col) + Radar (4col) ─────────────────── */}
          {analyticsLoading ? (
            <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center min-h-[320px] w-full">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-slate-500 text-sm font-medium">Loading your analytics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

              {/* Area Chart — 8 cols */}
              <div className="xl:col-span-8 glass-card p-6 rounded-2xl w-full min-w-0">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800">Performance Growth Over Time</h3>
                    <p className="text-xs text-slate-400">Daily progress scores across primary metric categories — last 7 days.</p>
                  </div>
                  <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-lg flex-shrink-0">
                    <button
                      onClick={() => setTimeframe('weekly')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${timeframe === 'weekly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                    >Weekly</button>
                    <button
                      onClick={() => setTimeframe('monthly')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${timeframe === 'monthly' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                    >Monthly</button>
                  </div>
                </div>
                <div className="h-80 w-full min-w-0" aria-label="Performance Growth Line Chart" role="img">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorATS" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCoding" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPlacement" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[50, 100]} />
                      <Tooltip contentStyle={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                      <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="ATS" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorATS)" name="ATS Score" />
                      <Area type="monotone" dataKey="Coding" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorCoding)" name="Coding Test" />
                      <Area type="monotone" dataKey="Placement" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorPlacement)" name="Placement Readiness" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar — 4 cols */}
              <div className="xl:col-span-4 glass-card p-6 rounded-2xl flex flex-col w-full min-w-0">
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Competency Radar</h3>
                  <p className="text-xs text-slate-400 mb-4">Multi-dimensional capability chart across core diagnostic modules.</p>
                </div>
                <div className="flex-1 min-h-[260px] w-full" aria-label="Competency Radar Chart" role="img">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                      <PolarGrid stroke="#E2E8F0" />
                      <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={9} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" fontSize={8} />
                      <Radar name="Student Capability" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
                      <Tooltip contentStyle={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="border-t border-slate-100 pt-4 mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-purple-600">
                    <Brain className="w-4 h-4" />
                    <span>Communication &amp; Coding are your strongest pillars.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Row 3: AI Insights (full width) ─────────────────────── */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/60 w-full">
            <div className="p-6 bg-slate-50/40 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">AI Performance Insights</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-indigo-100 rounded-xl px-4 py-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <span className="text-xs text-slate-600 leading-relaxed">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Row 4: Assessment History (full width table) ─────── */}
            <div className="p-6 bg-white border-b border-slate-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Assessment History</h3>
              </div>

              {history.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 mb-2">
                    <span className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assessment</span>
                    <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                    <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Score</span>
                    <span className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</span>
                  </div>
                  <div className="space-y-2">
                    {history.map((item, i) => {
                      const moduleKey = item.module?.toLowerCase() || '';
                      const moduleConfig: Record<string, { label: string; color: string; bg: string; border: string; accent: string; Icon: any }> = {
                        mock_interview:   { label: 'Mock Interview',   color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200', accent: '#7c3aed', Icon: Video },
                        coding_test:      { label: 'Coding Test',      color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   accent: '#2563eb', Icon: Code2 },
                        communication:    { label: 'Communication',    color: 'text-cyan-700',   bg: 'bg-cyan-50',    border: 'border-cyan-200',   accent: '#0891b2', Icon: MessageSquare },
                        group_discussion: { label: 'Group Discussion', color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200',accent: '#059669', Icon: Users },
                      };
                      const cfg = moduleConfig[moduleKey] || { label: item.module?.replace(/_/g, ' ') || 'Assessment', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', accent: '#475569', Icon: Brain };
                      const scoreColor  = item.score >= 80 ? '#16a34a' : item.score >= 60 ? '#d97706' : '#dc2626';
                      const scoreBg     = item.score >= 80 ? '#f0fdf4' : item.score >= 60 ? '#fffbeb' : '#fef2f2';
                      const scoreBorder = item.score >= 80 ? '#bbf7d0' : item.score >= 60 ? '#fde68a' : '#fecaca';
                      return (
                        <div
                          key={i}
                          className={`grid grid-cols-12 gap-4 items-center px-4 py-3.5 rounded-xl border ${cfg.border} bg-white hover:shadow-sm transition-all duration-200`}
                          style={{ borderLeft: `4px solid ${cfg.accent}` }}
                        >
                          {/* Assessment name + icon */}
                          <div className="col-span-5 flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                              <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <span className={`text-sm font-bold ${cfg.color} truncate`}>{cfg.label}</span>
                          </div>
                          {/* Date */}
                          <div className="col-span-3 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            <span className="text-xs text-slate-500 font-medium">
                              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          {/* Score */}
                          <div className="col-span-2 flex justify-center">
                            <div
                              className="flex items-baseline gap-0.5 px-3 py-1.5 rounded-lg border"
                              style={{ background: scoreBg, borderColor: scoreBorder }}
                            >
                              <span className="text-base font-black tabular-nums" style={{ color: scoreColor }}>{item.score}</span>
                              <span className="text-[9px] text-slate-400 font-semibold">/ 100</span>
                            </div>
                          </div>
                          {/* Status */}
                          <div className="col-span-2 flex justify-center">
                            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-[10px] font-bold">Completed</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <Database className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-sm text-slate-500 font-semibold">No assessment history found.</p>
                  <p className="text-xs text-slate-400 mt-1.5">Complete a module to start tracking progress.</p>
                </div>
              )}
            </div>

            {/* ── Row 5: Improvement Suggestions — 3 equal columns ─── */}
            <div className="p-6 bg-slate-50/40 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Improvement Suggestions</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(improvementSuggestions).map(([category, tips]: any, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">{category}</h4>
                    <ul className="space-y-2 flex-1">
                      {tips.map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-purple-300 font-bold mt-0.5 flex-shrink-0">›</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Download Report — bottom right ───────────────────── */}
            <div className="px-6 py-5 bg-white flex justify-end">
              <button
                onClick={downloadReportAsPDF}
                disabled={downloadingPDF}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:opacity-95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
              >
                {downloadingPDF ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Generating PDF...</>
                ) : (
                  <>⬇ Download Report as PDF</>
                )}
              </button>
            </div>
          </div>

        </div>
      ) : (
        // Placement Predictor View
        <div className="space-y-8 text-left">
          {loadingPredictor ? (
            <div className="glass-card p-12 rounded-2xl flex flex-col items-center justify-center text-center min-h-[40vh]">
              <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-500 font-semibold">Running multi-dimensional predictive simulation...</p>
            </div>
          ) : (
            prediction && (
              <>
                {/* Score Dials */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 rounded-xl text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Placement Prob.</span>
                    <p className="text-3xl font-extrabold text-blue-600 mt-2">{prediction.placementReadinessScore}%</p>
                  </div>
                  <div className="glass-card p-5 rounded-xl text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Interview Readiness</span>
                    <p className="text-3xl font-extrabold text-purple-600 mt-2">{prediction.interviewReadinessScore}%</p>
                  </div>
                  <div className="glass-card p-5 rounded-xl text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Communication</span>
                    <p className="text-3xl font-extrabold text-cyan-600 mt-2">{prediction.communicationReadinessScore}%</p>
                  </div>
                  <div className="glass-card p-5 rounded-xl text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Technical Core</span>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-2">{prediction.technicalReadinessScore}%</p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Company Breakdown */}
                  <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-5">
                    <div>
                      <h3 className="font-bold text-slate-800">Company-Wise Compatibility</h3>
                      <p className="text-xs text-slate-400">Match score distributions representing recruiter interview expectations.</p>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: 'Accenture Compatibility', score: prediction.companyReadiness.accenture, color: 'bg-purple-600' },
                        { label: 'TCS Readiness', score: prediction.companyReadiness.tcs, color: 'bg-blue-600' },
                        { label: 'Cognizant Compatibility', score: prediction.companyReadiness.cognizant, color: 'bg-cyan-600' },
                        { label: 'Infosys Readiness', score: prediction.companyReadiness.infosys, color: 'bg-emerald-600' },
                        { label: 'Wipro Compatibility', score: prediction.companyReadiness.wipro, color: 'bg-amber-600' },
                        { label: 'Capgemini Readiness', score: prediction.companyReadiness.capgemini, color: 'bg-teal-600' },
                        { label: 'Product Companies (e.g. Amazon, Zoho)', score: prediction.companyReadiness.productCompanies, color: 'bg-indigo-600' },
                        { label: 'Tech Startups', score: prediction.companyReadiness.startups, color: 'bg-pink-600' },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700">{item.label}</span>
                            <span className="text-slate-900">{item.score}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-2xl bg-gradient-to-tr from-blue-50/20 to-purple-50/20">
                      <div className="flex items-center space-x-2 text-slate-800 mb-4">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-sm">AI Recommendation Path</h3>
                      </div>
                      <ul className="space-y-4">
                        {prediction.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start space-x-2 text-xs text-slate-600 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] mt-0.5 flex-shrink-0">
                              {i + 1}
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="glass-card p-5 rounded-xl text-left border-l-4 border-l-blue-500">
                      <div className="flex items-center space-x-1.5 text-blue-800 font-bold mb-1 text-xs">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span>Recruiter Insight</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Product-based recruiters score coding algorithms at 60% priority weights. Re-run Coding Diagnostics tests to improve compatibility metrics.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

