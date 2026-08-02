import axiosClient from './axiosClient';

export interface ParkingSlotVehicleType {
    _id: string;
    name: string;
    code: string;
    icon?: string;
    color?: string;
}

export interface ParkingSlotPosition {
    row?: string;
    column?: number;
}

export interface ParkingSlotFeatures {
    hasEVCharger?: boolean;
    isHandicapped?: boolean;
    isVIP?: boolean;
    hasCCTV?: boolean;
}

export interface ParkingSlot {
    _id: string;
    slotCode: string;
    parkingLot: string;
    floor: { _id: string; name: string; floorNumber: number } | string;
    zone: { _id: string; name: string; code: string } | string;
    vehicleType: ParkingSlotVehicleType | string;
    status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'locked';
    /**
     * Computed by the backend at query time (getFloorSlotMap).
     * 'reserved' if a booking overlaps the requested time window (or starts within 30 min
     * for the Staff Live Map). Falls back to `status` when not present.
     */
    computedStatus?: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'locked';
    /** Populated when computedStatus === 'reserved' — the conflicting booking info. */
    upcomingBooking?: { bookingCode: string; startTime: string; endTime: string };
    position?: ParkingSlotPosition;
    features?: ParkingSlotFeatures;
    currentSession?: any;
    currentBooking?: any;
    lockedBy?: string | null;
    lockedUntil?: string | null;
    notes?: string;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetSlotsParams {
    parkingLot?: string;
    floor?: string;
    zone?: string;
    vehicleType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

const parkingSlotService = {
    /** GET /parking-slots */
    getSlots: (params?: GetSlotsParams): Promise<any> => {
        return axiosClient.get('/parking-slots', { params });
    },

    /** GET /parking-slots/floor-map/:floorId
     *  @param wantedStart ISO string of the start time the customer wants to book (optional)
     *  @param wantedEnd   ISO string of the end time the customer wants to book (optional)
     *  When provided, slots with overlapping bookings are returned with computedStatus='reserved'.
     */
    getFloorMap: (floorId: string, params?: { wantedStart?: string; wantedEnd?: string }): Promise<any> => {
        return axiosClient.get(`/parking-slots/floor-map/${floorId}`, { params });
    },

    /** GET /parking-slots/available */
    getAvailable: (params: { parkingLotId: string; vehicleTypeId: string; floorId?: string; zoneId?: string }): Promise<any> => {
        return axiosClient.get('/parking-slots/available', { params });
    },

    /** GET /parking-slots/:id */
    getById: (id: string): Promise<ParkingSlot> => {
        return axiosClient.get(`/parking-slots/${id}`);
    },

    /** POST /parking-slots */
    createSlot: (data: {
        slotCode: string;
        parkingLot: string;
        floor: string;
        zone?: string;
        vehicleType: string;
        position?: ParkingSlotPosition;
        features?: ParkingSlotFeatures;
        notes?: string;
    }): Promise<any> => {
        return axiosClient.post('/parking-slots', data);
    },

    /** POST /parking-slots/bulk */
    bulkCreate: (slots: any[], parkingLotId: string): Promise<any> => {
        return axiosClient.post('/parking-slots/bulk', { slots, parkingLotId });
    },

    /** PUT /parking-slots/:id */
    updateSlot: (id: string, data: Partial<ParkingSlot>): Promise<any> => {
        return axiosClient.put(`/parking-slots/${id}`, data);
    },

    /** PUT /parking-slots/:id/status */
    updateStatus: (id: string, status: string, notes?: string): Promise<any> => {
        return axiosClient.put(`/parking-slots/${id}/status`, { status, notes });
    },

    /** DELETE /parking-slots/:id */
    deleteSlot: (id: string): Promise<any> => {
        return axiosClient.delete(`/parking-slots/${id}`);
    },

    /** POST /parking-slots/:id/lock */
    lockSlot: (slotId: string): Promise<any> => {
        return axiosClient.post(`/parking-slots/${slotId}/lock`);
    },

    /** DELETE /parking-slots/:id/lock */
    unlockSlot: (slotId: string): Promise<any> => {
        return axiosClient.delete(`/parking-slots/${slotId}/lock`);
    },

    /** GET /parking-slots/occupancy/:parkingLotId */
    getOccupancyByVehicleType: (parkingLotId: string): Promise<any> => {
        return axiosClient.get(`/parking-slots/occupancy/${parkingLotId}`);
    },
};

export default parkingSlotService;
