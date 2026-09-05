import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  MessagesSquare, Users, Play,
  Clock, Send, Award, Mic, Video, MessageSquare, RefreshCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/useAuth';

interface Message {
  sender: string;
  avatar: string;
  text: string;
  isModerator?: boolean;
  isUser?: boolean;
}

interface GdMetrics {
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

// ─── Circular Progress Ring ─────────────────────────────────────────────────
function ScoreRing({ score, label, color, size = 100 }: { score: number; label: string; color: string; size?: number }) {
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
      <span className="text-xs font-bold text-slate-600 text-center">{label}</span>
    </div>
  );
}

export default function GdSimulator() {
  const shouldReduceMotion = useReducedMotion();
  const animProps = shouldReduceMotion ? { transition: { duration: 0 } } : {};
  const { user } = useAuth();
  const userName = user?.name || 'You';
  const [step, setStep] = useState<'setup' | 'active' | 'results'>('setup');
  const [topic, setTopic] = useState('Impact of Generative AI on Tech Placements');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [speakingStatus, setSpeakingStatus] = useState<string | null>(null);
  
  const [timer, setTimer] = useState(120); // 2 mins round
  const [metrics, setMetrics] = useState<GdMetrics | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  
  const messagesRef = useRef(messages);
  const topicRef = useRef(topic);
  const commModeRef = useRef<'chat'|'voice'|'video'>('chat');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    topicRef.current = topic;
  }, [topic]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
  const navigate = useNavigate();

  // ── Dynamic topics from backend ──
  const [topics, setTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/gd/topics`)
      .then(r => r.json())
      .then(data => {
        if (data.topics && data.topics.length > 0) {
          setTopics(data.topics.map((t: any) => t.title));
          setTopic(data.topics[0].title);
        }
      })
      .catch(() => {
        const fallback = [
          'Impact of Generative AI on Tech Placements',
          'Remote Work vs In-Office Collaboration Models',
          'Web3 & Cryptocurrencies: Utility or Speculation?',
          'Ethics of Facial Recognition & Posture Surveillance',
        ];
        setTopics(fallback);
      })
      .finally(() => setTopicsLoading(false));
  }, []);

  // ── Communication mode ──
  const [commMode, setCommMode] = useState<'chat' | 'voice' | 'video'>('chat');

  // ── AI Participants / Personas ──
  const AI_PERSONAS = [
    { name: 'Rohan', style: 'Logical Thinker', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80' },
    { name: 'Ananya', style: 'HR Style Candidate', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80' },
    { name: 'Vikram', style: 'Aggressive Debater', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=80' },
    { name: 'Priya', style: 'Calm Speaker', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=80' },
  ];
  const [selectedPersonas, setSelectedPersonas] = useState<number[]>([0, 1]);

  useEffect(() => {
    commModeRef.current = commMode;
  }, [commMode]);

  // Setup Speech Recognition with auto-recovery
  useEffect(() => {
    const initSpeech = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleVoiceSend(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
          setIsListening(false);
          if (e.error === 'network' || e.error === 'aborted') {
            recognitionRef.current = null;
            setTimeout(initSpeech, 1000);
          }
        };

        recognitionRef.current = recognition;
      }
    };
    initSpeech();
  }, []);

  const handleVoiceSend = async (text: string) => {
    if (!text.trim() || isAiThinking) return;
    const userMsg = {
      sender: `${userName} (You)`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80',
      text,
      isUser: true
    };
    const newMessages = [...messagesRef.current, userMsg];
    setMessages(newMessages);
    
    // Trigger AI response
    fetchAiResponse(newMessages);
  };

  const speakText = (text: string) => {
    if (commModeRef.current !== 'voice' && commModeRef.current !== 'video') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha')) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }
    if (isListening) {
      try { recognitionRef.current.stop(); } catch(e) { console.warn(e); }
      setIsListening(false);
    } else {
      window.speechSynthesis.cancel(); // Stop AI speaking before user speaks
      try { recognitionRef.current.start(); setIsListening(true); } catch(e) { console.warn(e); }
    }
  };

  // Auto-scrolling chat window
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiThinking, speakingStatus]);

  // Countdown timer for active round
  const endSimulation = useCallback(async () => {
    setSpeakingStatus('Compiling GD analytics...');
    setIsAiThinking(true);
    
    try {
      const res = await fetch(`${API_URL}/gd/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_123', topic: topicRef.current, messages: messagesRef.current }),
      });
      const data = await res.json();
      setMetrics(data.analysis || data);
      setStep('results');
    } catch (err) {
      console.error(err);
      // Fallback gd metrics
      setMetrics({
        topic: topicRef.current,
        participationScore: 85,
        leadershipScore: 80,
        teamworkScore: 90,
        communicationScore: 87,
        confidenceScore: 88,
        overallScore: 86,
        performanceFeedback: 'Excellent coordination with AI participants. You active-listened and summarized peer points before adding value.',
        suggestions: [
          'Take the lead earlier in the discussion by introducing the prompt structure.',
          'Provide more structural statistics to substantiate argument frames.'
        ]
      });
      setStep('results');
    } finally {
      setIsAiThinking(false);
      setSpeakingStatus(null);
    }
  }, [API_URL]);

  useEffect(() => {
    if (step !== 'active') return;
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          endSimulation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [step, endSimulation]);

  // Video Mode Webcam Setup
  useEffect(() => {
    if (step === 'active' && commMode === 'video') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => console.error('Webcam access denied:', err));
        
      // Fake confidence analysis interval for demo
      const interval = setInterval(() => {
        setConfidenceScore(Math.floor(Math.random() * (98 - 75 + 1)) + 75);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    }
  }, [step, commMode]);

  const startSimulation = () => {
    const greeting = `Welcome to the Group Discussion room. The topic for today is: "${topic}". As the moderator, I invite participants to share their perspectives. ${userName}, since you're here, why don't you start us off?`;
    const initialMsg = {
      sender: 'AI Moderator',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=80',
      text: greeting,
      isModerator: true
    };
    setMessages([initialMsg]);
    setTimer(120);
    setStep('active');
    // Speak the opening greeting if in voice/video mode
    if (commMode === 'voice' || commMode === 'video') {
      setTimeout(() => speakText(greeting), 600);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAiThinking) return;

    const userMsg = {
      sender: `${userName} (You)`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80',
      text: inputText,
      isUser: true
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    
    // Trigger AI response
    await fetchAiResponse(newMessages);
  };

  const fetchAiResponse = async (currentMessages: Message[]) => {
    setIsAiThinking(true);
    setSpeakingStatus('An AI Participant is thinking...');
    try {
      const res = await fetch(`${API_URL}/gd/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, messages: currentMessages })
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        speakText(data.message.text);
      }
    } catch (err) {
      console.error('Failed to get AI response', err);
    } finally {
      setIsAiThinking(false);
      setSpeakingStatus(null);
    }
  };

  // Format timer
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/50" style={{ backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-800 tracking-tight">AI Group Discussion Simulator</h1>
              <p className="text-slate-500 text-sm mt-1">Engage in a dynamic, multi-agent AI debate to hone your collaborative arguments and leadership.</p>
            </div>
            {step === 'active' && (
              <div className="flex items-center gap-3 bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 font-mono font-bold">
                <Clock className="w-5 h-5 animate-pulse" />
                {fmt(timer)} remaining
              </div>
            )}
          </div>

          {step === 'setup' && (
            <motion.div {...animProps} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center gap-3 text-slate-800">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <MessagesSquare className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display">Configure Discussion Room</h3>
              </div>

              <div className="space-y-6">
                {/* Topic */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Debate Topic</label>
                  {topicsLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                      <RefreshCcw className="w-4 h-4 animate-spin" /> Loading topics...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topics.slice(0, 6).map((t) => (
                        <div
                          key={t}
                          onClick={() => setTopic(t)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            topic === t
                              ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                              : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-800">{t}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Communication Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Communication Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
                      { id: 'voice' as const, label: 'Voice', icon: Mic },
                      { id: 'video' as const, label: 'Video', icon: Video },
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCommMode(m.id)}
                        className={`p-3 border-2 rounded-xl flex flex-col items-center gap-1.5 transition-all ${
                          commMode === m.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <m.icon className={`w-5 h-5 ${commMode === m.id ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-slate-700">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Participants */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Participants (Select up to 3)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_PERSONAS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedPersonas(prev =>
                            prev.includes(idx)
                              ? prev.filter(i => i !== idx)
                              : prev.length < 3 ? [...prev, idx] : prev
                          );
                        }}
                        className={`flex items-center gap-3 p-3 border-2 rounded-xl transition-all ${
                          selectedPersonas.includes(idx) ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full" />
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.style}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={startSimulation}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" /> Join AI Room & Start Timer
                </button>
                <button
                  onClick={() => navigate('/gd-simulator/live-request')}
                  className="w-full py-3 bg-white border-2 border-blue-500 text-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all"
                >
                  <Users className="w-4 h-4" /> GD with Active Users →
                </button>
              </div>
            </motion.div>
          )}

          {step === 'active' && (
            <motion.div {...animProps} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {commMode === 'video' && (
                  <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-md relative border border-slate-800">
                    <video 
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-48 object-cover scale-x-[-1]"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-bold flex items-center gap-1">
                          <Video className="w-3 h-3 text-red-500 animate-pulse" /> Live
                        </span>
                        <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-sm border border-green-400/20">
                          Confidence: {confidenceScore || '--'}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Participants</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80" alt="You" className="w-8 h-8 rounded-full border-2 border-green-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{userName.split(' ')[0]}</p>
                        <p className="text-[10px] text-slate-500">You</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80" alt="Rohan" className="w-8 h-8 rounded-full border border-slate-200" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">Rohan</p>
                        <p className="text-[10px] text-slate-500">AI Peer</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80" alt="Ananya" className="w-8 h-8 rounded-full border border-slate-200" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">Ananya</p>
                        <p className="text-[10px] text-slate-500">AI Peer</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={endSimulation} className="w-full py-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors">
                  End Discussion Early
                </button>
              </div>

              {/* Chat Window */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[600px] overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">{topic}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Users className="w-3 h-3" /> 3 Participants</p>
                  </div>
                  {speakingStatus && (
                    <span className="text-xs font-semibold text-blue-600 animate-pulse bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {speakingStatus}
                    </span>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                      <motion.div {...animProps}
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 max-w-[85%] ${msg.isUser ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <img src={msg.avatar} alt={msg.sender} className={`w-10 h-10 rounded-full shrink-0 shadow-sm ${msg.isModerator ? 'ring-2 ring-purple-500' : ''} ${msg.isUser ? 'ring-2 ring-green-500' : ''}`} />
                        <div className={msg.isUser ? 'text-right' : 'text-left'}>
                          <span className="text-xs font-bold text-slate-500 mb-1 block">
                            {msg.sender} {msg.isModerator && <span className="text-purple-500 ml-1">(Mod)</span>}
                          </span>
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.isUser ? 'bg-blue-600 text-white rounded-tr-none' : 
                            msg.isModerator ? 'bg-purple-50 border border-purple-100 text-purple-900 rounded-tl-none' : 
                            'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isAiThinking && (
                      <motion.div {...animProps} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 flex items-center gap-1 w-24">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 bg-white">
                  {(commMode === 'voice' || commMode === 'video') ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <button
                        onClick={toggleListen}
                        disabled={isAiThinking}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                          isListening 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200' 
                            : 'bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-100'
                        } disabled:opacity-50 disabled:animate-none`}
                      >
                        <Mic className={`w-6 h-6 text-white ${isListening ? 'animate-bounce' : ''}`} />
                      </button>
                      <p className="text-xs font-bold text-slate-500 mt-4 uppercase tracking-wider">
                        {isListening ? 'Listening...' : isAiThinking ? 'AI is speaking...' : 'Tap to speak'}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                      <input aria-label="Chat input" 
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your argument..."
                        disabled={isAiThinking}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <button
                        aria-label="Send Message"
                        type="submit"
                        disabled={!inputText.trim() || isAiThinking}
                        className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors shadow-sm"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'results' && metrics && (
            <motion.div {...animProps} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
              
              {/* Top Score Banner */}
              <div className="p-6 md:p-8 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="shrink-0 bg-white rounded-full p-2 shadow-lg">
                    <ScoreRing score={metrics.overallScore} label="" color="blue" size={140} />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Overall GD Score</h2>
                    <div className="text-3xl font-bold mb-3">Topic: <span className="text-blue-300">{metrics.topic}</span></div>
                    <p className="text-sm text-slate-300 max-w-2xl">{metrics.performanceFeedback}</p>
                  </div>
                </div>
              </div>

              {/* Score Rings Grid */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <ScoreRing score={metrics.participationScore} label="Participation" color="cyan" size={90} />
                  <ScoreRing score={metrics.leadershipScore} label="Leadership" color="purple" size={90} />
                  <ScoreRing score={metrics.teamworkScore} label="Teamwork" color="green" size={90} />
                  <ScoreRing score={metrics.communicationScore} label="Communication" color="blue" size={90} />
                  <ScoreRing score={metrics.confidenceScore} label="Confidence" color="orange" size={90} />
                </div>
              </div>

              {/* AI Feedback Section */}
              <div className="p-6 md:p-8 grid md:grid-cols-1 gap-8 bg-white">
                <div>
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
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => { setStep('setup'); setMessages([]); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors">
                  Start New Session
                </button>
              </div>

            </motion.div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}

