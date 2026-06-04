import axiosClient from './axiosClient';

const authService = {
    /**
     * Đăng ký tài khoản mới
     * POST /auth/register
     * @param {any} data
     */
    register: (data: any): Promise<any> => {
        return axiosClient.post('/auth/register', data);
    },

    /**
     * Đăng nhập
     * POST /auth/login
     * @param {any} data
     */
    login: (data: any): Promise<any> => {
        return axiosClient.post('/auth/login', data);
    },

    /**
     * Đăng xuất
     * POST /auth/logout
     */
    logout: (): Promise<any> => {
        return axiosClient.post('/auth/logout');
    },

    /**
     * Xác thực email
     * GET /auth/verify-email/:token
     * @param {string} token
     */
    verifyEmail: (token: string): Promise<any> => {
        return axiosClient.get(`/auth/verify-email/${token}`);
    },

    /**
     * Gửi lại email xác thực
     * POST /auth/resend-verification
     * @param {string} email
     */
    resendVerification: (email: string): Promise<any> => {
        return axiosClient.post('/auth/resend-verification', { email });
    },

    /**
     * Làm mới access token
     * POST /auth/refresh-token
     * @param {string} refreshToken
     */
    refreshToken: (refreshToken: string): Promise<any> => {
        return axiosClient.post('/auth/refresh-token', { refreshToken });
    },

    /**
     * Yêu cầu gửi email đặt lại mật khẩu
     * POST /auth/forgot-password
     * @param {string} email
     */
    forgotPassword: (email: string): Promise<any> => {
        return axiosClient.post('/auth/forgot-password', { email });
    },

    /**
     * Đặt lại mật khẩu
     * POST /auth/reset-password/:token
     * @param {string} token - token từ URL
     * @param {string} password - mật khẩu mới
     * @param {string} confirmPassword - xác nhận mật khẩu mới
     */
    resetPassword: (token: string, password: string, confirmPassword: string): Promise<any> => {
        return axiosClient.post(`/auth/reset-password/${token}`, { password, confirmPassword });
    },

    /**
     * Đổi mật khẩu (đã đăng nhập)
     * POST /auth/change-password
     * @param {string} currentPassword - mật khẩu hiện tại
     * @param {string} newPassword - mật khẩu mới
     */
    changePassword: (currentPassword: string, newPassword: string): Promise<any> => {
        return axiosClient.post('/auth/change-password', { currentPassword, newPassword });
    },
};

export default authService;
