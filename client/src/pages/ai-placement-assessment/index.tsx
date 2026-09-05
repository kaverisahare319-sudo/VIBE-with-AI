import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import { 
  Sparkles, Code2, Briefcase, Users, MonitorSmartphone, Target,
  Zap, Clock, Video, Mic, MessageSquare, Play, StopCircle, CheckCircle2, ChevronRight, Activity, ArrowRight, Award, Brain
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

type InterviewType = 'Technical' | 'HR' | 'Behavioral' | 'System Design' | 'Aptitude+HR' | 'Company Specific' | 'Custom';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type Duration = 10 | 20 | 30 | 45 | 60;
type CommunicationMode = 'Video' | 'Voice' | 'Chat';

// --- Circular Score Ring Component ---
function ScoreRing({ score, label, color, size = 100 }: { score: number; label: string; color: string; size?: number }) {
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
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="8" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={c.stroke} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-black ${size >= 140 ? 'text-4xl' : 'text-xl'} text-slate-800`}>{score}</span>
          {size < 140 && <span className={`text-[9px] font-bold ${c.text} uppercase tracking-wide`}>/ 100</span>}
        </div>
      </div>
      <span className="text-xs font-bold text-slate-600 text-center uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function AIPlacementAssessment() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'setup' | 'active' | 'results'>('setup');
  
  // Setup State
  const [selectedType, setSelectedType] = useState<InterviewType>('Technical');
  const [companyName, setCompanyName] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [duration, setDuration] = useState<Duration>(20);
  const [mode, setMode] = useState<CommunicationMode>('Video');
  const [jobRole, setJobRole] = useState('Software Engineer');

  // Active Interview State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{sender: string; text: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [evaluation, setEvaluation] = useState<any>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [showSendButton, setShowSendButton] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const initSpeech = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          
          if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            if (currentTranscript.trim()) {
              setShowSendButton(true);
            }
          }, 2000);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          // Auto-restart on network or aborted errors if the user was holding the button
          if (event.error === 'network' || event.error === 'aborted') {
            recognitionRef.current = null;
            setTimeout(initSpeech, 1000);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          // If stopped by timeout, transcript is already handled.
        };

        recognitionRef.current = recognition;
      }
    };
    initSpeech();
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha')) || voices[0];
      if (preferred) utterance.voice = preferred;
      utterance.rate = 1.05;
      
      utterance.onend = () => {
        setIsAiSpeaking(false);
        handleStartListening();
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartListening = () => {
    if (!recognitionRef.current) return;
    if (!isAiThinking && !isAiSpeaking) {
      window.speechSynthesis.cancel(); // Stop AI speaking when user starts talking
      setTranscript('');
      setShowSendButton(false);
      setIsListening(true);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech recognition start issue:", e);
      }
    }
  };

  const handleStopListening = () => {
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Speech recognition stop issue:", e);
      }
      setIsListening(false);
      
      if (transcript.trim()) {
        setShowSendButton(true);
      }
    }
  };

  const interviewTypes: { label: InterviewType; icon: any; desc: string }[] = [
    { label: 'Technical', icon: Code2, desc: 'Core subjects, DSA, algorithms' },
    { label: 'HR', icon: Users, desc: 'Culture fit, background, goals' },
    { label: 'Behavioral', icon: Target, desc: 'STAR method, situational' },
    { label: 'System Design', icon: MonitorSmartphone, desc: 'Scalability, architecture' },
    { label: 'Aptitude+HR', icon: Zap, desc: 'Mixed cognitive & personal' },
    { label: 'Company Specific', icon: Briefcase, desc: 'Tailored to a specific employer' },
    { label: 'Custom', icon: Sparkles, desc: 'Provide your own focus area' },
  ];

  const handleStartInterview = async () => {
    setStatus('active');
    setTimeLeft(duration * 60);
    const initialText = `Hello! Welcome to your ${difficulty} ${selectedType} Interview. Could you start by telling me a little bit about yourself?`;
    setMessages([{ sender: 'AI', text: initialText }]);
    
    // Slight delay to ensure UI has rendered before speaking
    setTimeout(() => speakText(initialText), 500);

    if (mode === 'Video' || mode === 'Voice') {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: mode === 'Video', 
          audio: true 
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error('Media access error:', err);
        alert('Please allow camera and microphone access to continue.');
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const textToSend = directText || inputText || transcript;
    if (!textToSend.trim()) return;
    
    const userMsg = { sender: 'You', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setTranscript('');
    setShowSendButton(false);
    setIsAiThinking(true);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5005/api/ai-placement/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: selectedType,
          difficulty,
          companyName,
          customTopic,
          jobRole,
          history: [...messages, userMsg]
        })
      });
      const data = await response.json();
      if (data.isComplete) {
        const endMessage = "Thank you for your time. That concludes our interview. I am now generating your comprehensive evaluation report.";
        setMessages(prev => [...prev, { sender: 'AI', text: endMessage }]);
        
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(endMessage);
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha')) || voices[0];
          if (preferred) utterance.voice = preferred;
          utterance.rate = 1.05;
          utterance.onend = () => {
            handleEndInterview();
          };
          window.speechSynthesis.speak(utterance);
        } else {
          handleEndInterview();
        }
      } else if (data.question) {
        setMessages(prev => [...prev, { sender: 'AI', text: data.question }]);
        speakText(data.question);
      }
    } catch (error) {
      console.error('Failed to get AI response', error);
      const errorMsg = "I'm having trouble connecting. Could you please repeat that?";
      setMessages(prev => [...prev, { sender: 'AI', text: errorMsg }]);
      speakText(errorMsg);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleEndInterview = async () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setStatus('results');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5005/api/ai-placement/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          transcript: messages,
          type: selectedType,
          difficulty,
          jobRole
        })
      });
      const data = await response.json();
      setEvaluation(data);
      
      if (token) {
        await fetch('http://localhost:5005/api/ai-placement/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: selectedType,
            difficulty,
            duration,
            mode,
            companyName,
            customTopic,
            scores: data.scores,
            feedback: data.feedback,
            transcript: messages,
            hiringProbability: data.hiringProbability
          })
        });
      }
    } catch (e) {
      console.error('Failed to evaluate', e);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (status === 'active' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(l => l - 1), 1000);
      return () => clearInterval(timer);
    } else if (status === 'active' && timeLeft === 0) {
      handleEndInterview();
    }
  }, [status, timeLeft]);

  const generateReportPDF = () => {
    if (!evaluation) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const marginL = 18;
    const marginR = pageW - 18;
    let y = 0;

    const addPage = () => { doc.addPage(); y = 20; };
    const checkY = (needed: number) => { if (y + needed > 270) addPage(); };

    // ── HEADER BANNER ──────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 52, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Interview Evaluation Report', marginL, 22);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${selectedType} Interview  •  ${difficulty} Level  •  ${jobRole || 'Software Engineer'}  •  ${mode} Mode`, marginL, 33);
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginL, 42);
    y = 62;

    // ── OVERALL SCORE ROW ────────────────────────────────────────────
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(marginL, y, pageW - 36, 28, 4, 4, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Overall Employability: ${evaluation.scores?.overall || 0}/100`, marginL + 6, y + 11);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const hp = evaluation.hiringProbability || 0;
    const hpColor: [number,number,number] = hp >= 70 ? [22,163,74] : hp >= 50 ? [234,179,8] : [239,68,68];
    doc.setTextColor(...hpColor);
    doc.text(`Hiring Probability: ${hp}%  |  Recommendation: ${evaluation.feedback?.hiringRecommendation || 'Borderline'}`, marginL + 6, y + 22);
    y += 38;

    // ── SCORE BREAKDOWN ────────────────────────────────────────────
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Score Breakdown', marginL, y);
    y += 8;

    const scoreItems = [
      { label: 'Technical Knowledge',  val: evaluation.scores?.technical    || 0, weight: '30%' },
      { label: 'Communication',        val: evaluation.scores?.communication|| 0, weight: '20%' },
      { label: 'Problem Solving',      val: evaluation.scores?.problemSolving||0, weight: '20%' },
      { label: 'Confidence',           val: evaluation.scores?.confidence   || 0, weight: '10%' },
      { label: 'Body Language',        val: evaluation.scores?.bodyLanguage || 0, weight: '5%'  },
      { label: 'Facial Expression',    val: evaluation.scores?.facialExpression||0,weight: '5%' },
      { label: 'Professionalism',      val: evaluation.scores?.professionalism||0,weight: '5%' },
      { label: 'Voice Quality',        val: evaluation.scores?.voice        || 0, weight: '5%'  },
    ];

    scoreItems.forEach(item => {
      checkY(12);
      const barW = pageW - 36;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(marginL, y, barW, 9, 2, 2, 'F');
      const fillColor: [number,number,number] = item.val >= 75 ? [34,197,94] : item.val >= 50 ? [234,179,8] : [239,68,68];
      doc.setFillColor(...fillColor);
      doc.roundedRect(marginL, y, (barW * item.val) / 100, 9, 2, 2, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label} (${item.weight})`, marginL + 3, y + 6.5);
      doc.text(`${item.val}/100`, marginR - 14, y + 6.5);
      y += 13;
    });
    y += 6;

    // ── SPEAKING STATISTICS ────────────────────────────────────────
    const stats = evaluation.feedback?.speakingStats;
    if (stats) {
      checkY(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Speaking Statistics', marginL, y); y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const statLines = [
        `Total Words Spoken: ${stats.totalWords}`,
        `Avg Words per Answer: ${stats.avgWordsPerAnswer}`,
        `Filler Words Detected: ${stats.fillerWordsDetected} (um, uh, like, you know...)`,
        `Total Questions Answered: ${stats.answerCount}`,
      ];
      statLines.forEach(line => {
        checkY(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`• ${line}`, marginL + 4, y); y += 8;
      });
      y += 4;
    }

    // ── DETAILED ANALYSIS ─────────────────────────────────────────
    if (evaluation.feedback?.detailedAnalysis) {
      checkY(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('AI Detailed Analysis', marginL, y); y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const wrapped = doc.splitTextToSize(evaluation.feedback.detailedAnalysis, pageW - 40);
      wrapped.forEach((line: string) => { checkY(7); doc.text(line, marginL + 2, y); y += 7; });
      y += 6;
    }

    // ── PER-QUESTION RATINGS ───────────────────────────────────────
    const pqr = evaluation.feedback?.perQuestionRating;
    if (pqr && pqr.length > 0) {
      checkY(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Per-Question Performance', marginL, y); y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      pqr.forEach((rating: string, i: number) => {
        checkY(8);
        const rColor: [number,number,number] =
          rating === 'Excellent' ? [22,163,74] :
          rating === 'Good' ? [59,130,246] :
          rating === 'Average' ? [234,179,8] :
          rating === 'Poor' ? [249,115,22] : [239,68,68];
        doc.setTextColor(...rColor);
        const qMsgs = messages.filter(m => m.sender === 'AI');
        const qText = qMsgs[i] ? doc.splitTextToSize(`Q${i+1}: ${qMsgs[i].text}`, pageW - 80)[0] : `Q${i+1}`;
        doc.setTextColor(71, 85, 105);
        doc.text(`${qText}`, marginL + 4, y);
        doc.setTextColor(...rColor);
        doc.text(`[${rating}]`, marginR - 24, y);
        y += 8;
      });
      y += 4;
    }

    // ── STRENGTHS ─────────────────────────────────────────────────
    checkY(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(22, 163, 74);
    doc.text('▸ Top Strengths', marginL, y); y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    (evaluation.feedback?.strengths || []).forEach((s: string) => {
      checkY(8);
      const lines = doc.splitTextToSize(`• ${s}`, pageW - 44);
      lines.forEach((l: string) => { doc.setTextColor(22, 163, 74); doc.text(l, marginL + 4, y); y += 7; });
    });
    y += 6;

    // ── IMPROVEMENTS ──────────────────────────────────────────────
    checkY(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(239, 68, 68);
    doc.text('▸ Areas for Improvement', marginL, y); y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    (evaluation.feedback?.improvements || []).forEach((s: string) => {
      checkY(8);
      const lines = doc.splitTextToSize(`• ${s}`, pageW - 44);
      lines.forEach((l: string) => { doc.setTextColor(239, 68, 68); doc.text(l, marginL + 4, y); y += 7; });
    });
    y += 6;

    // ── TRANSCRIPT ────────────────────────────────────────────────
    checkY(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('Full Interview Transcript', marginL, y); y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    messages.forEach((m, i) => {
      checkY(10);
      const label = m.sender === 'AI' ? 'AI Interviewer' : 'You';
      const labelColor: [number,number,number] = m.sender === 'AI' ? [109,40,217] : [15,23,42];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...labelColor);
      doc.text(`${label}:`, marginL + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const textLines = doc.splitTextToSize(m.text, pageW - 44);
      textLines.forEach((l: string, li: number) => {
        if (li === 0) doc.text(l, marginL + 28, y);
        else { y += 6; checkY(6); doc.text(l, marginL + 28, y); }
      });
      y += 9;
    });

    // ── FOOTER ────────────────────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`MockMate AI  •  Page ${p} of ${totalPages}  •  Confidential`, marginL, 287);
    }

    const fileName = `MockMate_${selectedType}_${difficulty}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F6FF 30%, #EEF4FF 70%, #FFFFFF 100%)' }}
          className="rounded-[28px] p-8 md:p-16 min-h-[480px] shadow-[0_20px_60px_rgba(99,102,241,0.12)] hover:shadow-[0_30px_70px_rgba(99,102,241,0.2)] border border-white/60 relative overflow-hidden flex flex-col md:flex-row items-center justify-between group hover:-translate-y-2 transition-all duration-500 backdrop-blur-[20px]"
        >
          {/* Blurred Glowing Glow Circles (Pink, Blue, Purple) */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#EC4899]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#4F8CFF]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Background Grid Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />

          {/* Left Content */}
          <div className="relative z-10 w-full md:w-3/5 md:pr-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-[#7C3AED]/10 border border-[#7C3AED]/20 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#7C3AED] animate-pulse" />
              <span className="text-xs font-semibold text-[#6D28D9] tracking-wide uppercase">Unified AI Engine</span>
            </motion.div>
            
            <h1 className="text-[40px] md:text-[56px] font-extrabold mb-4 tracking-[-1px]">
              <span className="text-[#0F172A]">AI Placement </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] via-[#4F46E5] to-[#2563EB]">Assessment</span>
            </h1>
            
            <p className="text-[#475569] text-[18px] md:text-[22px] leading-[1.7] max-w-[650px]">
              Experience a hyper-realistic, real-time interview simulator. The AI simultaneously analyzes your communication skills, technical responses, confidence, facial expressions, and body language to generate a complete hiring readiness report.
            </p>
          </div>

          {/* Right AI Illustration */}
          <div className="relative z-10 w-full md:w-2/5 mt-10 md:mt-0 flex justify-center items-center h-64 md:h-auto">
            <div className="relative w-56 h-56 md:w-72 md:h-72 flex justify-center items-center">
              {/* Concentric Circles */}
              <div className="absolute inset-0 bg-[#7C3AED]/5 rounded-full border border-[#7C3AED]/10" />
              <div className="absolute inset-4 bg-[#4F8CFF]/5 rounded-full border border-[#4F8CFF]/10" />
              <div className="absolute inset-8 bg-[#EC4899]/5 rounded-full border border-[#EC4899]/10" />
              <div className="absolute inset-12 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-2xl" />
              
              {/* Glowing effects */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#7C3AED]/10 blur-3xl rounded-full" />
              
              {/* Floating elements */}
              {[...Array(8)].map((_, i) => {
                 const colors = ['bg-[#7C3AED]', 'bg-[#4F8CFF]', 'bg-[#EC4899]'];
                 const color = colors[i % 3];
                 return (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, -8, 0],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{ 
                      duration: 8 + (i % 5), 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: i * 0.5 
                    }}
                    className={`absolute rounded-full ${color} shadow-[0_0_8px_currentColor]`}
                    style={{
                      width: i % 2 === 0 ? '6px' : '4px',
                      height: i % 2 === 0 ? '6px' : '4px',
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`
                    }}
                  />
                 );
              })}

              {/* Brain icon */}
              <motion.div 
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-20 w-24 h-24 bg-gradient-to-br from-[#7C3AED] to-[#2563EB] rounded-2xl flex items-center justify-center shadow-lg shadow-[#7C3AED]/30 transform rotate-3"
              >
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* --- SETUP WIZARD --- */}
        {status === 'setup' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10">
            
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-12 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full" />
              <div className="absolute top-1/2 left-0 h-1 bg-purple-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }} />
              
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                  step >= s ? 'bg-purple-600 text-white ring-4 ring-purple-100' : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              
              {/* STEP 1: Type */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">What type of interview do you want to practice?</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {interviewTypes.map(t => (
                      <button key={t.label} onClick={() => setSelectedType(t.label)} className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        selectedType === t.label ? 'border-purple-600 bg-purple-50 ring-4 ring-purple-50' : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                      }`}>
                        <t.icon className={`w-6 h-6 mb-3 ${selectedType === t.label ? 'text-purple-600' : 'text-slate-400'}`} />
                        <h3 className={`font-bold ${selectedType === t.label ? 'text-purple-900' : 'text-slate-700'}`}>{t.label}</h3>
                        <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                  
                  {selectedType === 'Company Specific' && (
                    <div className="mt-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Target Company Name</label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Google, Amazon, TCS..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  )}
                  {selectedType === 'Custom' && (
                    <div className="mt-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Custom Interview Focus</label>
                      <input type="text" value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="e.g. React Native and GraphQL Senior Role" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  )}
                  {(selectedType === 'Technical' || selectedType === 'System Design' || selectedType === 'Company Specific') && (
                    <div className="mt-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Job Role / Target Position</label>
                      <select value={jobRole} onChange={e => setJobRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option>Software Engineer</option>
                        <option>Frontend Developer</option>
                        <option>Backend Developer</option>
                        <option>Full Stack Developer</option>
                        <option>Java Developer</option>
                        <option>Python Developer</option>
                        <option>Data Scientist</option>
                        <option>DevOps Engineer</option>
                      </select>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: Difficulty */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Select Difficulty Level</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {['Beginner', 'Intermediate', 'Advanced'].map(d => (
                      <button key={d} onClick={() => setDifficulty(d as Difficulty)} className={`p-6 rounded-2xl border-2 text-center transition-all ${
                        difficulty === d ? 'border-purple-600 bg-purple-50 ring-4 ring-purple-50' : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                      }`}>
                        <h3 className={`font-bold text-lg ${difficulty === d ? 'text-purple-900' : 'text-slate-700'}`}>{d}</h3>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Duration */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">How long do you want the interview to be?</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[10, 20, 30, 45, 60].map(d => (
                      <button key={d} onClick={() => setDuration(d as Duration)} className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        duration === d ? 'border-purple-600 bg-purple-50 ring-4 ring-purple-50' : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                      }`}>
                        <Clock className={`w-5 h-5 mx-auto mb-2 ${duration === d ? 'text-purple-600' : 'text-slate-400'}`} />
                        <h3 className={`font-bold ${duration === d ? 'text-purple-900' : 'text-slate-700'}`}>{d} Min</h3>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Mode */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Select Communication Mode</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <button onClick={() => setMode('Video')} className={`relative p-6 rounded-2xl border-2 text-center transition-all ${
                      mode === 'Video' ? 'border-purple-600 bg-purple-50 ring-4 ring-purple-50' : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                    }`}>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recommended</div>
                      <Video className={`w-8 h-8 mx-auto mb-3 ${mode === 'Video' ? 'text-purple-600' : 'text-slate-400'}`} />
                      <h3 className={`font-bold mb-1 ${mode === 'Video' ? 'text-purple-900' : 'text-slate-700'}`}>Video Interview</h3>
                      <p className="text-xs text-slate-500">Camera + Voice + Body Language Analysis</p>
                    </button>
                    <button onClick={() => setMode('Voice')} className={`p-6 rounded-2xl border-2 text-center transition-all ${
                      mode === 'Voice' ? 'border-purple-600 bg-purple-50 ring-4 ring-purple-50' : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                    }`}>
                      <Mic className={`w-8 h-8 mx-auto mb-3 ${mode === 'Voice' ? 'text-purple-600' : 'text-slate-400'}`} />
                      <h3 className={`font-bold mb-1 ${mode === 'Voice' ? 'text-purple-900' : 'text-slate-700'}`}>Voice Interview</h3>
                      <p className="text-xs text-slate-500">Microphone + Tone Analysis</p>
                    </button>
                    <button onClick={() => setMode('Chat')} className={`p-6 rounded-2xl border-2 text-center transition-all ${
                      mode === 'Chat' ? 'border-purple-600 bg-purple-50 ring-4 ring-purple-50' : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                    }`}>
                      <MessageSquare className={`w-8 h-8 mx-auto mb-3 ${mode === 'Chat' ? 'text-purple-600' : 'text-slate-400'}`} />
                      <h3 className={`font-bold mb-1 ${mode === 'Chat' ? 'text-purple-900' : 'text-slate-700'}`}>Chat Interview</h3>
                      <p className="text-xs text-slate-500">Text-based logical analysis</p>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-6">
              <button 
                onClick={() => setStep(s => Math.max(1, s - 1))} 
                disabled={step === 1}
                className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl disabled:opacity-0 transition-all"
              >
                Back
              </button>
              
              {step < 4 ? (
                <button 
                  onClick={() => setStep(s => s + 1)}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleStartInterview}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-200 transition-all animate-pulse"
                >
                  <Play className="w-4 h-4 fill-current" /> Start AI Interview
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- ACTIVE INTERVIEW --- */}
        {status === 'active' && (
          <div className="grid lg:grid-cols-4 gap-6">
            
            {/* Sidebar Tools & Stats */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" /> Live Analysis Active
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Time Remaining</p>
                    <p className="text-2xl font-mono font-bold text-slate-800">
                      {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5 text-blue-500" /> Voice Processing</span>
                      <span className="text-blue-600 flex items-center gap-1">On <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /></span>
                    </div>
                    {mode === 'Video' && (
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-purple-500" /> Body Language</span>
                        <span className="text-purple-600 flex items-center gap-1">Tracking <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {mode === 'Video' && (
                <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 relative h-48">
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> REC
                  </div>
                </div>
              )}

              <button onClick={handleEndInterview} className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                <StopCircle className="w-4 h-4" /> End Interview Early
              </button>
            </div>

            {/* Main Chat / Interviewer Panel */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800">{selectedType} Interview</h2>
                  <p className="text-xs text-slate-500 capitalize">{difficulty} Level • {mode} Mode</p>
                </div>
                {isAiThinking && (
                  <span className="text-xs font-semibold text-purple-600 animate-pulse bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                    AI is analyzing...
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 max-w-[85%] ${m.sender === 'You' ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.sender === 'AI' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                        {m.sender === 'AI' ? <Sparkles className="w-5 h-5" /> : <div className="font-bold text-sm">You</div>}
                      </div>
                      <div className={m.sender === 'You' ? 'text-right' : 'text-left'}>
                        <span className="text-xs font-bold text-slate-500 mb-1 block">{m.sender === 'AI' ? `AI ${selectedType} Interviewer` : 'You'}</span>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.sender === 'You' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                          {m.text}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isAiThinking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5 w-24">
                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75" />
                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-slate-100 bg-white">
                {(mode === 'Voice' || mode === 'Video') && (
                    <div className="flex flex-col items-center justify-center py-4 relative mb-2">
                      <div className="min-h-[84px] w-full flex items-center justify-center">
                        {transcript && (
                          <div className="w-full mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 italic text-center min-h-[60px] flex flex-col items-center justify-center">
                            <span>"{transcript}"</span>
                            {!showSendButton ? (
                              <span className="w-1.5 h-4 bg-purple-500 mt-2 animate-pulse" />
                            ) : (
                              <div className="mt-4 flex flex-col items-center gap-3">
                                <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Speech Captured</span>
                                <button onClick={() => handleSendMessage()} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-md transition-all">Send</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {!showSendButton && (
                        <>
                          <button 
                            onClick={() => {
                              if (isListening) handleStopListening();
                              else handleStartListening();
                            }}
                            disabled={isAiThinking || isAiSpeaking}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg text-white group disabled:opacity-50 ${isListening ? 'bg-rose-500 ring-8 ring-rose-100 scale-110' : 'bg-slate-900 hover:bg-slate-800 ring-4 ring-slate-100'}`}
                          >
                            <Mic className={`w-6 h-6 transition-transform ${isListening ? 'animate-pulse' : 'group-hover:scale-110'}`} />
                          </button>
                          <p className={`text-xs font-bold mt-4 uppercase tracking-wider ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
                            {isListening ? 'Listening (Click to Stop)...' : isAiSpeaking ? 'AI is speaking...' : 'Click to Speak (or type below)'}
                          </p>
                        </>
                      )}
                    </div>
                 )}
                 
                 <form onSubmit={handleSendMessage} className="flex gap-3 relative z-10">
                   <input 
                     type="text" 
                     value={inputText}
                     onChange={e => setInputText(e.target.value)}
                     placeholder={mode === 'Chat' ? "Type your answer..." : "Type your answer manually as a fallback..."}
                     disabled={isAiThinking || isListening || isAiSpeaking}
                     className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                   />
                   <button type="submit" disabled={!inputText.trim() || isAiThinking || isListening || isAiSpeaking} className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all disabled:opacity-50">
                     Send
                   </button>
                 </form>
              </div>
            </div>
          </div>
        )}

        {/* --- RESULTS REPORT --- */}
        {status === 'results' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
            
            {/* Header Banner */}
            <div className="bg-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                {!evaluation ? (
                  <div className="flex flex-col items-center justify-center w-full py-12 md:flex-row gap-6">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-purple-500 animate-spin shrink-0" />
                    <div>
                      <h2 className="text-2xl font-bold">AI is analyzing your interview...</h2>
                      <p className="text-slate-400">Please wait while we generate your comprehensive report.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <div className="bg-white rounded-full p-2 shadow-2xl">
                        <ScoreRing score={evaluation.scores?.overall || 0} label="" color="green" size={160} />
                      </div>
                      <span className="text-xs font-bold text-white/80 uppercase tracking-widest text-center">Overall Employability</span>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold mb-3">
                        <Award className="w-3.5 h-3.5" /> High Hiring Probability ({evaluation.hiringProbability || 0}%)
                      </div>
                      <h2 className="text-3xl font-black mb-2">Interview Completed</h2>
                      <p className="text-slate-300 max-w-2xl text-sm leading-relaxed mb-4">
                        {evaluation.feedback?.detailedAnalysis || "Great job! You demonstrated strong technical knowledge."}
                      </p>
                      <button onClick={generateReportPDF} className="px-5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-bold shadow-md transition-colors">
                         Download Full PDF Report
                       </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Granular Scores Grid */}
            {evaluation && (
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 text-center">Comprehensive Analysis Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-items-center">
                  <ScoreRing score={evaluation.scores?.technical || 0} label="Technical" color="blue" size={90} />
                  <ScoreRing score={evaluation.scores?.communication || 0} label="Communication" color="purple" size={90} />
                  <ScoreRing score={evaluation.scores?.confidence || 0} label="Confidence" color="orange" size={90} />
                  {mode === 'Video' && <ScoreRing score={evaluation.scores?.confidence || 0} label="Body Language" color="rose" size={90} />}
                  <ScoreRing score={evaluation.scores?.problemSolving || 0} label="Problem Solving" color="cyan" size={90} />
                  <ScoreRing score={evaluation.scores?.professionalism || 0} label="Professionalism" color="green" size={90} />
                </div>
              </div>
            )}

            {/* Detailed Feedback */}
            {evaluation && (
              <div className="p-8 grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Top Strengths
                  </h4>
                  <ul className="space-y-3">
                    {(evaluation.feedback?.strengths || []).map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                        <span className="text-emerald-500 mt-0.5">▸</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Areas for Improvement
                  </h4>
                  <ul className="space-y-3">
                    {(evaluation.feedback?.improvements || []).map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                        <span className="text-rose-500 mt-0.5">▸</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => { setStatus('setup'); setStep(1); }} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                Take Another Assessment
              </button>
              <button onClick={generateReportPDF} className="px-6 py-3 bg-green-500 text-white rounded-xl text-sm font-bold shadow-md hover:bg-green-600 transition-colors flex items-center gap-2">
                Download Report <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
}
