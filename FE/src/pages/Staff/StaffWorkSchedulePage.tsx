import React, { useState, useEffect, useMemo } from 'react';
import { workScheduleService } from '../../services/api';
import useProfile from '../../hooks/useProfile';
import { Loader2, Check, Calendar, LogOut, CheckCircle2, AlertTriangle, Clock, MapPin, Search } from 'lucide-react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Video, AlertCircle, User, Users, LogIn, Eye, LayoutGrid } from 'lucide-react';

dayjs.extend(isoWeek);

const SHIFTS = [
  { id: 'morning', label: 'Morning (06:00 - 14:00)' },
  { id: 'afternoon', label: 'Afternoon (14:00 - 22:00)' },
  { id: 'night', label: 'Night (22:00 - 06:00)' },
];

export default function StaffWorkSchedulePage() {
  const { profile, logout } = useProfile();
  const navigate = useNavigate();
  const [allMySchedules, setAllMySchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'view' | 'register'>('view');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [dateOffset, setDateOffset] = useState(0);

  // Registration State
  const [selectedShifts, setSelectedShifts] = useState<{ [dateStr: string]: string[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMySchedules();
  }, []);

  const loadMySchedules = async () => {
    setLoading(true);
    try {
      const res: any = await workScheduleService.getMySchedules();
      setAllMySchedules(res.data || res);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Date calculation based on mode
  const baseDate = viewMode === 'month' 
    ? dayjs().startOf('month').add(dateOffset, 'month')
    : dayjs().isoWeekday(1).add(dateOffset, 'week');
  
  const monthYear = baseDate.format('YYYY-MM');

  const scheduleData = useMemo(() => {
    return allMySchedules.find(s => s.monthYear === monthYear);
  }, [allMySchedules, monthYear]);

  const isReadonly = scheduleData && scheduleData.status !== 'pending';

  // Initialize selectedShifts when scheduleData changes or month changes
  useEffect(() => {
    if (scheduleData) {
      const map: { [key: string]: string[] } = {};
      scheduleData.shifts.forEach((s: any) => {
        if (!map[s.date]) map[s.date] = [];
        map[s.date].push(s.shiftType);
      });
      setSelectedShifts(map);
    } else {
      setSelectedShifts({});
    }
  }, [scheduleData, baseDate.format('YYYY-MM')]);

  const handleShiftToggle = (dateStr: string, shiftId: string) => {
    if (isReadonly) return;
    setSelectedShifts(prev => {
      const current = prev[dateStr] || [];
      const updated = current.includes(shiftId) 
        ? current.filter(id => id !== shiftId)
        : [...current, shiftId];
      return { ...prev, [dateStr]: updated };
    });
  };

  const handleSave = async () => {
    const raw = profile?.assignedParkingLot;
    const lotId = Array.isArray(raw)
      ? (raw as any[]).filter(Boolean).map((v: any) => v?._id || v)[0]
      : (typeof raw === 'string' ? raw : (raw as any)?._id);

    if (!lotId) {
      setError('You are not assigned to any parking lot');
      return;
    }
    setIsSubmitting(true);
    try {
      const shiftsToSave: any[] = [];
      Object.entries(selectedShifts).forEach(([date, shifts]) => {
        shifts.forEach(shiftType => {
          shiftsToSave.push({ date, shiftType });
        });
      });

      await workScheduleService.createOrUpdate({
        parkingLotId: lotId,
        monthYear,
        shifts: shiftsToSave
      });
      await loadMySchedules();
      setActiveTab('view');
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar Grid Generation
  const generateCalendarGrid = () => {
    let startOfGrid, endOfGrid;
    
    if (viewMode === 'month') {
      startOfGrid = baseDate.isoWeekday(1); // Monday of the first week
      const endOfMonth = baseDate.endOf('month');
      endOfGrid = endOfMonth.isoWeekday(7); // Sunday of the last week
    } else {
      startOfGrid = baseDate.isoWeekday(1);
      endOfGrid = baseDate.isoWeekday(7);
    }
    
    const days = [];
    let current = startOfGrid;
    while (current.isBefore(endOfGrid) || current.isSame(endOfGrid, 'day')) {
      days.push({
        date: current,
        dateStr: current.format('YYYY-MM-DD'),
        isCurrentMonth: viewMode === 'month' ? current.month() === baseDate.month() : true,
        isPast: current.isBefore(dayjs(), 'day'),
        isToday: current.isSame(dayjs(), 'day'),
      });
      current = current.add(1, 'day');
    }
    return days;
  };

  const calendarDays = generateCalendarGrid();
  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const shiftCountInView = scheduleData 
    ? scheduleData.shifts.filter((s: any) => calendarDays.some(d => s.date.startsWith(d.dateStr))).length 
    : 0;

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 z-20">
        <div>
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ParkingOps</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Staff Suite</p>
          </div>

          <nav className="mt-6 flex flex-col space-y-1">
            {(profile?.role === 'parking_manager' || (profile?.role === 'parking_staff' && profile?.assignedParkingLot)) && (
              <>
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
                <Link to="/staff/manage-slots" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <LayoutGrid className="w-5 h-5 mr-3 text-gray-400" />
                  Manage Slots
                </Link>
                <Link to="/staff/exceptions" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                  <AlertTriangle className="w-5 h-5 mr-3 text-gray-400" />
                  Exceptions
                </Link>
                <Link to="/staff/schedule" className="flex items-center px-6 py-3 bg-gray-50 border-r-4 border-gray-900 text-gray-900 font-medium w-full text-left">
                  <Calendar className="w-5 h-5 mr-3 text-gray-700" />
                  My Schedule
                </Link>
              </>
            )}
            {profile?.role !== 'parking_manager' && (
              <Link to="/staff/profile" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                <User className="w-5 h-5 mr-3 text-gray-400" />
                My Profile
              </Link>
            )}
            {profile?.role === 'parking_manager' && (
              <Link to="/admin/staff-assignment" className="flex items-center px-6 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left">
                <Users className="w-5 h-5 mr-3 text-gray-400" />
                Staff Assignment
              </Link>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white mr-3 shrink-0 overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="overflow-hidden pr-2">
              <p className="text-sm font-semibold text-gray-900 truncate" title={profile?.fullName}>{profile?.fullName || 'Loading...'}</p>
              <p className="text-[10px] text-gray-500 uppercase truncate">{profile?.role ? profile.role.replace('_', ' ') : 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex flex-col shrink-0 gap-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-xl font-bold text-gray-900">My Schedule</h2>
              <p className="text-sm text-gray-500">View and manage your monthly work schedules</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner">
                <button 
                  onClick={() => { setViewMode('week'); setDateOffset(0); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Week
                </button>
                <button 
                  onClick={() => { setViewMode('month'); setDateOffset(0); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Month
                </button>
              </div>

              <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner">
                <button 
                  onClick={() => setDateOffset(prev => prev - 1)}
                  className="px-4 py-1.5 text-sm font-medium rounded hover:bg-white hover:shadow-sm transition-all text-gray-700"
                >
                  Previous
                </button>
                <div className="px-4 py-1.5 text-sm font-bold bg-white shadow-sm rounded text-gray-900 mx-1 border border-gray-200 min-w-[140px] text-center">
                  {viewMode === 'month' 
                    ? baseDate.format('MMMM YYYY') 
                    : `${baseDate.format('MMM DD')} - ${baseDate.add(6, 'day').format('MMM DD')}`}
                </div>
                <button 
                  onClick={() => setDateOffset(prev => prev + 1)}
                  className="px-4 py-1.5 text-sm font-medium rounded hover:bg-white hover:shadow-sm transition-all text-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 border-b border-gray-200 w-full mt-2">
            <button 
              onClick={() => setActiveTab('view')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'view' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              My Overview
            </button>
            <button 
              onClick={() => setActiveTab('register')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'register' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Register Shifts
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm">{error}</div>}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-gray-200 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {viewMode === 'month' ? `Month of ${baseDate.format('MMMM YYYY')}` : `Week of ${baseDate.format('MMM DD, YYYY')}`}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                    Registration Status: 
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      !scheduleData ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                      scheduleData.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                      scheduleData.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                      'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {!scheduleData ? 'Not Registered' : scheduleData.status}
                    </span>
                  </p>
                  
                  {activeTab === 'view' && (
                    <div className="mt-2.5">
                      {shiftCountInView > 0 ? (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                          You have {shiftCountInView} assigned shift{shiftCountInView !== 1 ? 's' : ''} this {viewMode}.
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                          You have no assigned shifts this {viewMode}.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {scheduleData && scheduleData.managerNote && (
                <div className="bg-orange-50 border border-orange-200 px-4 py-3 rounded-lg max-w-md w-full shadow-sm">
                  <p className="text-sm text-orange-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <span><strong>Manager Note:</strong> {scheduleData.managerNote}</span>
                  </p>
                </div>
              )}
            </div>

            {isReadonly && activeTab === 'register' && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                This schedule has already been {scheduleData.status} and cannot be modified.
              </div>
            )}

            {/* Monthly Calendar Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {weekDayLabels.map((lbl, idx) => (
                  <div key={idx} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-widest border-r border-gray-200 last:border-r-0">
                    {lbl}
                  </div>
                ))}
              </div>
              
              {/* Calendar Cells */}
              <div className="grid grid-cols-7 bg-gray-200 gap-px">
                {calendarDays.map((d, i) => {
                  const dayShifts = scheduleData ? scheduleData.shifts.filter((s:any) => s.date.startsWith(d.dateStr)).map((s:any) => s.shiftType) : [];
                  
                  return (
                    <div key={i} className={`bg-white ${viewMode === 'week' ? 'min-h-[200px]' : 'min-h-[120px]'} flex flex-col p-2 transition-colors ${
                      !d.isCurrentMonth ? 'opacity-40 bg-gray-50' : 
                      d.isToday ? 'bg-blue-50/20 ring-1 ring-inset ring-blue-500' : 'hover:bg-gray-50/50'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-bold ${
                          d.isToday ? 'text-white bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'
                        }`}>
                          {d.date.format('D')}
                        </span>
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-1.5">
                        {activeTab === 'view' ? (
                          /* View Mode */
                          dayShifts.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-50">Off</div>
                          ) : (
                            dayShifts.map((shiftType: string) => {
                              const shiftInfo = SHIFTS.find(s => s.id === shiftType);
                              return (
                                <div key={shiftType} className={`px-2 py-1 rounded border shadow-sm flex flex-col ${
                                  shiftType === 'morning' ? 'bg-sky-50 border-sky-100 text-sky-800' :
                                  shiftType === 'afternoon' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                  'bg-indigo-50 border-indigo-100 text-indigo-800'
                                }`}>
                                  <span className={`font-black uppercase truncate ${viewMode === 'week' ? 'text-xs' : 'text-[10px]'}`}>
                                    {shiftInfo?.label.split(' ')[0]}
                                  </span>
                                  {viewMode === 'week' && (
                                    <span className="text-[10px] font-semibold opacity-70 truncate">{shiftInfo?.label.match(/\(([^)]+)\)/)?.[1]}</span>
                                  )}
                                </div>
                              );
                            })
                          )
                        ) : (
                          /* Register Mode */
                          d.isCurrentMonth && !d.isPast ? (
                            SHIFTS.map(shiftInfo => {
                              const isSelected = (selectedShifts[d.dateStr] || []).includes(shiftInfo.id);
                              return (
                                <div 
                                  key={shiftInfo.id}
                                  onClick={() => handleShiftToggle(d.dateStr, shiftInfo.id)}
                                  className={`px-2 py-1.5 rounded border text-[10px] font-bold cursor-pointer transition-all flex items-center justify-between ${
                                    isReadonly 
                                      ? (isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700 cursor-default' : 'bg-gray-50 border-gray-100 text-gray-400 cursor-default opacity-50')
                                      : isSelected 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                                  }`}
                                  title={shiftInfo.label}
                                >
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="uppercase truncate">{shiftInfo.label.split(' ')[0]}</span>
                                    <span className={`text-[9px] font-semibold whitespace-nowrap ${
                                      isSelected 
                                        ? (isReadonly ? 'text-indigo-500' : 'text-blue-200') 
                                        : 'text-gray-400'
                                    }`}>
                                      {shiftInfo?.label.match(/\(([^)]+)\)/)?.[1]}
                                    </span>
                                  </div>
                                  {isSelected && <Check className={`w-3 h-3 shrink-0 ${isReadonly ? 'text-indigo-600' : 'text-white'}`} />}
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase tracking-widest bg-gray-50 rounded border border-gray-100 border-dashed">
                              {d.isPast ? 'Past' : ''}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeTab === 'register' && !isReadonly && (
              <div className="flex justify-end pt-4 pb-12">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="bg-gray-900 text-white px-8 py-4 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-all hover:shadow-lg disabled:opacity-50 uppercase tracking-wider"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Submit Monthly Registration
                </button>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
