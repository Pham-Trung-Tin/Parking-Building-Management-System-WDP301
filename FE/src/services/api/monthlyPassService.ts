import axiosClient from './axiosClient';

export interface MonthlyPass {
  id: string;
  passCode: string;
  user: any; // User details
  parkingLot: any;
  vehicleType: any;
  licensePlate: string;
  startDate: string;
  endDate: string;
  price: number;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  qrCode?: string;
  qrCodeData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMonthlyPassPayload {
  parkingLotId: string;
  vehicleTypeId: string;
  licensePlate: string;
  startDate: string;
  months: number;
}

const monthlyPassService = {
  // User endpoints
  createMonthlyPass: async (data: CreateMonthlyPassPayload) => {
    return axiosClient.post('/monthly-passes/my-passes', data);
  },

  getMyMonthlyPasses: async () => {
    return axiosClient.get<{ status: string; data: MonthlyPass[] }>('/monthly-passes/my-passes');
  },

  // Admin/Staff endpoints
  getAllMonthlyPasses: async (params?: any) => {
    return axiosClient.get<{ status: string; data: MonthlyPass[] }>('/monthly-passes', { params });
  },

  // Shared
  getMonthlyPassById: async (id: string) => {
    return axiosClient.get<{ status: string; data: MonthlyPass }>(`/monthly-passes/${id}`);
  },

  changeVehicle: async (id: string, newLicensePlate: string) => {
    return axiosClient.patch(`/monthly-passes/${id}/change-vehicle`, { licensePlate: newLicensePlate });
  },
};

export default monthlyPassService;
