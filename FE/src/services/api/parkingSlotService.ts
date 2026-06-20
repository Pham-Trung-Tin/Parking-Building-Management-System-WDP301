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
    /** GET /parking-slots — danh sách slot có filter */
    getSlots: (params?: GetSlotsParams): Promise<any> => {
        return axiosClient.get('/parking-slots', { params });
    },

    /** GET /parking-slots/floor-map/:floorId — bản đồ slot realtime theo tầng */
    getFloorMap: (floorId: string): Promise<ParkingSlot[]> => {
        return axiosClient.get(`/parking-slots/floor-map/${floorId}`);
    },

    /** GET /parking-slots/available — tìm slot tối ưu (AI) */
    getAvailable: (params: { parkingLotId: string; vehicleTypeId: string; floorId?: string; zoneId?: string }): Promise<any> => {
        return axiosClient.get('/parking-slots/available', { params });
    },

    /** GET /parking-slots/:id */
    getById: (id: string): Promise<ParkingSlot> => {
        return axiosClient.get(`/parking-slots/${id}`);
    },
    /** POST /parking-slots/:id/lock */
    lockSlot: (slotId: string): Promise<any> => {
        return axiosClient.post(`/parking-slots/${slotId}/lock`);
    },

    /** DELETE /parking-slots/:id/lock */
    unlockSlot: (slotId: string): Promise<any> => {
        return axiosClient.delete(`/parking-slots/${slotId}/lock`);
    },
};

export default parkingSlotService;
