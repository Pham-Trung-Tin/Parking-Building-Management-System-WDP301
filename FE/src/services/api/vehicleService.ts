import axiosClient from './axiosClient';

export interface Vehicle {
    _id: string;
    user: string;
    vehicleType: {
        _id: string;
        name: string;
        code: string;
        icon?: string;
        size: string;
        pricing: {
            dayBlockRate: number;
            nightBlockRate?: number;
            dailyRate: number;
            monthlyRate?: number;
        };
    } | string;
    licensePlate: string;
    vehicleModel?: string;
    vehicleColor?: string;
    vehicleBrand?: string;
    nickname?: string;
    isDefault: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface VehiclePayload {
    vehicleType: string;
    licensePlate: string;
    vehicleModel?: string;
    vehicleColor?: string;
    vehicleBrand?: string;
    nickname?: string;
    isDefault?: boolean;
}

export interface PaginatedResponse {
    data: {
        docs: Vehicle[];
        pagination: {
            page: number;
            limit: number;
            totalDocs: number;
            totalPages: number;
        };
    };
}

const vehicleService = {
    /** GET /vehicles — Lấy danh sách xe của user đang đăng nhập */
    getMyVehicles: (page = 1, limit = 20): Promise<any> => {
        return axiosClient.get(`/vehicles?page=${page}&limit=${limit}`);
    },

    /** GET /vehicles/:id — Chi tiết một xe */
    getById: (id: string): Promise<any> => {
        return axiosClient.get(`/vehicles/${id}`);
    },

    /** POST /vehicles — Thêm xe mới */
    addVehicle: (data: VehiclePayload): Promise<any> => {
        return axiosClient.post('/vehicles', data);
    },

    /** PUT /vehicles/:id — Cập nhật xe */
    updateVehicle: (id: string, data: Partial<VehiclePayload>): Promise<any> => {
        return axiosClient.put(`/vehicles/${id}`, data);
    },

    /** DELETE /vehicles/:id — Xoá xe */
    deleteVehicle: (id: string): Promise<any> => {
        return axiosClient.delete(`/vehicles/${id}`);
    },

    /** PATCH /vehicles/:id/default — Set xe mặc định */
    setDefault: (id: string): Promise<any> => {
        return axiosClient.patch(`/vehicles/${id}/default`);
    },

    /** GET /vehicles/default — Lấy xe mặc định */
    getDefaultVehicle: (): Promise<any> => {
        return axiosClient.get('/vehicles/default');
    },
};

export default vehicleService;
