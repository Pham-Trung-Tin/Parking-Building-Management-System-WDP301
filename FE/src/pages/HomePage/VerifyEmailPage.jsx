import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('We are verifying your email address. Please wait a moment.');

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
          <div className="flex flex-col items-center gap-6">
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
            <p className="text-slate-500 text-sm">
              If the token has expired, please log in or sign up again to request a new verification email.
            </p>
            <div className="flex flex-col gap-3 w-full mt-2">
              <Link 
                to="/register" 
                className="w-full bg-primary-500 text-white py-3.5 text-base font-bold rounded-lg cursor-pointer transition-colors duration-200 hover:bg-primary-600 text-center no-underline block"
              >
                Create New Account
              </Link>
              <Link 
                to="/login" 
                className="w-full bg-white border border-slate-300 text-slate-700 py-3.5 text-base font-semibold rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 text-center no-underline block"
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
