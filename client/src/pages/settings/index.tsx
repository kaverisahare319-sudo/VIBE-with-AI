import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Bell,
  Lock,
  Mail,
  User,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'notifications'>('general');
  const [passSaved, setPassSaved] = useState(false);
  const [emailPref, setEmailPref] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const passSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timer on unmount
  useEffect(() => {
    return () => {
      if (passSavedTimerRef.current) clearTimeout(passSavedTimerRef.current);
    };
  }, []);

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPassSaved(true);
    if (passSavedTimerRef.current) clearTimeout(passSavedTimerRef.current);
    passSavedTimerRef.current = setTimeout(() => setPassSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-slate-950">Account Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure security levels, notification triggers, and user privacy toggles.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 text-left">
        {/* Left Column: Navigation categories */}
        <div className="space-y-4 lg:col-span-1">
          <div className="glass-card p-4 rounded-xl space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'general' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-50/50 text-slate-600'
              }`}
            >
              <User className="w-4 h-4 text-blue-500" />
              <span>General Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'privacy' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-50/50 text-slate-600'
              }`}
            >
              <Shield className="w-4 h-4 text-purple-500" />
              <span>Privacy & Security</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'notifications' ? 'bg-slate-100 text-slate-800' : 'hover:bg-slate-50/50 text-slate-600'
              }`}
            >
              <Bell className="w-4 h-4 text-cyan-500" />
              <span>Notification Profiles</span>
            </button>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center space-x-2 mb-4 text-slate-800">
                <Lock className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="font-bold text-sm">Change Password</h3>
              </div>
              
              <form onSubmit={handlePasswordSave} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Current Password</label>
                    <input aria-label="Password" type="password" required className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">New Password</label>
                    <input aria-label="Password" type="password" required className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1">
                    Update Password
                  </button>
                </div>
              </form>

              {passSaved && (
                <div className="mt-3 flex items-center space-x-1.5 text-green-700 bg-green-50 border border-green-200 p-2.5 rounded-lg text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password updated successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Privacy & Security */}
          {activeTab === 'privacy' && (
            <div className="glass-card p-6 rounded-2xl border-l-4 border-l-rose-500">
              <div className="flex items-center space-x-2 text-rose-700 mb-2">
                <Trash2 className="w-4.5 h-4.5" />
                <h3 className="font-bold text-sm">Delete Account</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Once you terminate your account, all historical resume analysis files, coding compilations, and interview logs will be deleted permanently.
              </p>
              <button
                onClick={() => alert('Account deletion request initiated.')}
                className="px-4 py-2 border border-rose-200 bg-rose-50/20 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-50 transition-colors"
              >
                Request Account Termination
              </button>
            </div>
          )}

          {/* Notification Profiles */}
          {activeTab === 'notifications' && (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 mb-2">
                <Mail className="w-4.5 h-4.5 text-purple-600" />
                <h3 className="font-bold text-sm">Notifications & Email</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-700">Weekly Progress Digest</p>
                    <p className="text-slate-400 mt-0.5">Receive summary reports on assessment scoring trends.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPref}
                    onChange={(e) => setEmailPref(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 rounded"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-700">Recruiter Match Alerts</p>
                    <p className="text-slate-400 mt-0.5">Alert me when placement readiness matches new company scopes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 rounded"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}

