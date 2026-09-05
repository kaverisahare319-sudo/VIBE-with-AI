// Separate file for the useAuth hook to satisfy react-refresh/only-export-components rule.
// This keeps AuthProvider (component) and useAuth (hook) in separate modules.
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
