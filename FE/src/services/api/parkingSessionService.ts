import axiosClient from './axiosClient';

export interface SessionVehicleInfo {
    licensePlate: string;
    vehicleModel?: string;
    vehicleColor?: string;
}

export interface SessionEvidence {
    url: string;
    publicId: string;
    type: 'entry' | 'exit' | 'incident';
    capturedAt: string;
}

export interface ParkingSession {
    _id: string;
    sessionCode: string;
    user?: { _id: string; fullName: string; email: string; phone?: string } | string;
    booking?: { _id: string; bookingCode: string } | string;
    parkingLot: { _id: string; name: string; code: string; address?: any } | string;
    floor: { _id: string; name: string; floorNumber: number } | string;
    zone?: { _id: string; name: string; code: string } | string;
    slot: { _id: string; slotCode: string; position?: any; features?: any } | string;
    vehicleType: { _id: string; name: string; code: string; pricing: { hourlyRate: number; dailyRate: number; overtimeMultiplier?: number } } | string;
    vehicleInfo: SessionVehicleInfo;
    entryTime: string;
    exitTime?: string;
    durationMs?: number;
    durationHours?: number;
    baseFee?: number;
    overtimeFee?: number;
    discount?: number;
    totalFee?: number;
    isOvertime?: boolean;
    overtimeHours?: number;
    paymentStatus: 'unpaid' | 'paid' | 'waived' | 'refunded';
    payment?: any;
    status: 'active' | 'completed' | 'cancelled' | 'abandoned';
    evidenceImages?: SessionEvidence[];
    notes?: string;
    ticketNumber?: string;
    currentDurationHours?: number; // virtual
    createdAt?: string;
    updatedAt?: string;
}

export interface GetSessionsParams {
    status?: 'active' | 'completed' | 'cancelled' | 'abandoned';
    licensePlate?: string;
    parkingLot?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

const parkingSessionService = {
    /** GET /parking-sessions — Lấy danh sách session (có phân trang & lọc) */
    getSessions: (params?: GetSessionsParams): Promise<any> => {
        return axiosClient.get('/parking-sessions', { params });
    },

    /** GET /parking-sessions/:id — Chi tiết session kèm populate đầy đủ */
    getById: (id: string): Promise<any> => {
        return axiosClient.get(`/parking-sessions/${id}`);
    },

    /** GET /parking-sessions/find-active — Tìm session đang active theo biển số hoặc mã session */
    findActive: (params: { licensePlate?: string; sessionCode?: string; parkingLotId?: string }): Promise<any> => {
        return axiosClient.get('/parking-sessions/find-active', { params });
    },

    /** POST /parking-sessions/check-in — Check-in a vehicle */
    checkIn: (data: { bookingId?: string; licensePlate?: string; vehicleTypeId?: string; parkingLotId: string; slotId?: string; }): Promise<any> => {
        return axiosClient.post('/parking-sessions/check-in', data);
    },

    /** PATCH /parking-sessions/:id/check-out — Check-out a vehicle */
    checkOut: (id: string): Promise<any> => {
        return axiosClient.patch(`/parking-sessions/${String(id).trim()}/check-out`);
    },
};

export default parkingSessionService;
