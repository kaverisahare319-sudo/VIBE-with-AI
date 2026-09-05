import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import {
  BrainCircuit, Send, Sparkles, Download, CheckCircle,
  User, FileText, MessageSquare,
  Lock, XCircle, Code2, Mic2, Activity,
  Target, Zap, Layout, Globe, Database, Cpu, BarChart3,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/useAuth';

// ─── STYLES ─────────────────────────────────────────────────────────────────
const STYLES = `
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn  { from{opacity:0}to{opacity:1} }
@keyframes blink   { 0%,100%{opacity:1}50%{opacity:0.3} }
@keyframes shimmer { 0%{background-position:-200% center}100%{background-position:200% center} }

.afu  { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
.afi  { animation: fadeIn 0.4s ease both; }
.d1   { animation-delay:100ms }
.d2   { animation-delay:200ms }
.d3   { animation-delay:300ms }
.d4   { animation-delay:400ms }

.bg-grid {
  background-color:#f8f9fc;
  background-image:
    linear-gradient(rgba(124,58,237,.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(124,58,237,.04) 1px,transparent 1px);
  background-size:36px 36px;
}
.gc {
  background:rgba(255,255,255,0.92);
  backdrop-filter:blur(20px);
  border:1px solid rgba(124,58,237,0.08);
  box-shadow:0 4px 24px -8px rgba(0,0,0,0.07);
}
.ai-bub {
  background:linear-gradient(135deg,#fafafe,#f3f0ff);
  border:1px solid rgba(124,58,237,0.12);
}
.usr-bub {
  background:linear-gradient(135deg,#7c3aed,#8b5cf6);
}
.chip { transition:all .18s; cursor:pointer; }
.chip:hover { background:#7c3aed; color:#fff; border-color:#7c3aed; transform:translateY(-1px); }
.cc { transition:all .22s; }
.cc:hover { transform:translateY(-3px); box-shadow:0 12px 32px -8px rgba(124,58,237,.18); border-color:rgba(124,58,237,.25)!important; }
.pb { height:6px; border-radius:99px; background:#ede9fe; overflow:hidden; }
.pf { height:100%; border-radius:99px; background:linear-gradient(90deg,#7c3aed,#06b6d4); transition:width 1s cubic-bezier(.16,1,.3,1); }
.scroll::-webkit-scrollbar{width:4px}
.scroll::-webkit-scrollbar-thumb{background:rgba(124,58,237,.2);border-radius:99px}
`;

// ─── TYPES ───────────────────────────────────────────────────────────────────
type MsgType = 'text' | 'roadmap';
type Msg = { id: string; role: 'ai' | 'user'; text: string; type?: MsgType; roadmap?: RoadmapData; };

// ─── STUDENT PROFILE (mock – replace with real API later) ───────────────────
const STUDENT = {
  name:   'Student Profile',
  goal:   'Frontend Developer',
  level:  'Final Year B.Tech',
  scores: {
    ats:           85,
    resumeStrength:80,
    skillMatch:    72,
    keywordMatch:  68,
    coding:        45,
    dsa:           38,
    mcq:           60,
    communication: 90,
    fluency:       88,
    confidence:    82,
    bodyLanguage:  75,
    eyeContact:    70,
    posture:       80,
    interview:     55,
    technicalInt:  48,
    hrInt:         72,
    gd:            85,
    leadership:    80,
    teamwork:      88,
    placement:     78,
  }
};

const S = STUDENT.scores;

// ─── ASSESSMENT TRACKER ──────────────────────────────────────────────────────
const ASSESSMENTS = [
  'Resume Analyzer','Coding Assessment','Communication Analysis',
  'Body Language Analysis','Mock Interview','GD Simulator','Placement Predictor'
];

// ─── CAREER PATH MATCHING ────────────────────────────────────────────────────
function computeCareerPaths() {
  const comm  = (S.communication + S.fluency + S.confidence) / 3;
  const tech  = (S.coding + S.dsa + S.technicalInt) / 3;
  const inter = (S.interview + S.gd + S.leadership) / 3;
  return [
    { title:'Frontend Developer',   icon:Layout,   color:'#7c3aed',
      match:Math.round(0.35*S.ats + 0.35*tech + 0.15*comm + 0.15*S.skillMatch),
      desc:'React · TypeScript · CSS' },
    { title:'Full Stack Developer',  icon:Globe,    color:'#8b5cf6',
      match:Math.round(0.3*tech + 0.25*S.ats + 0.25*comm + 0.2*S.skillMatch),
      desc:'React · Node.js · MongoDB' },
    { title:'Backend Developer',     icon:Database, color:'#06b6d4',
      match:Math.round(0.4*tech + 0.2*S.ats + 0.2*S.skillMatch + 0.2*inter),
      desc:'Node.js · Express · SQL' },
    { title:'Data Analyst',          icon:BarChart3,color:'#22c55e',
      match:Math.round(0.35*tech + 0.25*comm + 0.25*S.skillMatch + 0.15*S.mcq),
      desc:'Python · SQL · Tableau' },
    { title:'AI Engineer',           icon:Cpu,      color:'#f59e0b',
      match:Math.round(0.4*tech + 0.25*S.dsa + 0.2*S.skillMatch + 0.15*S.mcq),
      desc:'Python · ML · Deep Learning' },
  ].sort((a,b)=>b.match-a.match);
}

const CAREER_PATHS = computeCareerPaths();

// ─── INSIGHTS CARDS ──────────────────────────────────────────────────────────
const INSIGHTS = [
  { label:'ATS Readiness',    score:S.ats,          icon:FileText, color:'#7c3aed' },
  { label:'Coding Score',     score:S.coding,       icon:Code2,    color:'#ef4444' },
  { label:'Communication',    score:S.communication, icon:Mic2,    color:'#22c55e' },
  { label:'Interview Score',  score:S.interview,    icon:Activity, color:'#f59e0b' },
];

const OVERALL = Math.round((S.ats+S.coding+S.communication+S.interview)/4);

// ─── SUGGEST QUESTIONS ───────────────────────────────────────────────────────
const SUGGESTS = [
  'What skills should I learn next?',
  'Am I ready for placements?',
  'Which career path suits me?',
  'How can I improve my ATS score?',
  'Generate my career roadmap',
];

// ─── ROADMAP TYPE ─────────────────────────────────────────────────────────────
interface MonthPlan { month:string; tasks:string[]; }
interface RoadmapData {
  currentLevel: string; targetRole: string;
  skillGaps: string[]; strengths: string[];
  months: MonthPlan[];
  projects: string[]; certs: string[];
  interviewPlan: string[];
  companies: string[]; salary: string;
  actionPlan: string[];
}

// ─── GENERATE ROADMAP DATA ───────────────────────────────────────────────────
function generateRoadmapData(): RoadmapData {
  const weakCoding   = S.coding     < 60;
  const weakDSA      = S.dsa        < 50;
  const weakInterview= S.interview  < 65;
  const weakComm     = S.communication < 70;
  const weakATS      = S.ats        < 75;

  const skillGaps: string[] = [];
  const strengths: string[] = [];

  if (weakCoding)    skillGaps.push('Core programming & data structures');
  if (weakDSA)       skillGaps.push('Algorithm problem solving (DSA)');
  if (weakInterview) skillGaps.push('Technical interview techniques');
  if (weakComm)      skillGaps.push('Communication & presentation');
  if (weakATS)       skillGaps.push('Resume keyword optimization');
  if (S.keywordMatch < 75) skillGaps.push('Industry-specific keywords in resume');

  if (S.communication >= 80) strengths.push('Strong verbal communication');
  if (S.ats           >= 80) strengths.push('Well-structured resume');
  if (S.gd            >= 80) strengths.push('Excellent group discussion skills');
  if (S.bodyLanguage  >= 75) strengths.push('Confident body language');
  if (S.skillMatch    >= 70) strengths.push('Good technical skills alignment');

  const months: MonthPlan[] = [];

  // Month 1
  const m1: string[] = [];
  if (weakDSA)    m1.push('Solve 30 LeetCode problems (Easy -> Medium) - Arrays, Strings, Hashmaps');
  if (weakCoding) m1.push('Complete JavaScript Fundamentals & ES6+ deep dive');
  m1.push('Build: Personal Portfolio Website with React + TypeScript');
  if (weakATS)    m1.push('Revamp resume: add quantified achievements & role keywords');
  months.push({ month:'Month 1 - Foundation & Gaps', tasks: m1 });

  // Month 2
  const m2: string[] = [];
  m2.push('React.js + Hooks + State Management (Zustand/Redux)');
  if (weakDSA)       m2.push('Solve 40 more DSA problems — Trees, Graphs, DP');
  if (weakInterview) m2.push('Complete 5 mock technical interviews on InterviewBit');
  m2.push('Project: Build a full-stack CRUD app (Job Tracker / Blog)');
  months.push({ month:'Month 2 – Build & Practice', tasks: m2 });

  // Month 3
  const m3: string[] = [];
  m3.push('REST APIs + Node.js + Express.js fundamentals');
  m3.push('Complete a Git & GitHub workflow course');
  if (weakInterview) m3.push('Practice 10 HR + Behavioral mock interviews (STAR method)');
  m3.push('Project: Full-stack project with authentication & deployment');
  months.push({ month:'Month 3 – Backend & Portfolio', tasks: m3 });

  // Month 4
  const m4: string[] = [];
  m4.push('Complete target certification (Meta Frontend / AWS Cloud / Google Analytics)');
  m4.push('Optimize LinkedIn profile with 500+ connections');
  m4.push('Apply to 20 companies - use tailored resume for each');
  m4.push('Join 2 open-source projects on GitHub');
  months.push({ month:'Month 4 - Certification & Applications', tasks: m4 });

  // Month 5
  const m5: string[] = [];
  m5.push('Attend campus placement drives & company-specific tests');
  m5.push('Practice 5 system design questions for product companies');
  m5.push('Finalize portfolio website with 3+ live deployed projects');
  m5.push('Connect with 10 alumni working in target companies');
  months.push({ month:'Month 5 - Active Placement Phase', tasks: m5 });

  // Month 6
  const m6: string[] = [];
  m6.push('Negotiate offers & evaluate company culture fit');
  m6.push('Continue DSA practice to stay sharp for late drives');
  m6.push('Reflect on interview feedback and iterate your approach');
  months.push({ month:'Month 6 - Offer Stage & Finalization', tasks: m6 });

  const projects = weakCoding
    ? ['Portfolio Website (React + TypeScript)', 'Full-Stack Job Portal (React + Node + MongoDB)', 'Chat Application with Socket.io']
    : ['E-Commerce Platform (React + Stripe + Node)', 'Real-Time Collaboration Tool', 'AI-powered Resume Builder'];

  const certs = S.ats < 80
    ? ['Meta Frontend Developer Certificate (Coursera)', 'Google UX Design Certificate', 'AWS Cloud Practitioner']
    : ['AWS Solutions Architect', 'MongoDB Developer Certification', 'Google Data Analytics'];

  const interviewPlan = [
    `Week 1-2: Review ${weakDSA ? 'Arrays, Strings, Recursion' : 'Trees, Graphs, Dynamic Programming'}`,
    'Week 3: 5 timed LeetCode mock contests',
    'Week 4: 3 full technical + 2 HR mock interviews',
    `Month 2+: Company-specific prep (${CAREER_PATHS[0].title} role, ${weakInterview ? 'focus on STAR method' : 'advanced system design'})`,
  ];

  const companies = S.coding < 60
    ? ['Infosys', 'Wipro', 'TCS', 'Capgemini', 'Cognizant']
    : ['Accenture', 'HCL', 'LTIMindtree', 'Mphasis', 'Persistent Systems'];

  const salaryLow  = S.coding < 60 ? 4  : 6;
  const salaryHigh = S.coding < 60 ? 7  : 12;
  const salary     = `Rs. ${salaryLow} - Rs. ${salaryHigh} LPA (entry level, ${CAREER_PATHS[0].title})`;

  const actionPlan = [
    `Start today: Solve 1 LeetCode problem + review ${skillGaps[0] ?? 'your weakest module'}`,
    'This week: Revamp your resume with 3 quantified achievements',
    'This month: Complete all Month 1 roadmap tasks without skipping',
    `3-month goal: Reach ${Math.min(OVERALL + 18, 95)}% placement readiness from current ${OVERALL}%`,
  ];

  return { currentLevel:STUDENT.level, targetRole:STUDENT.goal, skillGaps, strengths, months, projects, certs, interviewPlan, companies, salary, actionPlan };
}

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
function buildPDFDocument(roadmap: RoadmapData) {
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const W = 210; const margin = 18;
  let y = 20;

  const section = (title: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    y += 4;
    doc.setFillColor(124, 58, 237);
    doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F');
    doc.setFontSize(10); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
    doc.text(title.toUpperCase(), margin + 4, y + 5.5);
    doc.setTextColor(30,30,30); doc.setFont('helvetica','normal');
    y += 12;
  };

  const line = (text: string, indent = 0, size = 10, color = [50,50,50] as [number,number,number]) => {
    if (y > 272) { doc.addPage(); y = 20; }
    doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W - margin * 2 - indent - 4);
    lines.forEach((l: string) => { doc.text(l, margin + indent, y); y += 5.5; });
  };

  // Header
  doc.setFillColor(124,58,237);
  doc.rect(0,0,W,28,'F');
  doc.setFontSize(18); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
  doc.text('MockMate AI', margin, 14);
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.text('Personalized Career Roadmap', margin, 21);
  doc.setFontSize(9); doc.setTextColor(200,180,255);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'})}`, W-margin, 21, {align:'right'});
  y = 36;

  // Student Info
  doc.setFillColor(245,242,255); doc.rect(margin, y, W-margin*2, 20, 'F');
  doc.setFontSize(13); doc.setTextColor(124,58,237); doc.setFont('helvetica','bold');
  doc.text(STUDENT.name, margin+4, y+8);
  doc.setFontSize(9); doc.setTextColor(80,80,80); doc.setFont('helvetica','normal');
  doc.text(`${roadmap.currentLevel}  |  Target: ${roadmap.targetRole}  |  Overall Readiness: ${OVERALL}%`, margin+4, y+16);
  y += 26;

  // Assessment Summary
  section('Assessment Summary');
  const cols = [
    ['ATS Score', S.ats+'%'], ['Coding', S.coding+'%'], ['Communication', S.communication+'%'],
    ['Interview', S.interview+'%'], ['GD Score', S.gd+'%'], ['Placement Ready', S.placement+'%'],
  ];
  cols.forEach(([k,v],i) => {
    const cx = margin + (i%3)*58; const cy = y + Math.floor(i/3)*12;
    doc.setFontSize(8); doc.setTextColor(100,100,100); doc.text(k, cx, cy);
    doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.setTextColor(124,58,237); doc.text(v, cx, cy+6);
    doc.setFont('helvetica','normal');
  });
  y += 30;

  // Strengths & Gaps
  section('Skill Analysis');
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(34,197,94);
  doc.text('Strengths:', margin, y); y += 6;
  roadmap.strengths.forEach(s => line('+  ' + s, 2, 9, [30,120,50]));
  y += 3;
  doc.setFont('helvetica','bold'); doc.setTextColor(239,68,68);
  doc.text('Skill Gaps:', margin, y); y += 6;
  roadmap.skillGaps.forEach(g => line('!  ' + g, 2, 9, [160,40,40]));
  doc.setTextColor(30,30,30); doc.setFont('helvetica','normal');

  // Career Matches
  section('Career Path Match');
  CAREER_PATHS.slice(0,3).forEach((p,i) => {
    line(`${i+1}. ${p.title}  -  Match: ${p.match}%`, 0, 10, [70,70,70]);
  });

  // 6-Month Roadmap
  section('6-Month Learning Roadmap');
  roadmap.months.forEach(m => {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(124,58,237);
    doc.text(m.month, margin, y); y += 5;
    doc.setFont('helvetica','normal'); doc.setTextColor(50,50,50);
    m.tasks.forEach(t => line('• ' + t, 4, 9));
    y += 3;
  });

  // Projects
  section('Projects to Build');
  roadmap.projects.forEach(p => line('• ' + p, 2, 9));

  // Certifications
  section('Certifications to Complete');
  roadmap.certs.forEach(c => line('• ' + c, 2, 9));

  // Interview Plan
  section('Interview Preparation Plan');
  roadmap.interviewPlan.forEach(p => line('• ' + p, 2, 9));

  // Companies & Salary
  section('Placement Strategy');
  line('Recommended Companies: ' + roadmap.companies.join(', '), 0, 9);
  y += 2;
  line('Expected Salary Range: ' + roadmap.salary, 0, 9);

  // Action Plan
  section('Final Action Plan');
  roadmap.actionPlan.forEach((a,i) => line(`Step ${i+1}: ${a}`, 2, 9));

  // Footer
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(180,180,180);
    doc.text(`MockMate AI  |  Page ${i} of ${totalPages}  |  Confidential`, W/2, 292, {align:'center'});
  }

  return doc;
}

// ─── AI RESPONSE ENGINE ──────────────────────────────────────────────────────
function buildResponse(q: string): { text: string; isRoadmap: boolean; roadmap?: RoadmapData } {
  const lq = q.toLowerCase();

  if (lq.includes('roadmap') || lq.includes('generate')) {
    const rm = generateRoadmapData();
    return { text: '__ROADMAP__', isRoadmap: true, roadmap: rm };
  }

  if (lq.includes('skill') && lq.includes('learn')) {
    const hi = ['React.js', 'TypeScript', 'REST APIs']; // always
    const me = S.coding < 60 ? ['Data Structures', 'Algorithms', 'Git & GitHub'] : ['Git & GitHub', 'SQL', 'Node.js'];
    const lo = S.coding < 60 ? ['System Design', 'Docker', 'Cloud Basics'] : ['System Design', 'Docker', 'Kubernetes'];
    return { text: `**Skill Learning Roadmap — Based on Your Assessment Data**

Your assessment scores reveal a clear learning priority stack:

🔴 **Priority 1 (Critical):**
${hi.map(s=>'• '+s).join('\n')}

🟡 **Priority 2 (Important):**
${me.map(s=>'• '+s).join('\n')}

🟢 **Priority 3 (Nice to Have):**
${lo.map(s=>'• '+s).join('\n')}

_Basis: Coding ${S.coding}%, DSA ${S.dsa}%, Skill Match ${S.skillMatch}%. Closing these gaps can push your placement readiness from ${OVERALL}% → 90%+._`, isRoadmap:false };
  }

  if (lq.includes('ready') || lq.includes('placement')) {
    const strong: string[] = [], weak: string[] = [];
    if (S.communication>=80) strong.push('Strong communication skills ('+S.communication+'%)');
    if (S.ats>=80)           strong.push('Well-structured resume (ATS '+S.ats+'%)');
    if (S.gd>=80)            strong.push('Excellent group discussion ('+S.gd+'%)');
    if (S.coding<60)         weak.push('Coding & DSA ('+S.coding+'% — target 75%+)');
    if (S.interview<65)      weak.push('Technical interview confidence ('+S.interview+'%)');
    if (S.dsa<50)            weak.push('Problem-solving speed (DSA '+S.dsa+'%)');
    const extra = Math.round((90 - S.placement)/6);
    return { text:`**Placement Readiness Analysis**

✅ **Strengths:**
${strong.map(s=>'✓ '+s).join('\n')}

⚠️ **Areas to Improve:**
${weak.map(w=>'⚠ '+w).join('\n')}

📊 **Current Readiness: ${S.placement}%**
🎯 **Target: 92%**

💡 **Recommendation:** Complete ${extra} mock interviews and build ${S.coding<60?'2':'1'} industry-level project${S.coding<60?'s':''} to reach 90%+ readiness within ${Math.max(2,extra)} months.`, isRoadmap:false };
  }

  if (lq.includes('career') || lq.includes('path') || lq.includes('suit')) {
    return { text:`**Career Path Analysis — Based on Your Complete Profile**

${CAREER_PATHS.slice(0,4).map((p,i)=>`${i+1}. **${p.title}** — Match: ${p.match}%
   ${p.desc}
   ${p.match>=80?'✅ Strong match — pursue actively':'⚡ Achievable with skill development'}`).join('\n\n')}

📌 **Best Match: ${CAREER_PATHS[0].title} at ${CAREER_PATHS[0].match}%**
Based on your ATS (${S.ats}%), Communication (${S.communication}%), and Skill Match (${S.skillMatch}%) scores.`, isRoadmap:false };
  }

  if (lq.includes('ats') || lq.includes('resume')) {
    const missing: string[] = [];
    if (S.keywordMatch<80) missing.push('Industry role-specific keywords (e.g. "REST APIs", "CI/CD", "Agile")');
    missing.push('Quantified achievements (numbers, impact, scale)');
    if (S.skillMatch<80)   missing.push('Missing technical skills from JD matching');
    return { text:`**ATS Score Analysis — Current: ${S.ats}%**

✅ **Working Well:**
• Resume structure & formatting (${S.resumeStrength}%)
• Skills section coverage

⚠️ **Missing Elements:**
${missing.map(m=>'• '+m).join('\n')}

**Before → After Example:**
❌ "Built a web application"
✅ "Developed a responsive full-stack React app serving 500+ users with 99.9% uptime, reducing load time by 42%."

📈 **Expected improvement: +${S.ats<80?'12–18':'5–10'}% ATS score** after implementing these changes.`, isRoadmap:false };
  }



  // Generic fallback
  return { text:`**AI Career Mentor Analysis — ${STUDENT.name}**

Based on your MockMate AI performance:

📊 **Your Profile Snapshot:**
• ATS Score: ${S.ats}%  |  Coding: ${S.coding}%  |  Communication: ${S.communication}%
• Interview: ${S.interview}%  |  GD: ${S.gd}%  |  Placement Ready: ${S.placement}%

🏆 **Best Career Match:** ${CAREER_PATHS[0].title} (${CAREER_PATHS[0].match}%)

🎯 **Top Priority:** ${S.coding<60?'Improve DSA & coding skills (currently '+S.coding+'%)':'Prepare for technical interviews ('+S.interview+'%)'}

Try asking me a specific question or click **"Generate my career roadmap"** for your complete personalized plan!`, isRoadmap:false };
}

// ─── ROADMAP PREVIEW CARD ────────────────────────────────────────────────────
function RoadmapCard({ data }: { data: RoadmapData }) {
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [docRef, setDocRef] = React.useState<jsPDF | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  React.useEffect(() => {
    const doc = buildPDFDocument(data);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDocRef(doc);
    const url = doc.output('bloburl');
    setPdfUrl(url as unknown as string);
    return () => URL.revokeObjectURL(url as unknown as string);
  }, [data]);

  const handleDownload = () => {
    if (docRef) docRef.save('MockMate_Career_Roadmap.pdf');
  };
  return (
    <div className="ai-bub rounded-2xl rounded-tl-sm p-5 space-y-4 afu">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
          <Target className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-black text-violet-700">Personalized Career Roadmap Generated ✓</span>
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-violet-100">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
        >
          <Download className="w-3 h-3" /> Download PDF
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors shadow-sm"
          >
            {showPreview ? 'Hide Preview' : '👁️ View'}
          </button>
          
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="mt-2 border-t border-violet-100 pt-4 afi">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Roadmap PDF Preview</p>
          {pdfUrl ? (
            <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-inner">
              <iframe src={pdfUrl} className="w-full h-full border-none" title="PDF Preview" />
            </div>
          ) : (
            <div className="w-full h-[400px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BUBBLE COMPONENTS ────────────────────────────────────────────────────────
function AIBubble({ text, roadmap }: { text:string; roadmap?:RoadmapData }) {
  if (roadmap) return (
    <div className="flex gap-3 afu">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-md mt-1">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1"><RoadmapCard data={roadmap} /></div>
    </div>
  );
  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex gap-3 afu">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-md mt-1">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="ai-bub rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
        <p className="text-[12.5px] text-slate-700 leading-relaxed whitespace-pre-line">
          {renderBoldText(text)}
        </p>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text:string }) {
  return (
    <div className="flex gap-3 flex-row-reverse afu">
      <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-slate-500" />
      </div>
      <div className="usr-bub rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
        <p className="text-[12.5px] text-white leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function TypingDots({ status }:{ status:string }) {
  return (
    <div className="flex gap-3 afi">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-md">
        <Sparkles className="w-4 h-4 text-white" style={{animation:'blink 1.4s infinite'}} />
      </div>
      <div className="ai-bub rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-3">
        {[0,1,2].map(i=><div key={i} className={`w-1.5 h-1.5 rounded-full bg-violet-500`} style={{animation:`blink 1.4s ${i*150}ms infinite`}} />)}
        <span className="text-[11px] text-violet-600 font-medium">{status}</span>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CareerRoadmap() {
  const [completedCount] = useState(7);
  const { user } = useAuth();
  const displayName = user?.name || STUDENT.name;
  const [msgs, setMsgs] = useState<Msg[]>([{
    id:'0', role:'ai', type:'text',
    text:`**Hello ${displayName ? displayName.split(' ')[0] : 'there'} 👋 — AI Career Mentor Online**\n\nI've analyzed your complete MockMate AI profile:\n• ATS: ${S.ats}% · Coding: ${S.coding}% · Communication: ${S.communication}%\n• Interview: ${S.interview}% · GD: ${S.gd}% · Placement Ready: ${S.placement}%\n\nAsk me anything about your career, or click **"Generate my career roadmap"** for your personalized 6-month plan.`
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  const scroll = () => setTimeout(()=>chatRef.current?.scrollTo({top:999999,behavior:'smooth'}),80);

  const send = async (text: string) => {
    if (!text.trim() || isTyping) return;
    setMsgs(p=>[...p,{id:Date.now()+'u',role:'user',type:'text',text}]);
    setInput('');
    setIsTyping(true);
    scroll();

    const steps = ['Analyzing your assessments…','Cross-referencing scores…','Generating personalized response…'];
    for (const s of steps) { setTypingStatus(s); await new Promise(r=>setTimeout(r,600)); }

    const res = buildResponse(text);
    setIsTyping(false);

    if (res.isRoadmap && res.roadmap) {
      setMsgs(p=>[...p,{id:Date.now()+'a',role:'ai',type:'roadmap',text:'__ROADMAP__',roadmap:res.roadmap}]);
    } else {
      setMsgs(p=>[...p,{id:Date.now()+'a',role:'ai',type:'text',text:res.text}]);
    }
    scroll();
  };

  const pct  = Math.round((completedCount/7)*100);

  // ── LOCK SCREEN ─────────────────────────────────────────────────────────────
  if (completedCount < 7) {
    return (
      <DashboardLayout>
        <style dangerouslySetInnerHTML={{__html:STYLES}} />
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-grid rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 to-slate-900/90 rounded-3xl" />
          <div className="gc rounded-2xl p-10 max-w-md w-full z-10 text-center afu">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">AI Analysis Required</h2>
            <p className="text-sm text-slate-500 mb-6">Complete all assessments to unlock your personalized career roadmap.</p>
            <div className="pb mb-2"><div className="pf" style={{width:`${pct}%`}} /></div>
            <p className="text-xs text-slate-400 mb-6">{completedCount} of 7 · {pct}% complete</p>
            {ASSESSMENTS.map((a,i)=>(
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 text-left">
                {i<completedCount?<CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0"/>:<XCircle className="w-4 h-4 text-slate-300 flex-shrink-0"/>}
                <span className={`text-sm ${i<completedCount?'text-slate-700 font-medium':'text-slate-400'}`}>{a}</span>
              </div>
            ))}
            <button className="mt-6 w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
              Complete Remaining Assessments
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── MAIN DASHBOARD ───────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <style dangerouslySetInnerHTML={{__html:STYLES}} />
      <div className="bg-grid min-h-[calc(100vh-8rem)] rounded-3xl p-5 space-y-4 relative overflow-auto">
        <div className="pointer-events-none absolute top-0 right-0 w-80 h-80 rounded-full bg-violet-400 opacity-10 blur-[90px] translate-x-20 -translate-y-20" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-80 h-80 rounded-full bg-cyan-400 opacity-10 blur-[90px] -translate-x-20 translate-y-20" />

        {/* HEADER */}
        <div className="gc rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 afu relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-1.5">
              <Sparkles className="w-3 h-3" /> AI Career Mentor
            </div>
            <h1 className="text-xl font-black mb-0.5 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-slate-950">Personalized Career Intelligence</h1>
            <p className="text-[11.5px] text-slate-500 max-w-xl">Dynamic AI guidance based on your resume, coding, communication, interview, and GD assessment data.</p>
          </div>
          <div className="gc rounded-xl p-4 min-w-[230px] border border-violet-100/60">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assessments</span>
              <span className="text-xs font-black text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All Done</span>
            </div>
            <div className="pb mb-1.5"><div className="pf" style={{width:`${pct}%`}} /></div>
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-400">{completedCount} / 7 Completed</span>
              <span className="text-[10px] font-black text-violet-600">{pct}%</span>
            </div>
          </div>
        </div>

        {/* QUICK INSIGHTS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          {INSIGHTS.map((ins,i)=>(
            <div key={i} className={`gc rounded-2xl p-4 afu d${i+1}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:ins.color+'18'}}>
                  <ins.icon className="w-4 h-4" style={{color:ins.color}} />
                </div>
                <span className="text-lg font-black" style={{color:ins.color}}>{ins.score}%</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 mb-2">{ins.label}</p>
              <div className="pb" style={{background:ins.color+'20'}}>
                <div className="pf" style={{width:`${ins.score}%`,background:ins.color}} />
              </div>
            </div>
          ))}
        </div>

        {/* SPLIT LAYOUT — equal height columns */}
        <div className="grid lg:grid-cols-[300px_1fr] gap-4 relative z-10 items-stretch">

          {/* LEFT — flex column so it drives row height */}
          <div className="flex flex-col gap-4">

            {/* Profile */}
            <div className="gc rounded-2xl p-5 afu d2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg">{displayName.charAt(0).toUpperCase()}</div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">{displayName}</h3>
                  <p className="text-[10px] text-slate-400">{STUDENT.level}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
                  <p className="text-[9px] text-violet-400 font-bold uppercase tracking-widest">Readiness</p>
                  <p className="text-xl font-black text-violet-700">{OVERALL}%</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Target</p>
                  <p className="text-xl font-black text-emerald-600">92%</p>
                </div>
              </div>
              {[{label:'Career Goal',value:STUDENT.goal},{label:'Best Match',value:`${CAREER_PATHS[0].title} (${CAREER_PATHS[0].match}%)`},{label:'Timeline',value:'3–4 Months'}].map((r,i)=>(
                <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-[10px] text-slate-400">{r.label}</span>
                  <span className="text-[10px] font-bold text-slate-700">{r.value}</span>
                </div>
              ))}
            </div>

            {/* AI Mentor CTA */}
            <div className="rounded-2xl p-5 afu d3 relative overflow-hidden" style={{background:'linear-gradient(135deg,#7c3aed,#8b5cf6,#06b6d4)'}}>
              <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white">AI Career Mentor</p>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                      <span className="text-[9px] text-white/70">Live · Analyzing your data</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-white/90 leading-relaxed mb-4">Personalized recommendations powered by your actual assessment results — not templates.</p>
                <button onClick={()=>send('Generate my career roadmap')}
                  className="w-full py-2.5 bg-white/20 hover:bg-white/30 border border-white/20 text-white text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Generate Career Roadmap
                </button>
              </div>
            </div>

            {/* Career Paths — flex-1 so it grows to fill remaining height */}
            <div className="gc rounded-2xl p-5 afu d4 flex-1">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-violet-500" /> Career Path Matches
              </h3>
              <div className="space-y-2">
                {CAREER_PATHS.map((p,i)=>(
                  <div key={i} className="cc flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-white cursor-pointer">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:p.color+'15'}}>
                      <p.icon className="w-4 h-4" style={{color:p.color}} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{p.title}</p>
                      <p className="text-[9px] text-slate-400">{p.desc}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[12px] font-black" style={{color:p.color}}>{p.match}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — CHAT: fills 100% of left column height */}
          <div className="gc rounded-2xl flex flex-col overflow-hidden afu d2" style={{minHeight: 500}}>
            {/* Chat header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">AI Career Mentor</p>
                  <p className="text-[10px] text-slate-400">Powered by your actual assessment data · Not a template</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-slate-400 font-medium">Online</span>
              </div>
            </div>

            {/* Messages — flex-1 + min-h-0 is the key to filling remaining space */}
            <div ref={chatRef} className="flex-1 min-h-0 overflow-y-auto scroll p-5 space-y-4">
              {msgs.map(m=> m.role==='user'
                ? <UserBubble key={m.id} text={m.text} />
                : <AIBubble key={m.id} text={m.text} roadmap={m.roadmap} />
              )}
              {isTyping && <TypingDots status={typingStatus} />}
              <div style={{height:4}} />
            </div>

            {/* Suggest chips */}
            <div className="px-5 pt-3 pb-2 border-t border-slate-100 flex flex-wrap gap-1.5 flex-shrink-0">
              {SUGGESTS.map((q,i)=>(
                <button key={i} onClick={()=>send(q)}
                  className="chip px-3 py-1.5 rounded-full border border-slate-200 bg-white text-[10px] font-semibold text-slate-600">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-5 pb-5 pt-2 flex-shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                <MessageSquare className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <input aria-label="Ask your AI mentor anything" 
                  className="flex-1 bg-transparent border-none outline-none text-[13px] text-slate-700 placeholder:text-slate-400"
                  placeholder="Ask your AI mentor anything…"
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') send(input); }}
                />
                <button
                  onClick={()=>send(input)}
                  disabled={!input.trim()||isTyping}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

