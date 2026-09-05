import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  FileText,
  GitBranch,
  Code2,
  Mic,
  Video,
  MessagesSquare,
  BrainCircuit,
  Play,
  Users,
  Building,
  Target,
  CheckCircle2
} from 'lucide-react';
import '../../styles/grid-background.css';

export default function LandingPage() {
  const modules = [
    { title: 'Resume Analyzer', desc: 'Scan and match resumes against target roles with instant ATS scoring indices.', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Career Roadmap', desc: 'Visual step-by-step progress nodes customized for roles from Frontend to ML.', icon: GitBranch, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Coding Assessment', desc: 'Syntax-highlighted compiler practice, algorithm evaluation, and complexity reports.', icon: Code2, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'Communication Analysis', desc: 'Audio recording transcription with vocal stability and pitch rate scores.', icon: Mic, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Body Language Diagnostics', desc: 'Real-time webcam posture tracking, eye-gaze contact points, and emotions.', icon: Video, color: 'text-pink-600', bg: 'bg-pink-50' },
    { title: 'AI Mock Interview', desc: 'Technical & behavioral panel rounds mimicking companies like TCS, Accenture.', icon: BrainCircuit, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'AI GD Simulator', desc: 'Multi-party virtual discussion rooms containing adaptive AI peer participants.', icon: MessagesSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Placement Predictor', desc: 'Aggregate scorecard outlining recruitment compatibility metrics.', icon: Target, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const stats = [
    { value: '10,000+', label: 'Students Prepped', icon: Users },
    { value: '500+', label: 'Hiring Partners', icon: Building },
    { value: '95%', label: 'Placement Rate', icon: Target },
    { value: '50,000+', label: 'Tests Administered', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-white grid-bg flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col items-center text-center">
        {/* Glow Element */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-blue-400 to-purple-400 opacity-20 blur-3xl rounded-full -z-10 pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-purple-200 bg-purple-50/50 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-800 tracking-wide uppercase">New: Version 1.0 Released</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 font-display max-w-4xl leading-tight">
          AI-Powered Interview <br className="hidden sm:block" /> Readiness & <br className="hidden sm:block" />
          <span className="text-gradient bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Placement Preparation</span>
</h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-3xl leading-relaxed">
          Master interviews with AI-driven assessments, personalized feedback, coding practice, communication analysis, and placement readiness prediction.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link
            to="/auth/register"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center"
          >
            Start Free Assessment
          </Link>
          <a
            href="#demo"
            className="px-8 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Watch Demo
          </a>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-6 mb-6">
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">MockMate Dashboard</span>
              <h3 className="text-xl font-bold text-slate-800">Placement Assessment Preview</h3>
            </div>
            <span className="mt-2 md:mt-0 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold border border-green-200 rounded-full">
              System Active
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="glass-card p-4 rounded-xl text-center">
              <span className="text-xs text-slate-500 font-medium">Placement Readiness</span>
              <p className="text-3xl font-extrabold text-blue-600 mt-2">87%</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '87%' }} />
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl text-center">
              <span className="text-xs text-slate-500 font-medium">ATS Score</span>
              <p className="text-3xl font-extrabold text-purple-600 mt-2">82/100</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: '82%' }} />
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl text-center">
              <span className="text-xs text-slate-500 font-medium">Coding Score</span>
              <p className="text-3xl font-extrabold text-cyan-600 mt-2">89%</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '89%' }} />
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl text-center">
              <span className="text-xs text-slate-500 font-medium">Communication</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-2">91%</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '91%' }} />
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl text-center col-span-2 lg:col-span-1">
              <span className="text-xs text-slate-500 font-medium">Interview Skill</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">85%</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="border-y border-slate-200/80 bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center space-x-4 justify-center lg:justify-start">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">{stat.value}</p>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Modules Showcase */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
            A Complete Suite of Career Diagnostic Modules
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            Everything you need in a single dashboard to evaluate competency levels and highlight placement bottlenecks.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((m, i) => (
            <div key={i} className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col h-full text-left">
              <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center ${m.color} mb-5 shadow-sm border border-slate-200/20`}>
                <m.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{m.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 border-t border-slate-200/60 bg-slate-50/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              How MockMate.AI Prepares You
            </h2>
            <p className="mt-4 text-slate-500 text-lg">
              A structured roadmap built to identify weaknesses, refine skills, and build confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6 max-w-5xl mx-auto relative">
            <div className="glass-card p-5 rounded-2xl text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mx-auto mb-4">1</div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Create Account</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Register with details and specify target corporate roles.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold mx-auto mb-4">2</div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Upload Resume</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Scans file for syntax matching and core ATS keywords.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold mx-auto mb-4">3</div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Take Assessments</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Practice mock panels, speech logs, and algorithmic challenges.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mx-auto mb-4">4</div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Get AI Feedback</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Review detailed reports outlining concrete improvement areas.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl text-center relative z-10">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mx-auto mb-4">5</div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Placement Ready</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Attain top-tier metrics to boost recruitment confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t border-slate-200/60 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
            Success Stories From Our Students
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            Read how other graduates optimized their skill maps and passed competitive corporate panels.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card p-6 rounded-2xl text-left">
            <p className="text-slate-500 text-sm italic leading-relaxed">
              "The Resume Scanner highlighted key database concepts I omitted, and the AI Mock Interviews simulated real Accenture-level behavioral parameters perfectly. Landed a full-time role within weeks!"
            </p>
            <div className="flex items-center space-x-3 mt-6">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80" alt="Student avatar" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-slate-800">Shreya Jaiswal</p>
                <p className="text-xs text-slate-400">Placed at Accenture</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl text-left">
            <p className="text-slate-500 text-sm italic leading-relaxed">
              "Working with the Coding Assessment compiler and receiving immediate space/time complexity reviews completely changed my interview approach. Incredibly helpful dashboard graphs."
            </p>
            <div className="flex items-center space-x-3 mt-6">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80" alt="Student avatar" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-slate-800">Rahul Verma</p>
                <p className="text-xs text-slate-400">Placed at Capgemini</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl text-left">
            <p className="text-slate-500 text-sm italic leading-relaxed">
              "The Group Discussion simulator was unique. Discussing complex topics against five AI participants with custom timers gave me real confidence before my final rounds."
            </p>
            <div className="flex items-center space-x-3 mt-6">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=80" alt="Student avatar" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-slate-800">Meera Sen</p>
                <p className="text-xs text-slate-400">Placed at TCS Digital</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-slate-500 text-lg">
            Invest in your career with affordable plans designed for students and professionals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="glass-card p-8 rounded-2xl flex flex-col border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Basic</h3>
            <div className="my-4">
              <span className="text-4xl font-extrabold text-slate-900">$0</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <p className="text-sm text-slate-500 mb-6 flex-1">Perfect for getting started with basic interview prep.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> 1 ATS Resume Scan</li>
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> 5 Basic Coding Questions</li>
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Standard Career Roadmap</li>
            </ul>
            <Link to="/auth/register" className="w-full py-3 px-4 border border-slate-300 text-slate-700 font-semibold rounded-xl text-center hover:bg-slate-50 transition-colors">Get Started</Link>
          </div>

          {/* Pro Plan */}
          <div className="glass-card p-8 rounded-2xl flex flex-col border-2 border-blue-500 relative transform md:-translate-y-4 shadow-xl shadow-blue-900/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">
              Most Popular
            </div>
            <h3 className="text-xl font-bold text-slate-800">Pro</h3>
            <div className="my-4">
              <span className="text-4xl font-extrabold text-slate-900">$12</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <p className="text-sm text-slate-500 mb-6 flex-1">Advanced AI features to ace top corporate interviews.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Unlimited ATS Scans</li>
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> AI Mock Interviews</li>
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Communication Analysis</li>
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Placement Predictor</li>
            </ul>
            <Link to="/auth/register" className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl text-center hover:bg-blue-700 transition-colors">Subscribe Now</Link>
          </div>

          {/* Teams Plan */}
          <div className="glass-card p-8 rounded-2xl flex flex-col border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">Campus</h3>
            <div className="my-4">
              <span className="text-4xl font-extrabold text-slate-900">$299</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <p className="text-sm text-slate-500 mb-6 flex-1">For colleges and bootcamps to train their batches.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Up to 500 Students</li>
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Admin Dashboard</li>
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Bulk Performance Reports</li>
              <li className="flex items-center text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Custom Branding</li>
            </ul>
            <a href="#contact" className="w-full py-3 px-4 border border-slate-300 text-slate-700 font-semibold rounded-xl text-center hover:bg-slate-50 transition-colors">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 border-t border-slate-200/60 bg-slate-50/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display mb-4">
            Get In Touch
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            Have questions about our AI models or want to set up MockMate for your university? Send us a message.
          </p>
          
          <div className="glass-card p-8 rounded-2xl text-left max-w-2xl mx-auto">
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Message sent!"); }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input aria-label="Full Name" type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input aria-label="Email Address" type="email" className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="john@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea aria-label="Message" className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-32 resize-none" placeholder="How can we help you?" required></textarea>
              </div>
              <button type="submit" className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <h2 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight mb-4">
          Start Your Placement Journey Today
        </h2>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          Create your account, upload your CV, and check your predictive placement matrix across top corporate recruiters.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Link
            to="/auth/register"
            className="px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-50 font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="px-6 py-3.5 bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 font-semibold rounded-lg transition-colors"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 bg-white text-center text-slate-400 text-xs">
        <p>© {new Date().getFullYear()} MockMate AI. Built for premium student career readiness diagnostics.</p>
      </footer>
    </div>
  );
}

