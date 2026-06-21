import axiosClient from './axiosClient';

const bookingService = {
    create: (data: any): Promise<any> => {
        return axiosClient.post('/bookings', data);
    },
    getMyBookings: (params?: any): Promise<any> => {
        return axiosClient.get('/bookings/my', { params });
    },
    getById: (id: string): Promise<any> => {
        return axiosClient.get(`/bookings/${id}`);
    },
    cancel: (id: string, reason: string): Promise<any> => {
        return axiosClient.post(`/bookings/${id}/cancel`, { reason });
    }
};

export default bookingService;
