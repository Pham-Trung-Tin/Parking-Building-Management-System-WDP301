import axiosClient from './axiosClient';

const authService = {
    /**
     * Đăng ký tài khoản mới
     * POST /auth/register
     * @param {{ fullName: string, email: string, password: string, phone: string }} data
     */
    register: (data) => {
        return axiosClient.post('/auth/register', data);
    },

    /**
     * Đăng nhập
     * POST /auth/login
     * @param {{ email: string, password: string }} data
     */
    login: (data) => {
        return axiosClient.post('/auth/login', data);
    },

    /**
     * Đăng xuất
     * POST /auth/logout
     */
    logout: () => {
        return axiosClient.post('/auth/logout');
    },

    /**
     * Xác thực email
     * GET /auth/verify-email/:token
     * @param {string} token
     */
    verifyEmail: (token) => {
        return axiosClient.get(`/auth/verify-email/${token}`);
    },

    /**
     * Gửi lại email xác thực
     * POST /auth/resend-verification
     * @param {string} email
     */
    resendVerification: (email) => {
        return axiosClient.post('/auth/resend-verification', { email });
    },
};

export default authService;
