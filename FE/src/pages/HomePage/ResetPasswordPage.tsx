import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authService } from '../../services/api';

const resetPasswordSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
    )
    .required('Mật khẩu mới là bắt buộc'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Xác nhận mật khẩu là bắt buộc'),
});

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError('');

      if (!token) {
        setServerError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        setSubmitting(false);
        return;
      }

      try {
        await authService.resetPassword(token, values.password, values.confirmPassword);
        navigate('/login', {
          state: { message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.' },
        });
      } catch (err: any) {
        const msg = err.message || '';
        if (err.status === 400) {
          setServerError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
        } else {
          setServerError(msg || 'Đã xảy ra lỗi, vui lòng thử lại.');
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const inputClass = (fieldName: string) => {
    const hasError = formik.touched[fieldName] && formik.errors[fieldName];
    return `peer w-full px-4 pt-4 pb-3 text-base border rounded-md outline-none transition-all duration-200 bg-white text-slate-900 placeholder-transparent pr-12 ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400'
        : 'border-slate-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
    }`;
  };

  const labelClass = (fieldName: string) => {
    const hasError = formik.touched[fieldName] && formik.errors[fieldName];
    return `absolute left-4 top-1/2 -translate-y-1/2 text-base transition-all duration-200 pointer-events-none bg-white px-1 peer-focus:top-0 peer-focus:text-xs peer-valid:top-0 peer-valid:text-xs ${
      hasError
        ? 'text-red-400 peer-focus:text-red-400 peer-valid:text-red-400'
        : 'text-slate-500 peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary-500 peer-valid:text-primary-500'
    }`;
  };

  // Token không tồn tại trong URL
  if (!token) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white p-5 font-sans">
        <div className="w-full max-w-[420px] text-center animate-fade-in-up">
          <Link to="/" className="flex flex-col items-center mb-10 text-primary-500 no-underline">
            <span className="text-sm font-bold tracking-[2px] -mb-1">PARKING</span>
            <span className="text-[32px] font-extrabold tracking-[-1px]">BUILDING</span>
          </Link>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Link không hợp lệ</h1>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email.
          </p>
          <Link
            to="/forgot-password"
            className="block bg-primary-500 text-white py-4 text-base font-bold rounded-md text-center transition-colors duration-200 hover:bg-primary-600"
          >
            Gửi lại email đặt lại mật khẩu
          </Link>
          <div className="mt-4">
            <Link to="/login" className="text-sm text-primary-500 font-semibold hover:underline inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Đặt lại mật khẩu</h1>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          Nhập mật khẩu mới cho tài khoản của bạn.
        </p>

        {/* Form */}
        <form className="flex flex-col gap-5" onSubmit={formik.handleSubmit} noValidate>

          {/* Server error */}
          {serverError && (
            <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-md px-4 py-3 text-left">
              {serverError}
              {serverError.includes('hết hạn') && (
                <div className="mt-2">
                  <Link to="/forgot-password" className="text-red-700 font-semibold underline">
                    Gửi lại email đặt lại mật khẩu →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Password */}
          <div className="flex flex-col gap-1 text-left">
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="reset-password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass('password')}
                placeholder="Mật khẩu mới"
                autoComplete="new-password"
              />
              <label htmlFor="reset-password" className={labelClass('password')}>
                Mật khẩu mới *
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-xs mt-0.5 pl-1">{formik.errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1 text-left">
            <div className="relative group">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="reset-confirm-password"
                name="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass('confirmPassword')}
                placeholder="Xác nhận mật khẩu"
                autoComplete="new-password"
              />
              <label htmlFor="reset-confirm-password" className={labelClass('confirmPassword')}>
                Xác nhận mật khẩu *
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-0.5 pl-1">{formik.errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="btn-reset-password"
            disabled={formik.isSubmitting}
            className="bg-primary-500 text-white border-none py-4 text-base font-bold rounded-md cursor-pointer transition-colors duration-200 hover:bg-primary-600 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {formik.isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>

          {/* Back to login */}
          <div className="text-sm text-slate-500">
            <Link to="/login" className="text-primary-500 font-semibold hover:underline inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
