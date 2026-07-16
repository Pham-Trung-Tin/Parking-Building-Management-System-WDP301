import axiosClient from './axiosClient';

export interface DashboardStats {
    totalSessions: number;
    activeSessions: number;
    todaySessions: number;
    todayRevenue: number;
    slots: {
        total: number;
        available: number;
        occupied: number;
        reserved: number;
        maintenance: number;
        locked: number;
        [key: string]: number;
    };
    occupancyRate: number;
    totalUsers: number;
}

export interface RevenueReport {
    period: string;
    start: string;
    end: string;
    totalRevenue: number;
    totalTransactions: number;
    avgPerTransaction: number;
    bookingRevenue: number;
    bookingCount: number;
    monthlyPassRevenue: number;
    monthlyPassCount: number;
    sessionRevenue: number;
    sessionCount: number;
    chart: Array<{
        _id: {
            year: number;
            month: number;
            day?: number;
            hour?: number;
        };
        totalRevenue: number;
        count: number;
        avgRevenue: number;
    }>;
    byMethod: Array<{
        _id: string;
        total: number;
        count: number;
    }>;
    byPaymentType: Array<{
        _id: string;
        total: number;
        count: number;
    }>;
}

export interface SessionReport {
    period: string;
    chart: Array<{
        _id: {
            year: number;
            month: number;
            day: number;
        };
        count: number;
        totalFee: number;
    }>;
    byVehicleType: Array<{
        _id: string;
        count: number;
        totalRevenue: number;
        vehicleType: {
            _id: string;
            name: string;
        };
    }>;
    summary: {
        avgDurationHours: number;
        avgFee: number;
        totalSessions: number;
        totalOvertime: number;
    };
    peakHours: Array<{
        _id: number;
        count: number;
    }>;
}

export interface OccupancyReportItem {
    _id: {
        vehicleType: string;
        status: string;
    };
    count: number;
    vehicleType: {
        _id: string;
        name: string;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

const reportService = {
    /**
     * Get dashboard stats overview
     * GET /reports/dashboard
     */
    getDashboardStats: (parkingLotId?: string): Promise<ApiResponse<DashboardStats>> => {
        return axiosClient.get('/reports/dashboard', {
            params: parkingLotId ? { parkingLotId } : {},
        });
    },

    /**
     * Get revenue report
     * GET /reports/revenue
     */
    getRevenueReport: (params?: { period?: string; groupBy?: string; parkingLotId?: string }): Promise<ApiResponse<RevenueReport>> => {
        return axiosClient.get('/reports/revenue', { params });
    },

    /**
     * Get sessions report
     * GET /reports/sessions
     */
    getSessionReport: (params?: { period?: string; parkingLotId?: string }): Promise<ApiResponse<SessionReport>> => {
        return axiosClient.get('/reports/sessions', { params });
    },

    /**
     * Get occupancy report
     * GET /reports/occupancy
     */
    getOccupancyReport: (parkingLotId?: string): Promise<ApiResponse<OccupancyReportItem[]>> => {
        return axiosClient.get('/reports/occupancy', {
            params: parkingLotId ? { parkingLotId } : {},
        });
    },

    /**
     * Export sessions as CSV
     * GET /reports/export/sessions
     */
    exportSessions: (params?: { period?: string; parkingLotId?: string }): Promise<any> => {
        // Need to request as blob because it returns a raw CSV stream
        return axiosClient.get('/reports/export/sessions', {
            params,
            responseType: 'blob',
        });
    },
};

export default reportService;
