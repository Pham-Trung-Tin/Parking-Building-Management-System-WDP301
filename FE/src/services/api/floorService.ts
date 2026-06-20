import axiosClient from './axiosClient';

export interface Floor {
    _id: string;
    name: string;
    floorNumber: number;
    floorType?: 'ground' | 'above_ground' | 'basement';
    vehicleType?: 'motorcycle' | 'car' | 'both';
    allowedVehicleTypes?: any[];
    totalSlots: number;
    availableSlots: number;
    occupiedSlots?: number;
    status: 'active' | 'inactive' | 'maintenance';
    parkingLot: string | { _id: string; name: string; code: string };
    description?: string;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface GetFloorsParams {
    parkingLot?: string;
    status?: 'active' | 'inactive' | 'maintenance';
    page?: number;
    limit?: number;
}

const floorService = {
    getFloors: (params?: GetFloorsParams): Promise<any> => {
        return axiosClient.get('/floors', { params });
    },
    getFloorById: (id: string): Promise<Floor> => {
        return axiosClient.get(`/floors/${id}`);
    },
    createFloor: (data: {
        parkingLot: string;
        floorNumber: number;
        name: string;
        floorType?: string;
        allowedVehicleTypes?: string[];
        description?: string;
    }): Promise<any> => {
        return axiosClient.post('/floors', data);
    },
    updateFloor: (id: string, data: Partial<Floor>): Promise<any> => {
        return axiosClient.put(`/floors/${id}`, data);
    },
    deleteFloor: (id: string): Promise<any> => {
        return axiosClient.delete(`/floors/${id}`);
    },
};

export default floorService;
