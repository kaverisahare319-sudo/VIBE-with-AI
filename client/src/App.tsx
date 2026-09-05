import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Onboarding from './pages/onboarding';
import StudentDashboard from './pages/dashboard';
import ResumeAnalyzer from './pages/resume-analyzer';
import CareerRoadmap from './pages/career-roadmap';
import CodingAssessment from './pages/coding-assessment';
import AIPlacementAssessment from './pages/ai-placement-assessment';
import GdSimulator from './pages/gd-simulator';
import GdLiveRequest from './pages/gd-simulator/LiveRequest';
import LiveGdRoom from './pages/gd-simulator/LiveGdRoom';
import PlacementPrediction from './pages/placement-prediction';
import Reports from './pages/reports';
import Profile from './pages/profile';
import SettingsPage from './pages/settings';
import AdminDashboard from './pages/admin';


export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <Router>
        <div className="flex flex-col min-h-screen bg-white">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Landing & Authentication */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />

              {/* Student Dashboard & Modules */}
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
              <Route path="/resume-analyzer" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
              <Route path="/career-roadmap" element={<ProtectedRoute><CareerRoadmap /></ProtectedRoute>} />
              <Route path="/coding-assessment" element={<ProtectedRoute><CodingAssessment /></ProtectedRoute>} />
              <Route path="/ai-placement-assessment" element={<ProtectedRoute><AIPlacementAssessment /></ProtectedRoute>} />
              <Route path="/gd-simulator" element={<ProtectedRoute><GdSimulator /></ProtectedRoute>} />
              <Route path="/gd-simulator/live-request" element={<ProtectedRoute><GdLiveRequest /></ProtectedRoute>} />
              <Route path="/live-gd/:roomId" element={<ProtectedRoute><LiveGdRoom /></ProtectedRoute>} />
              <Route path="/placement-prediction" element={<ProtectedRoute><PlacementPrediction /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Admin — protected by AdminAuthContext internally */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
        </Router>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
