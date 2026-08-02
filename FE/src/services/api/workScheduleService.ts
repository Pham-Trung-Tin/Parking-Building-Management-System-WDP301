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

  requestLeave(id: string, data: { date: string, shiftType: string, leaveReason: string }) {
    return axiosClient.put(`/work-schedules/${id}/leave-request`, data);
  }

  assignStaffToShift(data: { parkingLotId: string, staffId: string, date: string, shiftType: string }) {
    return axiosClient.post('/work-schedules/assign', data);
  }
}

const workScheduleService = new WorkScheduleService();
export default workScheduleService;
