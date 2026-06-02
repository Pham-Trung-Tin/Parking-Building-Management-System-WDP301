import axios from 'axios';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const status = error?.response?.status;
        const message = error?.response?.data?.message || error.message || 'Unexpected error';

        if (status === 401) {
            localStorage.removeItem('accessToken');
        }

        return Promise.reject({
            status,
            message,
            raw: error,
        });
    }
);

export default axiosClient;
