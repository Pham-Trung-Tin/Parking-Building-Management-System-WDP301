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
};

export default authService;
