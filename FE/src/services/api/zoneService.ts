import axiosClient from './axiosClient';

export interface Zone {
    _id: string;
    name: string;
    code: string;
    floor: string | { _id: string; name: string; floorNumber: number };
    parkingLot: string | { _id: string; name: string; code: string };
    allowedVehicleTypes: string[] | any[];
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
    page?: number;
    limit?: number;
}

const zoneService = {
    getZones: (params?: GetZonesParams): Promise<any> => {
        return axiosClient.get('/zones', { params });
    },
    getZoneById: (id: string): Promise<Zone> => {
        return axiosClient.get(`/zones/${id}`);
    },
    createZone: (data: {
        floor: string;
        parkingLot: string;
        name: string;
        code: string;
        allowedVehicleTypes?: string[];
        totalSlots?: number;
    }): Promise<any> => {
        return axiosClient.post('/zones', data);
    },
    updateZone: (id: string, data: Partial<Zone>): Promise<any> => {
        return axiosClient.put(`/zones/${id}`, data);
    },
    deleteZone: (id: string): Promise<any> => {
        return axiosClient.delete(`/zones/${id}`);
    },
};

export default zoneService;
