import axiosClient from './axiosClient';

export interface Floor {
    _id: string;
    name: string;
    floorNumber: number;
    vehicleType: 'motorcycle' | 'car' | 'both';
    totalSlots: number;
    availableSlots: number;
    status: 'active' | 'inactive' | 'maintenance';
    parkingLot: string;
}

export interface GetFloorsParams {
    parkingLot?: string;
    status?: 'active' | 'inactive' | 'maintenance';
}

const floorService = {
    getFloors: (params?: GetFloorsParams): Promise<Floor[]> => {
        return axiosClient.get('/floors', { params });
    },
};

export default floorService;
