import axiosClient from './axiosClient';

class WorkScheduleService {
  createOrUpdate(data: { parkingLotId: string, weekStartDate: string, shifts: any[] }) {
    return axiosClient.post('/work-schedules', data);
  }
  
  getMySchedules(parkingLotId?: string) {
    return axiosClient.get('/work-schedules/my', { params: { parkingLotId } });
  }
  
  getManagerSchedules(parkingLotId?: string) {
    return axiosClient.get('/work-schedules/manager', { params: { parkingLotId } });
  }
  
  updateStatus(id: string, status: string, managerNote?: string) {
    return axiosClient.put(`/work-schedules/${id}/status`, { status, managerNote });
  }
}

const workScheduleService = new WorkScheduleService();
export default workScheduleService;
