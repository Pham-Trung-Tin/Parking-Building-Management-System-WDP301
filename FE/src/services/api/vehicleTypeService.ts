import axiosClient from './axiosClient';

export interface VehicleTypePricing {
    dayBlockRate: number;      // Backend field — giá 1 block 4 tiếng (ban ngày)
    nightBlockRate?: number;   // Backend field — giá block ban đêm (nếu có)
    dailyRate: number;
    monthlyRate?: number;
    overtimeMultiplier?: number;
    // Legacy fallback (some older records might have this)
    hourlyRate?: number;
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
    /** GET /vehicle-types — List all active vehicle types */
    getAll: (): Promise<VehicleType[]> => {
        return axiosClient.get('/vehicle-types');
    },

    /** GET /vehicle-types/:id */
    getById: (id: string): Promise<VehicleType> => {
        return axiosClient.get(`/vehicle-types/${id}`);
    },

    /** POST /vehicle-types — system_admin only */
    create: (data: {
        name: string;
        code: string;
        size: string;
        pricing: VehicleTypePricing;
        description?: string;
        icon?: string;
    }): Promise<any> => {
        return axiosClient.post('/vehicle-types', data);
    },

    /** PUT /vehicle-types/:id — system_admin only */
    update: (id: string, data: Partial<VehicleType>): Promise<any> => {
        return axiosClient.put(`/vehicle-types/${id}`, data);
    },

    /** DELETE /vehicle-types/:id — system_admin only */
    delete: (id: string): Promise<any> => {
        return axiosClient.delete(`/vehicle-types/${id}`);
    },
};

export default vehicleTypeService;
