import axiosClient from './axiosClient';

export interface Zone {
    _id: string;
    name: string;
    code: string;
    floor: string;
    parkingLot: string;
    allowedVehicleTypes: string[];
    totalSlots: number;
    availableSlots: number;
    status: 'active' | 'inactive' | 'maintenance';
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetZonesParams {
    floor?: string;
    parkingLot?: string;
}

const zoneService = {
    getZones: (params?: GetZonesParams): Promise<Zone[]> => {
        return axiosClient.get('/zones', { params });
    },
};

export default zoneService;
