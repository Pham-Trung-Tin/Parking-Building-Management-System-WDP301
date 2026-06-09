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
}

const parkingLotService = {
    getParkingLots: (params?: GetParkingLotsParams): Promise<ParkingLot[] | any> => {
        return axiosClient.get('/parking-lots', { params });
    },
    getParkingLotById: (id: string): Promise<ParkingLot> => {
        return axiosClient.get(`/parking-lots/${id}`);
    },
};

export default parkingLotService;
