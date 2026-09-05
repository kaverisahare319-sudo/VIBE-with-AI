import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const authContext = useContext(AuthContext);

  const isDashboardPage = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/resume-analyzer') ||
                          location.pathname.startsWith('/coding-assessment') ||
                          location.pathname.startsWith('/mock-interview') ||
                          location.pathname.startsWith('/gd-simulator') ||
                          location.pathname.startsWith('/communication-analysis') ||
                          location.pathname.startsWith('/body-language') ||
                          location.pathname.startsWith('/roadmap') ||
                          location.pathname.startsWith('/reports') ||
                          location.pathname.startsWith('/profile') ||
                          location.pathname.startsWith('/settings') ||
                          location.pathname.startsWith('/admin');

  if (isDashboardPage) return null; // Dashboards use SidebarLayout instead

  const isAuthenticated = !!authContext?.token;
  const isLandingPage = location.pathname === '/';
  const showNavLinks = isLandingPage && !isAuthenticated;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-slate-900">
                MockMate AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {showNavLinks && (
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-sm font-semibold bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full">Home</a>
              <a href="#features" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#contact" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Contact</a>
            </div>
          )}

          {/* Authentication CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <Link 
              to="/admin" 
              className="text-sm font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-full transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" /> Admin
            </Link>
            <Link 
              to="/auth/login" 
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/auth/register" 
              className="text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 px-5 py-2 rounded-full transition-opacity shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-lg"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-gray-100 bg-white">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {showNavLinks && (
              <>
                <a
                  href="#features"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-gray-50"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-gray-50"
                >
                  How It Works
                </a>
                <a
                  href="#pricing"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-gray-50"
                >
                  Pricing
                </a>
                <a
                  href="#stats"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-gray-50"
                >
                  Stats
                </a>
              </>
            )}
            <div className="pt-4 pb-2 border-t border-gray-100 flex flex-col space-y-2 px-3">
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium shadow-sm mb-1"
              >
                Admin Access
              </Link>
              <Link
                to="/auth/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-4 py-2 bg-slate-900 text-white rounded-lg font-medium shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
