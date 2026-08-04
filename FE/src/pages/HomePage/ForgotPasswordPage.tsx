import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authService } from '../../services/api';

const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPasswordPage = () => {
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError('');
      setSuccessMessage('');
      try {
        await authService.forgotPassword(values.email);
        setSuccessMessage(
          'If your email is registered, we have sent instructions to reset your password. Please check your inbox.'
        );
      } catch (err: any) {
        setServerError(err.message || 'An error occurred, please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const hasError = formik.touched.email && formik.errors.email;

  return (
    <div className="min-h-screen flex justify-center items-center bg-white p-5 font-sans">
      <div className="w-full max-w-[420px] text-center animate-fade-in-up">
        {/* Logo */}
        <Link to="/" className="flex flex-col items-center mb-10 text-primary-500 no-underline">
          <span className="text-sm font-bold tracking-[2px] -mb-1">PARKING</span>
          <span className="text-[32px] font-extrabold tracking-[-1px]">BUILDING</span>
        </Link>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
              fill="none" stroke="#0056b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password?</h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Enter your registered email address. We will send you a password reset link if the email exists in our system.
        </p>

        {/* Form */}
        <form className="flex flex-col gap-5" onSubmit={formik.handleSubmit} noValidate>

          {/* Server error */}
          {serverError && (
            <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-md px-4 py-3 text-left">
              {serverError}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm rounded-md px-4 py-3 text-left">
              {successMessage}
            </div>
          )}

          {/* Email input */}
          {!successMessage && (
            <>
              <div className="flex flex-col gap-1 text-left">
                <div className="relative group">
                  <input
                    type="email"
                    id="forgot-email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`peer w-full px-4 pt-4 pb-3 text-base border rounded-md outline-none transition-all duration-200 bg-white text-slate-900 placeholder-transparent ${
                      hasError
                        ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                        : 'border-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                    }`}
                    placeholder="Email address"
                    autoComplete="email"
                  />
                  <label
                    htmlFor="forgot-email"
                    className={`absolute left-4 top-1/2 -translate-y-1/2 text-base transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:top-0 peer-focus:text-xs peer-valid:top-0 peer-valid:text-xs ${
                      hasError
                        ? 'text-red-400 peer-focus:text-red-400 peer-valid:text-red-400'
                        : 'text-slate-500 peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary-500 peer-valid:text-primary-500'
                    }`}
                  >
                    Email address *
                  </label>
                </div>
                {hasError && (
                  <p className="text-red-500 text-xs mt-0.5 pl-1">{formik.errors.email}</p>
                )}
              </div>

              <button
                type="submit"
                id="btn-send-reset"
                disabled={formik.isSubmitting}
                className="bg-primary-500 text-white border-none py-4 text-base font-bold rounded-md cursor-pointer transition-colors duration-200 hover:bg-primary-600 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {formik.isSubmitting ? 'Sending...' : 'Send password reset link'}
              </button>
            </>
          )}

          {/* Back to login */}
          <div className="text-sm text-slate-500">
            <Link to="/login" className="text-primary-500 font-semibold hover:underline inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
