import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Check, X, Loader2, LogOut, Search, User, LogIn, Eye, AlertTriangle, Users, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { workScheduleService } from '../../services/api';
import useProfile from '../../hooks/useProfile';
import parkingLotService from '../../services/api/parkingLotService';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' }) {
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 text-sm px-5 py-3.5 rounded shadow-xl animate-fade-in-up ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
      {message}
    </div>
  );
}

const SHIFTS = [
  { id: 'morning', label: 'Morning (06:00 - 14:00)' },
  { id: 'afternoon', label: 'Afternoon (14:00 - 22:00)' },
  { id: 'night', label: 'Night (22:00 - 06:00)' },
];

export default function StaffWorkSchedulePage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, 1 = next week, etc.
  
  const [assignedLotId, setAssignedLotId] = useState<string | null>(null);
  
  const [scheduleData, setScheduleData] = useState<any>(null); // The loaded schedule for the selected week
  const [selectedShifts, setSelectedShifts] = useState<Record<string, string[]>>({}); // { 'YYYY-MM-DD': ['morning', 'night'] }
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Calculate week dates
  const weekStart = dayjs().isoWeekday(1).add(weekOffset, 'week');
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = weekStart.add(i, 'day');
    return {
      dateStr: d.format('YYYY-MM-DD'),
      displayDay: d.format('ddd'),
      displayDate: d.format('DD/MM'),
      isPast: d.isBefore(dayjs(), 'day')
    };
  });
  
  useEffect(() => {
    if (profile?.role === 'parking_manager' && profile?.assignedParkingLot) {
      const lotId = typeof profile.assignedParkingLot === 'string' 
        ? profile.assignedParkingLot 
        : profile.assignedParkingLot._id;
      setAssignedLotId(lotId as string);
    } else if (profile?.role === 'parking_staff') {
      // Find where staff is assigned
      parkingLotService.getParkingLots({ limit: 100, status: 'active' }).then((res: any) => {
        const lots = res.data || res;
        if (lots.length > 0) {
          setAssignedLotId(lots[0]._id);
        }
      }).catch(console.error);
    }
  }, [profile]);
  
  useEffect(() => {
    if (assignedLotId) {
      loadSchedule();
    }
  }, [assignedLotId, weekOffset]);
  
  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res: any = await workScheduleService.getMySchedules(assignedLotId!);
      const schedules = res.data || res;
      
      const targetWeekStr = weekStart.format('YYYY-MM-DD');
      const found = schedules.find((s: any) => s.weekStartDate.startsWith(targetWeekStr));
      
      if (found) {
        setScheduleData(found);
        // Build selectedShifts map
        const shiftsMap: Record<string, string[]> = {};
        found.shifts.forEach((sh: any) => {
          const d = sh.date.substring(0, 10);
          if (!shiftsMap[d]) shiftsMap[d] = [];
          shiftsMap[d].push(sh.shiftType);
        });
        setSelectedShifts(shiftsMap);
      } else {
        setScheduleData(null);
        setSelectedShifts({});
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load schedule', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleShiftToggle = (dateStr: string, shiftId: string) => {
    if (scheduleData && scheduleData.status !== 'pending') return; // Readonly if approved/rejected
    
    setSelectedShifts(prev => {
      const dayShifts = prev[dateStr] || [];
      if (dayShifts.includes(shiftId)) {
        return { ...prev, [dateStr]: dayShifts.filter(id => id !== shiftId) };
      } else {
        return { ...prev, [dateStr]: [...dayShifts, shiftId] };
      }
    });
  };
  
  const handleSave = async () => {
    if (!assignedLotId) return showToast('You are not assigned to a parking lot', 'error');
    
    const shiftsArr: any[] = [];
    Object.keys(selectedShifts).forEach(dateStr => {
      selectedShifts[dateStr].forEach(shiftType => {
        shiftsArr.push({ date: dateStr, shiftType });
      });
    });
    
    if (shiftsArr.length === 0) return showToast('Please select at least one shift', 'error');
    
    setLoading(true);
    try {
      await workScheduleService.createOrUpdate({
        parkingLotId: assignedLotId,
        weekStartDate: weekStart.format('YYYY-MM-DD'),
        shifts: shiftsArr
      });
      showToast('Work schedule registered successfully');
      loadSchedule();
    } catch (err: any) {
      showToast(err.message || 'Failed to save schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isReadonly = scheduleData && scheduleData.status !== 'pending';

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ParkingOps</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Staff Suite</p>
          </div>
          <nav className="mt-6 flex flex-col space-y-1">
            <Link to="/staff" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <LogIn className="w-5 h-5 mr-3 text-gray-400" />
              Entry
            </Link>
            <Link to="/staff/exit" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <LogOut className="w-5 h-5 mr-3 text-gray-400" />
              Exit
            </Link>
            <Link to="/staff/live-view" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <Eye className="w-5 h-5 mr-3 text-gray-400" />
              Live View
            </Link>
            <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
              Exceptions
            </Link>
            <Link to="/staff/assignments" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
              <Users className="w-5 h-5 mr-3 text-gray-400" />
              Assignments
            </Link>
            <div className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
              <Calendar className="w-5 h-5 mr-3 text-gray-900" />
              My Schedule
            </div>
          </nav>
        </div>
        <div className="p-6 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center text-sm font-bold text-gray-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Work Schedule Registration</h2>
            <p className="text-sm text-gray-500">Register your shifts for upcoming weeks</p>
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="px-4 py-1.5 text-sm font-medium rounded hover:bg-white hover:shadow-sm transition-all"
            >
              Previous Week
            </button>
            <div className="px-4 py-1.5 text-sm font-bold bg-white shadow-sm rounded">
              {weekStart.format('DD/MM/YYYY')} - {weekStart.add(6, 'day').format('DD/MM/YYYY')}
            </div>
            <button 
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="px-4 py-1.5 text-sm font-medium rounded hover:bg-white hover:shadow-sm transition-all"
            >
              Next Week
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {scheduleData && (
              <div className={`p-4 rounded-xl border flex items-start gap-4 ${
                scheduleData.status === 'approved' ? 'bg-green-50 border-green-200' :
                scheduleData.status === 'rejected' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="pt-1">
                  {scheduleData.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {scheduleData.status === 'rejected' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                  {scheduleData.status === 'pending' && <Clock className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${
                    scheduleData.status === 'approved' ? 'text-green-800' :
                    scheduleData.status === 'rejected' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    Status: {scheduleData.status}
                  </h3>
                  {scheduleData.managerNote && (
                    <p className={`text-sm mt-1 ${scheduleData.status === 'approved' ? 'text-green-700' : scheduleData.status === 'rejected' ? 'text-red-700' : 'text-blue-700'}`}>
                      Manager Note: {scheduleData.managerNote}
                    </p>
                  )}
                  {isReadonly && (
                    <p className="text-xs mt-2 opacity-70">You cannot edit this schedule because it has already been processed by the manager.</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 divide-x divide-gray-200">
                <div className="p-4 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shift</span>
                </div>
                {weekDays.map((d, i) => (
                  <div key={i} className="p-4 text-center flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-900">{d.displayDay}</span>
                    <span className="text-xs font-medium text-gray-500 mt-0.5">{d.displayDate}</span>
                  </div>
                ))}
              </div>
              
              <div className="divide-y divide-gray-200">
                {SHIFTS.map(shift => (
                  <div key={shift.id} className="grid grid-cols-8 divide-x divide-gray-200 hover:bg-gray-50/50 transition-colors">
                    <div className="p-4 flex items-center bg-gray-50/50">
                      <span className="text-xs font-bold text-gray-600">{shift.label}</span>
                    </div>
                    {weekDays.map((d, i) => {
                      const isSelected = (selectedShifts[d.dateStr] || []).includes(shift.id);
                      return (
                        <div 
                          key={i} 
                          onClick={() => !d.isPast && !isReadonly && handleShiftToggle(d.dateStr, shift.id)}
                          className={`p-4 flex items-center justify-center cursor-pointer transition-all ${
                            d.isPast ? 'bg-gray-100 opacity-50 cursor-not-allowed' :
                            isReadonly ? (isSelected ? 'bg-indigo-50 cursor-default' : 'cursor-default') :
                            isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {!isReadonly && (
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50 uppercase tracking-wider"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Submit Registration
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
