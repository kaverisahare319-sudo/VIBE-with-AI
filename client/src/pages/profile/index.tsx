import React from 'react';
import {
  GraduationCap,
  Award,
  Link2,
  ExternalLink,
  Briefcase,
  Globe,
  FileDown,
  Edit2
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/useAuth';

export default function Profile() {
  const { user } = useAuth();
  
  const profile = {
    name: user?.name || 'User Profile',
    email: user?.email || 'student@university.edu',
    degree: 'Bachelor of Technology in Computer Science',
    college: 'SPECTRA Institute of Technology',
    gradYear: '2027',
    gpa: '9.2 / 10.0',
    skills: ['React.js', 'Node.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Python', 'Docker', 'RESTful APIs'],
    certifications: [
      { name: 'AWS Cloud Practitioner', date: 'Jan 2026' },
      { name: 'Meta Full-Stack Engineer Specialization', date: 'Nov 2025' }
    ],
    achievements: [
      'Ranked #12 in State Hackathon 2025 (Team Lead)',
      'Cleared Codeforces round with 1450 rating index'
    ]
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-slate-950">Student Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your educational credentials, skill badges, and social linkages.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card & Socials */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />
            
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
              alt="Profile avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-slate-100 mx-auto mt-4 shadow-sm"
            />
            <h3 className="text-xl font-bold text-slate-800 mt-4 font-display">{profile.name}</h3>
            <p className="text-xs text-slate-400 mt-1">Computer Science Undergrad</p>

            <div className="flex justify-center space-x-3 mt-6">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600" aria-label="LinkedIn Profile">
                <Briefcase className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600" aria-label="GitHub Profile">
                <ExternalLink className="w-4 h-4" />
              </a>
              <a href="https://portfolio.com" target="_blank" rel="noreferrer" className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600" aria-label="Personal Portfolio">
                <Globe className="w-4 h-4" />
              </a>
            </div>

            <button
              onClick={() => alert('Editing profile info...')}
              className="mt-6 w-full flex items-center justify-center space-x-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile Details</span>
            </button>
          </div>

          {/* Social and Resume Files */}
          <div className="glass-card p-6 rounded-2xl text-left space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Resume Management</h4>
            <div className="p-3 border border-slate-150 rounded-lg bg-slate-50 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Link2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">{user?.name ? user.name.split(' ')[0] : 'User'}_CV_2026.pdf</span>
              </div>
              <button className="text-slate-400 hover:text-slate-700" aria-label="Download Resume">
                <FileDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Credentials Details */}
        <div className="lg:col-span-2 space-y-6 text-left">
          {/* Education */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center space-x-2 text-slate-800 mb-6">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold">Education Details</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-800">{profile.college}</p>
                <p className="text-xs text-slate-500 mt-1">{profile.degree}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-slate-400 font-semibold">
                  <span>Graduation Year: {profile.gradYear}</span>
                  <span>CGPA: {profile.gpa}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-bold text-slate-800 mb-4 font-display">Technical Skill Map</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200/50 rounded-lg">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications & Achievements */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center space-x-2 text-slate-800 mb-4">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm">Certifications</h3>
              </div>
              <div className="space-y-3">
                {profile.certifications.map((c, i) => (
                  <div key={i} className="text-xs">
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{c.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center space-x-2 text-slate-800 mb-4">
                <Award className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-sm">Achievements</h3>
              </div>
              <ul className="space-y-3 list-disc list-inside text-xs text-slate-600">
                {profile.achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

