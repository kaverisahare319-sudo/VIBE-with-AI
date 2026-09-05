import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, MailOpen, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import '../../styles/grid-background.css';

const API = 'http://localhost:5005/api/auth';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Email is passed from the registration page via router state
  const email = location.state?.email || '';

  // ── State ────────────────────────────────────────────────────────────────────
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Refs for the 6 OTP digit inputs
  const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null, null, null]);

  // ── Cooldown timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (email) {
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }
  }, [email]);

  // ── OTP Input Handlers ───────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Accept only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
      setOtp(newOtp);
      const nextEmpty = Math.min(pasted.length, 5);
      inputRefs.current[nextEmpty]?.focus();
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.');
      }
      // Sync AuthContext state (updates both React state and localStorage)
      if (data.token && data.user) {
        login(data.token, data.user);
      }
      setSuccess(true);
      // Redirect: first-time users go to onboarding, returning verified users go to dashboard
      const destination = data.user?.completedOnboarding ? '/dashboard' : '/onboarding';
      setTimeout(() => navigate(destination, { replace: true }), 2000);
    } catch (err) {
      setError((err as Error).message);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setVerifying(false);
    }
  };

  // Submit on Enter key in last box
  const handleLastKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleVerify();
    else handleOtpKeyDown(5, e);
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError(null);
    setOtp(['', '', '', '', '', '']);
    try {
      const res = await fetch(`${API}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) setCooldown(60);
        throw new Error(data.error || 'Failed to resend code.');
      }
      setCooldown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setResending(false);
    }
  };

  const otpComplete = otp.every(d => d !== '');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white grid-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="flex justify-center items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold font-display text-slate-800">
            MockMate<span className="text-blue-600 font-extrabold">.AI</span>
          </span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-10 px-6 sm:rounded-3xl sm:px-12 shadow-2xl relative overflow-hidden text-center border border-slate-200/60 bg-white/80 backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600" />

          {/* ── Success State ── */}
          {success ? (
            <div className="animate-fade-in scale-in">
              <div className="w-20 h-20 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2 font-display">Email Verified Successfully</h3>
              <p className="text-slate-500 mb-6">Your account has been activated.</p>
              <div className="flex justify-center items-center gap-2 text-sm text-slate-500 font-medium bg-slate-50 py-2 rounded-full w-max mx-auto px-4">
                <RefreshCw className="w-4 h-4 animate-spin" /> Setting up your account...
              </div>
            </div>

          /* ── Main Waiting / OTP Entry State ── */
          ) : (
            <div className="animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-blue-50/50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" style={{ animationDuration: '3s' }} />
                <MailOpen className="w-10 h-10 text-blue-600 relative z-10" />
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 font-display mb-3">
                📧 Verification Email Sent
              </h2>

              <div className="mb-6">
                <p className="text-slate-600 leading-relaxed text-sm">
                  A 6-digit verification code has been sent to:
                </p>
                <div className="inline-block mt-2 px-4 py-1.5 bg-slate-100 text-slate-800 font-semibold rounded-lg text-sm border border-slate-200">
                  {email || 'your email'}
                </div>
                <p className="mt-3 text-slate-500 text-xs leading-relaxed">
                  Enter the code below to activate your MockMate.AI account.
                </p>
              </div>

              {/* ── 6-Digit OTP Input ── */}
              <div className="flex justify-center gap-2 mb-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={i === 5 ? handleLastKeyDown : e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="w-11 h-12 text-center text-xl font-bold border-2 rounded-lg outline-none transition-all
                      border-slate-200 bg-slate-50 text-slate-800
                      focus:border-blue-500 focus:bg-white focus:shadow-sm
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={verifying}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <p className="text-xs text-slate-400 mb-5">Code expires in 10 minutes</p>

              {/* ── Verify Button ── */}
              <button
                onClick={handleVerify}
                disabled={!otpComplete || verifying}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md mb-6"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                  </span>
                ) : 'Verify Email'}
              </button>

              {/* ── Error Message ── */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* ── Resend / Change Email ── */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center text-sm">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="text-blue-600 hover:text-blue-700 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {resending ? 'Sending...' : cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
                </button>
                <button
                  onClick={() => navigate('/auth/register')}
                  className="text-slate-500 hover:text-slate-800 font-semibold transition-colors"
                >
                  Change Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
