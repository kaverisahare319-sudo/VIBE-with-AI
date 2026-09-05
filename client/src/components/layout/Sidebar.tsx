import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  GitBranch,
  Code2,
  Mic,
  Video,
  MessagesSquare,
  TrendingUp,
  UserCheck,
  Settings,
  ShieldAlert,
  LogOut,
  Target
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Resume Analyzer', path: '/resume-analyzer', icon: FileText },
    { name: 'Career Roadmap', path: '/career-roadmap', icon: GitBranch },
    { name: 'Coding Test', path: '/coding-assessment', icon: Code2 },
    { name: 'AI Placement Assessment', path: '/ai-placement-assessment', icon: Sparkles },
    { name: 'GD Simulator', path: '/gd-simulator', icon: MessagesSquare },
    { name: 'Placement Predictor', path: '/placement-prediction', icon: Target },
    { name: 'Reports & Progress', path: '/reports', icon: TrendingUp },
    { name: 'Profile', path: '/profile', icon: UserCheck },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Admin panel', path: '/admin', icon: ShieldAlert },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Generate initials for the avatar fallback
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white/75 backdrop-blur-md flex flex-col h-screen sticky top-0">
      {/* Sidebar Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center">
        <NavLink to="/dashboard" className="flex items-center space-x-2" aria-label="Go to Dashboard">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold font-display tracking-tight text-slate-800">
            MockMate<span className="text-purple-600 font-semibold">.AI</span>
          </span>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`
            }
            aria-label={`Navigate to ${item.name}`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Session Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-blue-100 to-purple-100 text-blue-700 font-bold border border-blue-200 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate" title={user?.name || 'User'}>
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate" title={user?.email || 'Student Profile'}>
              {user?.email || 'Student Profile'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Sign Out"
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50/30 transition-all font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
