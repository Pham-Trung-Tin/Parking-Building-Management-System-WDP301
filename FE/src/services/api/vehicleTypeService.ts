import axiosClient from './axiosClient';

export interface VehicleTypePricing {
    hourlyRate: number;
    dailyRate: number;
    monthlyRate?: number;
    overtimeMultiplier?: number;
}

export interface VehicleType {
    _id: string;
    name: string;
    code: string;
    description?: string;
    icon?: string;
    size: 'small' | 'medium' | 'large' | 'extra_large';
    pricing: VehicleTypePricing;
    isActive: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const vehicleTypeService = {
    /** GET /vehicle-types — Lấy danh sách tất cả loại phương tiện đang hoạt động */
    getAll: (): Promise<VehicleType[]> => {
        return axiosClient.get('/vehicle-types');
    },

    /** GET /vehicle-types/:id — Chi tiết một loại phương tiện */
    getById: (id: string): Promise<VehicleType> => {
        return axiosClient.get(`/vehicle-types/${id}`);
    },
};

export default vehicleTypeService;
