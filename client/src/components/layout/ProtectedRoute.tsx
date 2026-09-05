import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    // Not logged in, redirect to login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!user.emailVerified) {
    // Logged in but not verified, redirect to verify-email
    return <Navigate to="/auth/verify-email" replace />;
  }

  if (!user.completedOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
