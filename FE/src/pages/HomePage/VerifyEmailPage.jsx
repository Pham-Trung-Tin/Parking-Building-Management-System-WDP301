import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api';

const RESEND_COOLDOWN = 60; // seconds

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('We are verifying your email address. Please wait a moment.');

  // Resend state
  const [email, setEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [resendMessage, setResendMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearInterval(cooldownRef.current);
  }, []);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token. Please check your verification link again.');
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response?.message || 'Your email address has been verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error?.message || 'Invalid or expired token. Please request a new verification link.');
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setResendStatus('error');
      setResendMessage('Please enter your email address.');
      return;
    }
    setResendStatus('sending');
    setResendMessage('');
    try {
      await authService.resendVerification(email.trim());
      setResendStatus('sent');
      setResendMessage('Verification email sent! Please check your inbox (and spam folder).');
      startCooldown();
    } catch (error) {
      setResendStatus('error');
      setResendMessage(error?.message || 'Failed to send verification email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-white p-5 font-sans">
      <div className="w-full max-w-[460px] text-center animate-fade-in-up my-10 p-8 border border-slate-100 rounded-2xl shadow-sm">
        {/* Logo */}
        <Link to="/" className="flex flex-col items-center mb-10 text-primary-500 no-underline">
          <span className="text-sm font-bold tracking-[2px] -mb-1">PARKING</span>
          <span className="text-[32px] font-extrabold tracking-[-1px]">BUILDING</span>
        </Link>

        {/* Dynamic content based on status */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
            <h2 className="text-xl font-bold text-slate-800">Verifying your email...</h2>
            <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Email Verified!</h2>
            <p className="text-emerald-600 text-sm font-medium bg-emerald-50/50 border border-emerald-100 rounded-lg px-4 py-3 w-full">
              {message}
            </p>
            <p className="text-slate-500 text-sm">
              Thank you for verifying your email. You can now access all the features of Parking Building.
            </p>
            <Link 
              to="/login" 
              className="w-full bg-primary-500 text-white py-3.5 text-base font-bold rounded-lg cursor-pointer transition-colors duration-200 hover:bg-primary-600 mt-2 text-center no-underline block"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Error icon */}
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center border border-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Verification Failed</h2>
            <p className="text-red-600 text-sm font-medium bg-red-50/50 border border-red-100 rounded-lg px-4 py-3 w-full">
              {message}
            </p>

            {/* Resend email section */}
            <div className="w-full border border-slate-200 rounded-xl p-5 bg-slate-50 text-left">
              <p className="text-slate-700 text-sm font-semibold mb-1">Resend Verification Email</p>
              <p className="text-slate-500 text-xs mb-4">Enter your registered email and we'll send a new verification link.</p>

              <form onSubmit={handleResend} className="flex flex-col gap-3">
                <input
                  type="email"
                  id="resend-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={resendStatus === 'sending' || cooldown > 0}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                />

                <button
                  type="submit"
                  disabled={resendStatus === 'sending' || cooldown > 0}
                  className="w-full flex items-center justify-center gap-2 bg-primary-500 text-white py-2.5 text-sm font-bold rounded-lg transition-all duration-200 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {resendStatus === 'sending' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block"></span>
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    `Resend in ${cooldown}s`
                  ) : (
                    <>
                      {/* Mail icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                      Resend Verification Email
                    </>
                  )}
                </button>
              </form>

              {/* Feedback message */}
              {resendMessage && (
                <p className={`mt-3 text-xs font-medium rounded-lg px-3 py-2 ${
                  resendStatus === 'sent'
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                    : 'text-red-600 bg-red-50/50 border border-red-100'
                }`}>
                  {resendMessage}
                </p>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex flex-col gap-3 w-full">
              <Link
                to="/register"
                className="w-full bg-white border border-slate-300 text-slate-700 py-3 text-sm font-semibold rounded-lg transition-all duration-200 hover:bg-slate-50 text-center no-underline block"
              >
                Create New Account
              </Link>
              <Link
                to="/login"
                className="text-sm text-slate-500 hover:text-primary-500 transition-colors text-center no-underline"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
