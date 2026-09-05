import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, MessageSquare, Mic, Video,
  Calendar, Clock, Send, CheckCircle, ArrowLeft, RefreshCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

const COMM_MODES = [
  { id: 'chat', label: 'Chat Discussion', icon: MessageSquare, desc: 'Text-based group chat' },
  { id: 'voice', label: 'Voice Discussion', icon: Mic, desc: 'Live voice conversation' },
  { id: 'video', label: 'Video Discussion', icon: Video, desc: 'Webcam + voice session' },
];

const SLOTS = [
  { id: 'morning', label: 'Morning', time: '6 AM – 12 PM' },
  { id: 'afternoon', label: 'Afternoon', time: '12 PM – 5 PM' },
  { id: 'evening', label: 'Evening', time: '5 PM – 9 PM' },
  { id: 'night', label: 'Night', time: '9 PM – 12 AM' },
];

export default function GdLiveRequest() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [topics, setTopics] = useState<string[]>([]);
  const [form, setForm] = useState({
    preferredDate: '',
    preferredTime: '',
    topic: '',
    communicationMode: 'chat',
    numberOfParticipants: 4,
    availabilitySlot: 'evening',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/gd/topics`)
      .then(r => r.json())
      .then(data => {
        if (data.topics) setTopics(data.topics.map((t: any) => t.title));
      })
      .catch(() => setTopics([
        'Impact of Generative AI on Campus Placements',
        'Rise of Startups in Tier 2 Cities',
        'NEP 2020: Transforming Indian Education',
        'Digital Rupee vs UPI: The Future of Payments',
      ]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/gd/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto mt-16 bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm space-y-4"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Request Submitted!</h2>
          <p className="text-slate-500 text-sm">
            Your Live GD request has been received. Our admin team will review and send you an approval email with the meeting link.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/gd-simulator')}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
            >
              Back to GD Simulator
            </button>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/gd-simulator')} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-800">
              Request Live Group Discussion
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Fill in your preferences and our team will match you with real participants.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-8">
          {/* Date & Time */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <Calendar className="inline w-3.5 h-3.5 mr-1" />Preferred Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={form.preferredDate}
                onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <Clock className="inline w-3.5 h-3.5 mr-1" />Preferred Time
              </label>
              <input
                type="time"
                required
                value={form.preferredTime}
                onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Discussion Topic</label>
            <select
              required
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a topic...</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Communication Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Communication Mode</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {COMM_MODES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, communicationMode: m.id }))}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${form.communicationMode === m.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <m.icon className={`w-5 h-5 mb-2 ${form.communicationMode === m.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  <p className="text-sm font-bold text-slate-800">{m.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Participants */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              <Users className="inline w-3.5 h-3.5 mr-1" />Number of Participants
            </label>
            <div className="flex gap-2 flex-wrap">
              {[2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, numberOfParticipants: n }))}
                  className={`w-12 h-12 rounded-xl border-2 font-bold text-sm transition-all ${form.numberOfParticipants === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Slot */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Availability Slot</label>
            <div className="grid sm:grid-cols-4 gap-3">
              {SLOTS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, availabilitySlot: s.id }))}
                  className={`p-3 border-2 rounded-xl text-center transition-all ${form.availabilitySlot === s.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <p className="text-sm font-bold text-slate-800">{s.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Optional Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any specific requirements or topics you'd like to focus on..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {submitting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
