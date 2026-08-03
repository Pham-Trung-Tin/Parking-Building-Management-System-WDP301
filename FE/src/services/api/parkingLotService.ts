import axiosClient from './axiosClient';

export interface ParkingLotAddress {
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export interface ParkingLot {
    _id: string;
    name: string;
    code: string;
    description?: string;
    address?: ParkingLotAddress;
    manager?: string;
    totalFloors?: number;
    totalSlots?: number;
    availableSlots?: number;
    occupiedSlots?: number;
    contactPhone?: string;
    contactEmail?: string;
    amenities?: string[];
    status: 'active' | 'inactive' | 'maintenance';
    images?: string[];
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
    // pricing (nếu có trong response)
    pricePerHour?: number;
    settings?: {
        pricePerHour?: number;
        pricePerDay?: number;
        [key: string]: any;
    };
}

export interface GetParkingLotsParams {
    status?: 'active' | 'inactive' | 'maintenance';
    search?: string;
    page?: number;
    limit?: number;
    manager?: string;
}

export interface StaffMember {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatar?: { url: string; publicId: string };
    avatarUrl?: string;
    status: string;
    role?: string;
    createdAt: string;
}

const parkingLotService = {
    getParkingLots: (params?: GetParkingLotsParams): Promise<ParkingLot[] | any> => {
        return axiosClient.get('/parking-lots', { params });
    },
    getParkingLotById: (id: string): Promise<ParkingLot> => {
        return axiosClient.get(`/parking-lots/${id}`);
    },

    // ─── CRUD ───
    createParkingLot: (data: Partial<ParkingLot> & { address?: ParkingLotAddress }): Promise<any> => {
        return axiosClient.post('/parking-lots', data);
    },
    updateParkingLot: (id: string, data: Partial<ParkingLot>): Promise<any> => {
        return axiosClient.put(`/parking-lots/${id}`, data);
    },
    deleteParkingLot: (id: string): Promise<any> => {
        return axiosClient.delete(`/parking-lots/${id}`);
    },

    // ─── Staff Assignment APIs ───
    getStaff: (parkingLotId: string): Promise<any> => {
        return axiosClient.get(`/parking-lots/${parkingLotId}/staff`);
    },
    assignStaff: (parkingLotId: string, staffId: string): Promise<any> => {
        return axiosClient.post(`/parking-lots/${parkingLotId}/staff`, { staffId });
    },
    removeStaff: (parkingLotId: string, staffId: string): Promise<any> => {
        return axiosClient.delete(`/parking-lots/${parkingLotId}/staff/${staffId}`);
    },
    getAvailableStaff: (search?: string): Promise<any> => {
        return axiosClient.get('/parking-lots/available-staff', { params: search ? { search } : {} });
    },
    updateManager: (parkingLotId: string, managerId: string | null): Promise<any> => {
        return axiosClient.put(`/parking-lots/${parkingLotId}`, { manager: managerId });
    },
    // Admin: Assign manager by email → upgrades user role to parking_manager + sends email
    assignManagerByEmail: (parkingLotId: string, email: string): Promise<any> => {
        return axiosClient.post(`/parking-lots/${parkingLotId}/assign-manager`, { email });
    },
    // Manager: Add staff by email → assigns user as staff to this building + sends email
    addStaffByEmail: (parkingLotId: string, email: string): Promise<any> => {
        return axiosClient.post(`/parking-lots/${parkingLotId}/add-staff`, { email });
    },
    // Admin/Manager: Resync totalSlots, availableSlots, occupiedSlots from actual slot data
    syncSlotCounts: (parkingLotId: string): Promise<any> => {
        return axiosClient.post(`/parking-lots/${parkingLotId}/sync-slots`);
    },
};

export default parkingLotService;
