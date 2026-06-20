import axiosClient from './axiosClient';

export interface IncidentParams {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  type?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  parkingLot?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface IncidentCreateData {
  parkingLot: string;
  type: string;
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  parkingSession?: string;
  slot?: string;
}

export interface IncidentResolveData {
  description: string;
  extraCharge?: number;
}

const incidentService = {
  getAll: (params?: IncidentParams): Promise<any> => {
    return axiosClient.get('/incidents', { params });
  },

  getById: (id: string): Promise<any> => {
    return axiosClient.get(`/incidents/${id}`);
  },

  create: (data: IncidentCreateData): Promise<any> => {
    return axiosClient.post('/incidents', data);
  },

  update: (id: string, data: any): Promise<any> => {
    return axiosClient.put(`/incidents/${id}`, data);
  },

  resolve: (id: string, data: IncidentResolveData): Promise<any> => {
    return axiosClient.patch(`/incidents/${id}/resolve`, data);
  },

  assign: (id: string, assigneeId: string): Promise<any> => {
    return axiosClient.patch(`/incidents/${id}/assign`, { assigneeId });
  },
};

export default incidentService;
