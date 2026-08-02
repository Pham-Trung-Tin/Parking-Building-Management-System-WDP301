import axiosClient from './axiosClient';

class WorkScheduleService {
  createOrUpdate(data: { parkingLotId: string, monthYear: string, shifts: any[] }) {
    return axiosClient.post('/work-schedules', data);
  }
  
  getMySchedules(parkingLotId?: string) {
    return axiosClient.get('/work-schedules/my', { params: { parkingLotId } });
  }
  
  getManagerSchedules(parkingLotId?: string) {
    return axiosClient.get('/work-schedules/manager', { params: { parkingLotId } });
  }

  getAvailability(parkingLotId: string, monthYear: string) {
    return axiosClient.get('/work-schedules/availability', { params: { parkingLotId, monthYear } });
  }
  
  updateStatus(id: string, status: string, managerNote?: string, shiftId?: string, bulk?: boolean) {
    return axiosClient.put(`/work-schedules/${id}/status`, { status, managerNote, shiftId, bulk });
  }
}

const workScheduleService = new WorkScheduleService();
export default workScheduleService;
