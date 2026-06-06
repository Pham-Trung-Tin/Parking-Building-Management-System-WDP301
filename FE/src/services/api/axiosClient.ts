import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: đính kèm accessToken vào mỗi request
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Biến quản lý trạng thái refresh để tránh gọi refresh nhiều lần đồng thời
let isRefreshing = false;
let failedQueue: { resolve: (value: any) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor: tự động refresh token khi gặp 401
axiosClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;
        const message = error?.response?.data?.message || error.message || 'Unexpected error';

        // Nếu 401 và chưa retry, thử refresh token
        if (status === 401 && !originalRequest._retry) {
            // Bỏ qua các API auth để trả về lỗi validation hoặc thông tin đăng nhập sai bình thường
            const isAuthRequest = originalRequest.url?.includes('/auth/login') ||
                                  originalRequest.url?.includes('/auth/register') ||
                                  originalRequest.url?.includes('/auth/verify-email') ||
                                  originalRequest.url?.includes('/auth/forgot-password') ||
                                  originalRequest.url?.includes('/auth/reset-password') ||
                                  originalRequest.url?.includes('/auth/refresh-token');

            if (isAuthRequest) {
                return Promise.reject({ status, message, raw: error });
            }

            const refreshToken = localStorage.getItem('refreshToken');

            // Không có refreshToken → logout ngay (chỉ chuyển hướng nếu không ở trang login)
            if (!refreshToken) {
                localStorage.removeItem('accessToken');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject({ status, message, raw: error });
            }

            // Đang refresh → đưa request vào hàng đợi
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosClient(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response: any = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`,
                    { refreshToken }
                );

                const newAccessToken = response.data?.data?.accessToken || response.data?.accessToken;
                const newRefreshToken = response.data?.data?.refreshToken;

                localStorage.setItem('accessToken', newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject({ status, message, raw: error });
    }
);

export default axiosClient;
