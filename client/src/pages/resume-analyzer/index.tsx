import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Upload, FileText, FileCheck, TrendingUp, AlertTriangle,
  CheckCircle, Download, RefreshCw, Search, Sparkles,
  X, Copy, Check, ChevronRight, Zap, Target, BarChart2, ChevronDown, Briefcase
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { ResumeAnalysis, ResumeValidationResponse } from '../../types/shared';
import { saveResumeFile, loadResumeFile, clearResumeFile } from './db';

const TARGET_ROLES = [
  'Java Developer',
  'Python Developer',
  'MERN Stack Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'AI / Machine Learning Engineer',
  'Data Scientist',
  'Data Analyst',
  'DevOps Engineer',
  'Cloud Engineer',
  'Cyber Security',
  'UI/UX Designer',
  'Mobile App Developer',
  'Blockchain Developer',
  'Software Engineer',
  'Embedded Systems',
  'IoT Developer',
  'Testing / QA Engineer',
  'Other (Custom Input)',
];

/* ─── Injected CSS animations (no external dep) ──────────────── */
const STYLES = `
@keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes scaleIn  { from{opacity:0;transform:scale(.95) translateY(10px)} to{opacity:1;transform:none} }
@keyframes spin     { to{transform:rotate(360deg)} }
@keyframes barFill  { from{width:0} }

.au  { animation: fadeUp   .45s ease both }
.ai  { animation: fadeIn   .35s ease both }
.asi { animation: scaleIn  .32s ease both }
.d1  { animation-delay:.06s } .d2{animation-delay:.12s}
.d3  { animation-delay:.18s } .d4{animation-delay:.24s}
.d5  { animation-delay:.30s } .d6{animation-delay:.36s}

.modal-bg {
  position:fixed;inset:0;z-index:60;display:flex;align-items:center;
  justify-content:center;padding:1rem;
  background:rgba(15,23,42,.5);backdrop-filter:blur(8px);
  animation:fadeIn .25s ease;
}
.modal-box {
  position:relative;width:100%;max-width:54rem;max-height:92vh;
  overflow-y:auto;background:#fff;border-radius:1.5rem;
  border:1px solid #e2e8f0;
  box-shadow:0 30px 80px -12px rgba(0,0,0,.22);
  animation:scaleIn .3s ease;
}
@media print {
  .no-print{display:none!important}
  #report{position:absolute;inset:0;background:#fff;z-index:999}
}
`;

/* ─── SVG Score Ring ──────────────────────────────────────────── */
function Ring({ score, size = 160, stroke = 'url(#rg)', bg = '#e2e8f0' }: { score: number; size?: number; stroke?: string; bg?: string }) {
  const r = 44; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="rg2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={r} fill="none" stroke={bg} strokeWidth="6" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={stroke} strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

/* ─── Mini horizontal progress bar ───────────────────────────── */
function Bar({ value, color, from }: { value: number; color: string; from?: number }) {
  return (
    <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
      {from !== undefined && (
        <div className="absolute h-full rounded-full opacity-30" style={{ width: `${from}%`, background: color }} />
      )}
      <div className="absolute h-full rounded-full" style={{
        width: `${value}%`, background: color,
        transition: 'width 1.3s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  );
}

/* ─── Score comparison row ────────────────────────────────────── */
function CompareRow({ label, before, after, color }: { label: string; before: number; after: number; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-slate-400">{before}%</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span style={{ color }}>{after}%</span>
          <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">+{after - before}%</span>
        </div>
      </div>
      <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="absolute h-full rounded-full opacity-25" style={{ width: `${before}%`, background: color }} />
        <div className="absolute h-full rounded-full" style={{ width: `${after}%`, background: color, transition: 'width 1.3s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export default function ResumeAnalyzer() {
  const [file, setFile]         = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ResumeAnalysis | null>(null);

  const [validationStatus, setValidationStatus] =
    useState<'idle' | 'validating' | 'valid' | 'invalid' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [confidenceScore, setConfidenceScore]     = useState(0);

  const [fileUrl, setFileUrl]   = useState('');
  const [docxHtml, setDocxHtml] = useState('');

  const [showOptimizer, setShowOptimizer] = useState(false);
  const [optimizerTab, setOptimizerTab]   = useState<'insights' | 'boost' | 'preview'>('insights');
  const [copied, setCopied]               = useState(false);
  const [downloading, setDownloading]     = useState(false);

  // ── Target Role State ─────────────────────────────────────────
  const [targetRole, setTargetRole]         = useState(() => localStorage.getItem('mockmate_target_role') || '');
  const [customRole, setCustomRole]         = useState(() => localStorage.getItem('mockmate_custom_role') || '');
  const [roleSearch, setRoleSearch]         = useState('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const effectiveRole = targetRole === 'Other (Custom Input)' ? customRole : targetRole;

  const pdfReportRef = useRef<HTMLDivElement>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

  /* ── Restore persisted session ──────────────────────────────── */
  useEffect(() => {
    sessionTimerRef.current = setTimeout(() => {
      const saved = localStorage.getItem('mockmate_ats_result');
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as ResumeAnalysis;
        setResult(parsed);
        setFileName(parsed.filename);
        const html = localStorage.getItem('mockmate_docx_html');
        if (html) setDocxHtml(html);
        const vs = localStorage.getItem('mockmate_validation_status');
        if (vs) setValidationStatus(vs as unknown as 'valid' | 'invalid' | 'error' | 'idle' | 'validating');
        const vm = localStorage.getItem('mockmate_validation_message');
        if (vm) setValidationMessage(vm);
        const cs = localStorage.getItem('mockmate_confidence_score');
        if (cs) setConfidenceScore(Number(cs));
        loadResumeFile().then(f => {
          if (f) { setFile(f); setFileUrl(URL.createObjectURL(f)); }
        }).catch(console.error);
      } catch (e) { console.error('Restore error:', e); }
    }, 0);
    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  }, []);

  /* ── File selection ─────────────────────────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = e.target.files?.[0];
    if (!sel) return;
    const nm = sel.name.toLowerCase();
    if (!nm.endsWith('.pdf') && !nm.endsWith('.docx') && !nm.endsWith('.doc')) {
      alert('Only PDF, DOCX, and DOC files are supported.'); return;
    }
    setFile(sel); setFileName(sel.name);
    setResult(null); setValidationStatus('idle');
    setValidationMessage(''); setFileUrl(''); setDocxHtml('');
    setFileUrl(URL.createObjectURL(sel));

    if (nm.endsWith('.docx') || nm.endsWith('.doc')) {
      const fd = new FormData(); fd.append('resume', sel);
      fetch(`${API}/resume/preview`, { method: 'POST', body: fd })
        .then(r => r.json()).then(d => { if (d.html) { setDocxHtml(d.html); localStorage.setItem('mockmate_docx_html', d.html); } })
        .catch(console.error);
    }
  };

  /* ── Validate → Analyze ─────────────────────────────────────── */
  const handleUpload = () => {
    if (!file) return;
    setValidationStatus('validating'); setLoading(true);
    const fd = new FormData(); fd.append('resume', file);

    fetch(`${API}/resume/validate`, { method: 'POST', body: fd })
      .then(async r => { if (!r.ok) throw new Error(`Server ${r.status}`); return r.json(); })
      .then((json: ResumeValidationResponse) => {
        setConfidenceScore(json.confidenceScore);
        setValidationMessage(json.message);
        if (!json.isValid) {
          setValidationStatus('invalid'); setLoading(false);
        } else {
          setValidationStatus('valid');
          localStorage.setItem('mockmate_validation_status', 'valid');
          localStorage.setItem('mockmate_confidence_score', String(json.confidenceScore));
          localStorage.setItem('mockmate_validation_message', json.message);
          saveResumeFile(file).catch(console.error);
          runAnalysis();
        }
      })
      .catch(err => {
        console.error(err);
        setValidationStatus('error');
        setValidationMessage(`Backend connection failed. ${err.message}`);
        setLoading(false);
      });
  };

  const runAnalysis = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('resume', file);
    if (effectiveRole) fd.append('targetRole', effectiveRole);
    fetch(`${API}/resume/analyze`, { method: 'POST', body: fd })
      .then(r => r.json())
      .then((json: ResumeAnalysis) => {
        setResult(json); setLoading(false);
        localStorage.setItem('mockmate_ats_result', JSON.stringify(json));
        localStorage.setItem('mockmate_uploaded_at', new Date().toISOString());
      })
      .catch(err => {
        console.error(err);
        setValidationStatus('error');
        setValidationMessage(`Analysis failed: ${err.message}`);
        setLoading(false);
      });
  };

  /* ── Re-upload (full reset) ─────────────────────────────────── */
  const handleReupload = () => {
    setFile(null); setFileName(''); setResult(null);
    setValidationStatus('idle'); setValidationMessage('');
    setConfidenceScore(0); setFileUrl(''); setDocxHtml('');
    ['mockmate_ats_result','mockmate_docx_html','mockmate_uploaded_at',
     'mockmate_validation_status','mockmate_validation_message','mockmate_confidence_score']
      .forEach(k => localStorage.removeItem(k));
    clearResumeFile().catch(console.error);
  };

  /* ── Handle role selection ────────────────────────────────────── */
  const handleRoleSelect = (role: string) => {
    setTargetRole(role);
    localStorage.setItem('mockmate_target_role', role);
    setRoleSearch('');
    setRoleDropdownOpen(false);
  };

  const handleCustomRoleChange = (val: string) => {
    setCustomRole(val);
    localStorage.setItem('mockmate_custom_role', val);
  };

  const filteredRoles = TARGET_ROLES.filter(r =>
    r.toLowerCase().includes(roleSearch.toLowerCase())
  );

  /* ── Download ATS Report as PDF ────────────────────────────── */
  const handleDownload = async () => {
    if (!result || !pdfReportRef.current) return;
    setDownloading(true);
    try {
      const el = pdfReportRef.current;
      // Make it briefly visible for canvas capture
      el.style.left = '0';
      el.style.visibility = 'visible';
      await new Promise(r => setTimeout(r, 80));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      el.style.left = '-9999px';
      el.style.visibility = 'hidden';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let yPos = 0;

      while (yPos < imgH) {
        if (yPos > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yPos, pageW, imgH);
        yPos += pageH;
      }

      const safeName = result.filename.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
      pdf.save(`ATS_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  /* ── Download optimized resume as text ─────────────────────── */
  const handleDownloadOptimized = () => {
    if (!result) return;
    const oc = result.optimizedContent;
    const blob = new Blob([
      `OPTIMIZED RESUME — Generated by MockMate AI\n${'='.repeat(50)}\n\n`,
      `PROFESSIONAL SUMMARY\n${'-'.repeat(30)}\n${oc.summary}\n\n`,
      `SKILLS\n${'-'.repeat(30)}\n${oc.skills.join(' • ')}\n\n`,
      `PROJECT HIGHLIGHTS\n${'-'.repeat(30)}\n${oc.projectHighlights.map((p,i)=>`${i+1}. ${p}`).join('\n\n')}\n\n`,
      `EXPERIENCE HIGHLIGHTS\n${'-'.repeat(30)}\n${oc.experienceHighlights.map(h=>`• ${h}`).join('\n')}\n\n`,
      `ACHIEVEMENTS\n${'-'.repeat(30)}\n${oc.achievements.join('\n')}\n\n`,
      `${'='.repeat(50)}\n`,
      `Original ATS Score : ${result.score}%\n`,
      `Optimized ATS Score: ${result.optimizedScore}%\n`,
      `ATS Improvement    : +${result.atsIncrease}%\n`,
      `Keywords Added     : ${result.keywordsAdded}\n`,
      `Skills Added       : ${result.skillsAdded}\n`,
    ], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `optimized_resume_${result.filename.replace(/\.[^/.]+$/, '')}.txt`;
    a.click();
  };

  /* ── Copy all text ──────────────────────────────────── */
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  /* ── Helpers ────────────────────────────────────────────────── */
  const uploadedAt = localStorage.getItem('mockmate_uploaded_at');
  const scoreLabel = !result ? '' :
    result.score >= 85 ? 'Excellent Match' :
    result.score >= 70 ? 'Good Match' :
    result.score >= 50 ? 'Average Match' : 'Needs Improvement';

  const scoreBadge = !result ? '' :
    result.score >= 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    result.score >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' :
    result.score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-rose-50 text-rose-700 border-rose-200';

  const subScores = result ? [
    { label: 'Structure',       value: result.structureScore,      opt: result.optimizedStructureScore,  color: '#6366f1' },
    { label: 'Skills Match',    value: result.skillsScore,         opt: result.optimizedSkillsScore,     color: '#8b5cf6' },
    { label: 'Projects',        value: result.projectsScore,       opt: result.optimizedProjectsScore,   color: '#a855f7' },
    { label: 'Experience',      value: result.experienceScore,     opt: result.optimizedExperienceScore, color: '#ec4899' },
    { label: 'Keywords',        value: result.keywordScore,        opt: result.optimizedKeywordScore,    color: '#10b981' },
    { label: 'Readability',     value: result.readabilityScore,    opt: result.optimizedReadabilityScore,color: '#f59e0b' },
    { label: 'Content Quality', value: result.contentQualityScore, opt: result.optimizedContentScore,   color: '#ef4444' },
  ] : [];

  /* ─── RENDER ────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <style>{STYLES}</style>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-slate-950">Resume Analyzer &amp; ATS Scanner</h1>
          <p className="text-slate-500 text-sm font-bold mt-1">
            AI-powered content analysis • Dynamic section scoring • ATS keyword engine
          </p>
        </div>
        {result && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
            <CheckCircle className="w-4 h-4" /> Analysis Complete — Data Saved
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── LEFT: Upload + Preview ───────────────────────────── */}
        <div className="lg:col-span-1 space-y-6 no-print">

          {/* Upload card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Upload Resume</h3>
            <label className="block border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-8 text-center transition-colors cursor-pointer bg-slate-50/40">
              <input aria-label="Upload Resume" type="file" accept=".pdf,.docx,.doc" onChange={handleFileChange} className="hidden" />
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Drag &amp; Drop or Click to Browse</p>
              <p className="text-xs text-slate-400 mt-1">PDF · DOCX · DOC &nbsp;|&nbsp; Max 5 MB</p>
            </label>

            {fileName && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{fileName}</p>
                  <p className="text-[10px] text-slate-400">Ready for AI analysis</p>
                </div>
              </div>
            )}

            {!result && (
              <button onClick={handleUpload} disabled={!file || loading}
                className="w-full mt-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" style={{ animation: 'spin .7s linear infinite' }} /> Scanning…</>
                  : <><Zap className="w-4 h-4" /> Run AI ATS Analysis</>}
              </button>
            )}
          </div>

          {/* ── Select Target Role card ───────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-slate-800 text-sm">Select Target Role</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">ATS analysis will be tailored to your selected role.</p>

            {/* Dropdown */}
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold bg-slate-50/40 hover:border-indigo-300 transition-colors"
              >
                <span className={targetRole ? 'text-slate-800' : 'text-slate-400'}>
                  {targetRole || 'Choose the role you are applying for'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleDropdownOpen && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                      <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={roleSearch}
                        onChange={e => setRoleSearch(e.target.value)}
                        placeholder="Search role…"
                        className="flex-1 text-xs bg-transparent outline-none text-slate-700"
                      />
                    </div>
                  </div>
                  {/* Options */}
                  <div className="max-h-52 overflow-y-auto">
                    {filteredRoles.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No roles found</p>
                    )}
                    {filteredRoles.map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleSelect(role)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                          targetRole === role ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom input if Other selected */}
            {targetRole === 'Other (Custom Input)' && (
              <input
                type="text"
                value={customRole}
                onChange={e => handleCustomRoleChange(e.target.value)}
                placeholder="Enter your target role…"
                className="mt-3 w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            )}

            {/* Clear */}
            {targetRole && (
              <button
                onClick={() => { setTargetRole(''); setCustomRole(''); localStorage.removeItem('mockmate_target_role'); localStorage.removeItem('mockmate_custom_role'); }}
                className="mt-2 text-[10px] text-slate-400 hover:text-rose-500 transition-colors font-semibold"
              >
                × Clear selection
              </button>
            )}
          </div>

          {/* Document Preview */}
          {file && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col" style={{ minHeight: 400 }}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> Preview
                </h3>
                <span className="text-xs text-slate-400 font-semibold">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                {file.name.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={`${fileUrl}#view=FitH`} className="w-full" style={{ height: 360 }} title="PDF" />
                ) : docxHtml ? (
                  <div className="p-4 overflow-auto text-slate-700 bg-white prose prose-sm max-w-none" style={{ height: 360 }}
                    dangerouslySetInnerHTML={{ __html: docxHtml }} />
                ) : (
                  <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height: 360 }}>
                    <span className="w-5 h-5 border-2 border-slate-300 border-t-indigo-500 rounded-full inline-block mr-2" style={{ animation: 'spin .7s linear infinite' }} />
                    Loading preview…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Results ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6" id="report">

          {/* VALIDATING */}
          {validationStatus === 'validating' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center text-center no-print" style={{ minHeight: '45vh' }}>
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mb-5" style={{ animation: 'spin .8s linear infinite' }} />
              <h3 className="font-bold text-slate-800 text-lg">Validating resume structure…</h3>
              <p className="text-sm text-slate-500 mt-1">Checking Education, Experience, Skills, Projects</p>
            </div>
          )}

          {/* ERROR */}
          {validationStatus === 'error' && (
            <div className="bg-white rounded-2xl border-2 border-rose-100 p-10 flex flex-col items-center text-center no-print" style={{ minHeight: '45vh' }}>
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-5">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-xl">Backend Connection Failed</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">{validationMessage}</p>
              <button onClick={handleReupload} className="mt-8 px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                Retry Connection
              </button>
            </div>
          )}

          {/* INVALID */}
          {validationStatus === 'invalid' && (
            <div className="bg-white rounded-2xl border-2 border-rose-100 p-10 flex flex-col items-center text-center no-print" style={{ minHeight: '45vh' }}>
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-5">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-xl">Invalid Document</h3>
              <div className="text-sm text-slate-600 max-w-md mt-4 leading-relaxed space-y-3">
                {(validationMessage || 'This document does not appear to be a professional resume.').split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="mt-8 flex gap-3 flex-wrap justify-center">
                <button onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                  Upload Resume
                </button>
                <button onClick={handleReupload} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* VALID — running analysis */}
          {validationStatus === 'valid' && !result && (
            <div className="bg-white rounded-2xl border border-emerald-100 p-10 flex flex-col items-center text-center no-print" style={{ minHeight: '45vh' }}>
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-5">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-xl">Valid Resume Detected</h3>
              <p className="text-sm text-slate-500 mt-2">
                Confidence: <span className="font-bold text-emerald-600">{confidenceScore}%</span>
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full inline-block" style={{ animation: 'spin .7s linear infinite' }} />
                Running AI ATS keyword analysis…
              </div>
            </div>
          )}

          {/* IDLE */}
          {validationStatus === 'idle' && !result && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 flex flex-col items-center text-center" style={{ minHeight: '45vh' }}>
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-5">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">No Analysis Yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-2">
                Upload your resume to run a full AI-powered ATS scan with section-wise scoring, gap analysis, and AI optimization.
              </p>
            </div>
          )}

          {/* ── RESULTS ───────────────────────────────────────── */}
          {result && (() => {

            return (
              <div className="space-y-6 au">

                {/* 1. ATS Score Hero */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center au">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">ATS Score</span>
                  <div className="relative" style={{ width: 180, height: 180 }}>
                    <Ring score={result.score} size={180} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-800">{result.score}%</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-1">Match Score</span>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3 justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${scoreBadge}`}>{scoreLabel}</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                      {result.classification} level
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-[10px] font-bold text-purple-600 uppercase tracking-wide">
                      <Sparkles className="w-3 h-3" />
                      AI Optimizable to {result.optimizedScore}%
                    </span>
                    {result.targetRole && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                        <Briefcase className="w-3 h-3" />
                        Target Role: {result.targetRole}
                      </span>
                    )}
                    {result.roleMatchLabel && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        result.roleMatchLabel === 'Strong Match'   ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        result.roleMatchLabel === 'Moderate Match' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                                     'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        <Target className="w-3 h-3" />
                        Role Match: {result.roleMatchLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Section-wise scores (7 cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subScores.map((s, i) => (
                    <div key={s.label} className={`bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow au d${i + 1}`}>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">{s.label}</span>
                      <p className="text-2xl font-extrabold mt-1.5" style={{ color: s.color }}>{s.value}%</p>
                      <Bar value={s.value} color={s.color} />
                    </div>
                  ))}
                </div>

                {/* 3. Gap analysis row */}
                <div className="grid md:grid-cols-3 gap-5">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 au d1">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <h4 className="font-bold text-slate-800 text-sm">Missing Skills</h4>
                    </div>
                    {result.missingSkills?.length
                      ? <div className="flex flex-wrap gap-1.5">{result.missingSkills.map((s,i) => <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 text-[11px] font-semibold border border-orange-100 rounded-lg">{s}</span>)}</div>
                      : <p className="text-xs text-slate-400 italic">No missing skills detected.</p>}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 au d2">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-rose-500" />
                      <h4 className="font-bold text-slate-800 text-sm">Missing Keywords</h4>
                    </div>
                    {result.missingKeywords?.length
                      ? <div className="flex flex-wrap gap-1.5">{result.missingKeywords.map((k,i) => <span key={i} className="px-2 py-1 bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-100 rounded-lg">{k}</span>)}</div>
                      : <p className="text-xs text-slate-400 italic">Good keyword coverage.</p>}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 au d3">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck className="w-4 h-4 text-indigo-500" />
                      <h4 className="font-bold text-slate-800 text-sm">Contact Channels</h4>
                    </div>
                    {result.missingContactInfo?.length
                      ? <div className="flex flex-wrap gap-1.5">{result.missingContactInfo.map((c,i) => <span key={i} className="px-2 py-1 bg-rose-50 text-rose-600 text-[11px] font-semibold border border-rose-100 rounded-lg">{c} missing</span>)}</div>
                      : <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold"><CheckCircle className="w-4 h-4" /> All contact details verified</div>}
                  </div>
                </div>

                {/* 4. Strengths & Suggestions */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 au d2">
                    <h4 className="font-bold text-slate-800 text-sm mb-4">Resume Evaluation</h4>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-2">Strengths</span>
                      <ul className="space-y-2">
                        {result.strengths.map((s,i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {result.weaknesses.length > 0 && (
                      <div className="border-t border-slate-100 mt-4 pt-4">
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-2">Weaknesses</span>
                        <ul className="space-y-2">
                          {result.weaknesses.map((w,i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 au d3">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-slate-800 text-sm">Actionable Suggestions</h4>
                    </div>
                    <ul className="space-y-3">
                      {result.suggestions.map((s,i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px] mt-0.5 flex-shrink-0">{i+1}</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 5. Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 no-print au d4">
                  <button onClick={() => { setShowOptimizer(true); setOptimizerTab('insights'); }}
                    className="flex-1 py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    <Sparkles className="w-4 h-4" /> AI Optimize Resume
                  </button>
                  <button onClick={handleDownload} disabled={downloading}
                    className="flex-1 py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-all hover:scale-[1.01] active:scale-[0.99]">
                    {downloading
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" style={{animation:'spin .7s linear infinite'}} /> Generating PDF…</>
                      : <><Download className="w-4 h-4" /> Download Report PDF</>}
                  </button>
                  <button onClick={handleReupload}
                    className="py-3.5 px-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all hover:scale-[1.01] active:scale-[0.99]">
                    <RefreshCw className="w-4 h-4" /> Re-Upload
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ─── AI OPTIMIZER MODAL ─────────────────────────────────── */}
      {showOptimizer && result && (() => {
        const oc = result.optimizedContent;
        const allText = `PROFESSIONAL SUMMARY\n${oc.summary}\n\nSKILLS\n${oc.skills.join(' • ')}\n\nPROJECT HIGHLIGHTS\n${oc.projectHighlights.join('\n\n')}\n\nEXPERIENCE HIGHLIGHTS\n${oc.experienceHighlights.join('\n')}\n\nACHIEVEMENTS\n${oc.achievements.join('\n')}`;
        const tabs: { key: 'insights' | 'boost' | 'preview'; label: string; icon: React.ReactNode }[] = [
          { key: 'insights', label: 'AI Insights',      icon: <Sparkles className="w-3.5 h-3.5" /> },
          { key: 'boost',    label: 'Score Boost',      icon: <BarChart2 className="w-3.5 h-3.5" /> },
          { key: 'preview',  label: 'Optimized Resume', icon: <FileCheck className="w-3.5 h-3.5" /> },
        ];

        return (
          <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowOptimizer(false)}>
            <div className="modal-box">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 pt-7 pb-0 rounded-t-2xl">
                <button onClick={() => setShowOptimizer(false)}
                  className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">AI Resume Optimization</h2>
                    <p className="text-xs text-slate-500">Content-driven improvements based on your actual resume</p>
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-1">
                  {tabs.map(tab => (
                    <button key={tab.key}
                      onClick={() => setOptimizerTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-colors ${
                        optimizerTab === tab.key
                          ? 'border-indigo-600 text-indigo-600 bg-indigo-50/60'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}>
                      {tab.icon}{tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab body */}
              <div className="p-8">

                {/* ── TAB 1: AI Insights ────────────────────── */}
                {optimizerTab === 'insights' && (
                  <div className="asi space-y-6">
                    <div className="grid sm:grid-cols-2 gap-5">
                      {/* Strengths */}
                      <div className="border border-emerald-100 rounded-2xl p-5 bg-emerald-50/30">
                        <h3 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Strengths ({result.aiInsights.strengths.length})
                        </h3>
                        <ul className="space-y-3">
                          {result.aiInsights.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">✓</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Weaknesses */}
                      <div className="border border-rose-100 rounded-2xl p-5 bg-rose-50/30">
                        <h3 className="text-sm font-bold text-rose-800 mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Weaknesses ({result.aiInsights.weaknesses.length})
                        </h3>
                        <ul className="space-y-3">
                          {result.aiInsights.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">✗</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="border border-indigo-100 rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#f5f3ff,#eef2ff)' }}>
                      <h3 className="text-sm font-bold text-indigo-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Improvement Roadmap
                      </h3>
                      <ul className="space-y-3">
                        {result.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{i+1}</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button onClick={() => setOptimizerTab('boost')}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                      View Score Boost Comparison <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* ── TAB 2: Score Boost ────────────────────── */}
                {optimizerTab === 'boost' && (
                  <div className="asi space-y-6">
                    {/* Before / After hero */}
                    <div className="grid sm:grid-cols-3 gap-4 text-center">
                      <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Current Score</span>
                        <div className="relative w-28 h-28 mx-auto">
                          <Ring score={result.score} size={112} />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-slate-700">{result.score}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="flex flex-col items-center gap-1">
                          <ChevronRight className="w-8 h-8 text-indigo-300" />
                          <span className="text-xs font-bold text-slate-400">AI Optimized</span>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold">
                          +{result.atsIncrease}% ATS Boost
                        </div>
                      </div>
                      <div className="border border-emerald-100 rounded-2xl p-5 bg-emerald-50/40">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mb-3">Optimized Score</span>
                        <div className="relative w-28 h-28 mx-auto">
                          <Ring score={result.optimizedScore} size={112} stroke="url(#rg2)" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-emerald-700">{result.optimizedScore}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section comparisons */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-800 mb-5">Section-wise Score Improvements</h3>
                      {subScores.map(s => (
                        <CompareRow key={s.label} label={s.label} before={s.value} after={s.opt} color={s.color} />
                      ))}
                    </div>

                    {/* Improvement metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Keywords Added',      value: `+${result.keywordsAdded}`, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'Skills Added',        value: `+${result.skillsAdded}`,   color: '#8b5cf6', bg: '#f5f3ff' },
                        { label: 'ATS Increase',        value: `+${result.atsIncrease}%`,  color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Readability Boost',   value: `+${result.readabilityIncrease}%`, color: '#f59e0b', bg: '#fffbeb' },
                      ].map(m => (
                        <div key={m.label} className="rounded-2xl p-4 text-center border" style={{ background: m.bg, borderColor: m.bg }}>
                          <p className="text-2xl font-black" style={{ color: m.color }}>{m.value}</p>
                          <p className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wide">{m.label}</p>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => setOptimizerTab('preview')}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                      View Optimized Resume Content <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* ── TAB 3: Optimized Preview ──────────────── */}
                {optimizerTab === 'preview' && (
                  <div className="asi space-y-5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800">AI-Generated Optimized Content</h3>
                      <button onClick={() => handleCopy(allText)}
                        className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: copied ? '#ecfdf5' : '#f5f3ff', color: copied ? '#059669' : '#7c3aed' }}>
                        {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy All</>}
                      </button>
                    </div>

                    {/* Professional Summary */}
                    <div className="border border-indigo-100 rounded-2xl overflow-hidden">
                      <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-indigo-700 flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)' }}>
                        <Sparkles className="w-3 h-3" /> Professional Summary
                      </div>
                      <p className="p-4 text-xs text-slate-700 leading-relaxed">{oc.summary}</p>
                    </div>

                    {/* Skills */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-600">Skills &amp; Technologies</div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {oc.skills.map((sk, i) => (
                          <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-lg border border-indigo-100">{sk}</span>
                        ))}
                      </div>
                    </div>

                    {/* Project Highlights */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-600">Project Highlights</div>
                      <ul className="p-4 space-y-3">
                        {oc.projectHighlights.map((p, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{i+1}</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Experience Highlights */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-600">Experience Highlights</div>
                      <ul className="p-4 space-y-2">
                        {oc.experienceHighlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />{h}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Achievements */}
                    <div className="border border-amber-100 rounded-2xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-amber-50 text-[10px] font-bold uppercase tracking-widest text-amber-700">Key Achievements</div>
                      <ul className="p-4 space-y-2">
                        {oc.achievements.map((a, i) => (
                          <li key={i} className="text-xs text-slate-700 leading-relaxed">{a}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Action row */}
                    <div className="flex gap-3 pt-2">
                      <button onClick={handleDownloadOptimized}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 transition-colors">
                        <Download className="w-4 h-4" /> Download Optimized Resume
                      </button>
                      <button onClick={() => setShowOptimizer(false)}
                        className="py-3 px-6 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {/* ── HIDDEN PDF REPORT TEMPLATE ────────────────────────── */}
      {result && (
        <div ref={pdfReportRef} className="absolute bg-white text-slate-800 p-10 font-sans"
          style={{ width: '800px', left: '-9999px', top: 0, visibility: 'hidden', zIndex: -1 }}>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-indigo-100">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">MockMate AI</h1>
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mt-1">ATS Optimization Report</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Generated On</p>
              <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="mb-6 flex gap-2">
            <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider">
              File: {result.filename}
            </div>
            {uploadedAt && (
              <div className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                Upload Time: {new Date(uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Score Ring */}
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Original ATS Score</p>
              <div className="relative w-32 h-32">
                <Ring score={result.score} size={128} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-800">{result.score}%</span>
                </div>
              </div>
              <span className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold border ${scoreBadge}`}>{scoreLabel}</span>
            </div>

            {/* Score Boost */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-col items-center justify-center">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Optimized Target</p>
              <div className="relative w-32 h-32">
                <Ring score={result.optimizedScore} size={128} stroke="url(#rg2)" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-emerald-700">{result.optimizedScore}%</span>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                <TrendingUp className="w-4 h-4" /> +{result.atsIncrease}% Boost Potential
              </span>
            </div>
          </div>

          {/* Section Scores */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" /> Section Analysis
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {subScores.map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
                    <span className="text-lg font-black" style={{ color: s.color }}>{s.value}%</span>
                  </div>
                  <Bar value={s.value} color={s.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Gap Analysis */}
          <div className="mb-8 grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Missing Skills
              </h3>
              {result.missingSkills?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills.map((s,i) => <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-lg border border-orange-100">{s}</span>)}
                </div>
              ) : <p className="text-xs text-slate-500 italic">No missing skills detected.</p>}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-500" /> Missing Keywords
              </h3>
              {result.missingKeywords?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((k,i) => <span key={i} className="px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100">{k}</span>)}
                </div>
              ) : <p className="text-xs text-slate-500 italic">Good keyword coverage.</p>}
            </div>
          </div>

          {/* Insights */}
          <div className="mb-8 page-break-inside-avoid">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> AI Action Plan
            </h3>
            <ul className="space-y-3">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">{i+1}</span>
                  <span className="pt-0.5 leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center pt-8 border-t-2 border-slate-100 mt-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Powered by MockMate AI</p>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}

