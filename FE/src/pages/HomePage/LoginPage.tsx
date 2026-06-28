import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authService } from '../../services/api';

// SVG Icons for Google and Apple
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="20px" height="20px">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

// Yup validation schema — khớp với backend loginValidator
const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Email không hợp lệ')
    .required('Email là bắt buộc'),

  password: Yup.string()
    .required('Mật khẩu là bắt buộc'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const successMessage = location.state?.message || '';

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError('');
      try {
        const res = await authService.login(values);

        // Lưu accessToken vào localStorage để axiosClient đính kèm vào request tiếp theo
        if (res?.data?.accessToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
        }

        // Lưu thông tin user (tuỳ chọn — dùng cho hiển thị header, avatar, v.v.)
        if (res?.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          window.dispatchEvent(new Event('authChange'));
        }

        // Chuyển hướng tuỳ theo role
        const role = res?.data?.user?.role;
        if (role === 'system_admin') {
          navigate('/admin');
        } else if (role === 'parking_manager' || role === 'parking_staff') {
          navigate('/staff');
        } else {
          navigate('/');
        }
      } catch (err) {
        setServerError(err.message || 'Email hoặc mật khẩu không đúng, vui lòng thử lại.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Helper: class border cho input theo trạng thái lỗi
  const inputClass = (fieldName) => {
    const hasError = formik.touched[fieldName] && formik.errors[fieldName];
    return `peer w-full px-4 pt-4 pb-3 text-base border rounded-md outline-none transition-all duration-200 bg-white text-slate-900 placeholder-transparent ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400'
        : 'border-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
    }`;
  };

  const labelClass = (fieldName) => {
    const hasError = formik.touched[fieldName] && formik.errors[fieldName];
    return `absolute left-4 top-1/2 -translate-y-1/2 text-base transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:top-0 peer-focus:text-xs peer-valid:top-0 peer-valid:text-xs ${
      hasError
        ? 'text-red-400 peer-focus:text-red-400 peer-valid:text-red-400'
        : 'text-slate-500 peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary-500 peer-valid:text-primary-500'
    }`;
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-white p-5 font-sans">
      <div className="w-full max-w-[420px] text-center animate-fade-in-up">
        {/* Logo */}
        <Link to="/" className="flex flex-col items-center mb-10 text-primary-500 no-underline">
          <span className="text-sm font-bold tracking-[2px] -mb-1">PARKING</span>
          <span className="text-[32px] font-extrabold tracking-[-1px]">BUILDING</span>
        </Link>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-[30px]">Log in to Parking Building</h1>

        {/* Form */}
        <form className="flex flex-col gap-5" onSubmit={formik.handleSubmit} noValidate>

          {/* Lỗi từ server */}
          {serverError && (
            <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-md px-4 py-3 text-left">
              {serverError}
            </div>
          )}

          {/* Thông báo thành công từ redirect */}
          {successMessage && !serverError && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm rounded-md px-4 py-3 text-left mb-4">
              {successMessage}
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1 text-left">
            <div className="relative group">
              <input
                type="email"
                id="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass('email')}
                placeholder="Email address"
                autoComplete="email"
              />
              <label htmlFor="email" className={labelClass('email')}>
                Email address *
              </label>
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-xs mt-0.5 pl-1">{formik.errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1 text-left">
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`${inputClass('password')} pr-12`}
                placeholder="Password"
                autoComplete="current-password"
              />
              <label htmlFor="password" className={labelClass('password')}>
                Password *
              </label>
              {/* Toggle show/hide password */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  // Eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-xs mt-0.5 pl-1">{formik.errors.password}</p>
            )}
          </div>

          {/* Forgot password */}
          <div className="text-right -mt-2">
            <Link to="/forgot-password" className="text-sm text-primary-500 hover:underline font-medium">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="bg-primary-500 text-white border-none py-4 text-base font-bold rounded-md cursor-pointer transition-colors duration-200 hover:bg-primary-600 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {formik.isSubmitting ? 'Đang đăng nhập...' : 'Log in'}
          </button>
        </form>

        <div className="mt-5 text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-primary-500 font-semibold hover:underline">Sign up</Link>
        </div>

        {/* Divider */}
        <div className="flex items-center text-center my-[30px] text-slate-400 text-xs font-semibold">
          <div className="flex-1 border-b border-slate-200"></div>
          <span className="px-[15px]">OR</span>
          <div className="flex-1 border-b border-slate-200"></div>
        </div>

        {/* Social Login */}
        <div className="flex flex-col gap-[15px] mb-[30px]">
          <button className="flex items-center justify-center gap-2.5 bg-white border border-slate-300 py-3.5 rounded-md text-[15px] font-semibold text-slate-900 cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-400">
            <GoogleIcon />
            Continue with Google
          </button>
          <button className="flex items-center justify-center gap-2.5 bg-white border border-slate-300 py-3.5 rounded-md text-[15px] font-semibold text-slate-900 cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-400">
            <AppleIcon />
            Continue with Apple
          </button>
        </div>

        {/* Terms */}
        <div className="text-xs text-slate-500 leading-[1.6]">
          By logging in, I agree to the Parking Building <a href="#" className="text-slate-500 underline hover:text-primary-500">Terms and Conditions</a> and <a href="#" className="text-slate-500 underline hover:text-primary-500">Privacy Policy</a>. If I'm a seller, I also agree to the <a href="#" className="text-slate-500 underline hover:text-primary-500">Operator Dashboard Terms</a>.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
