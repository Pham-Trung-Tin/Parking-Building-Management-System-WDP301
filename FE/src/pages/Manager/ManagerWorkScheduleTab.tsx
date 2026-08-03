import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { workScheduleService } from '../../services/api';
import parkingLotService from '../../services/api/parkingLotService';
import { Loader2, Check, X, Calendar, AlertTriangle, MessageSquare, Eye, Settings, Building } from 'lucide-react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const SHIFTS = [
  { id: 'morning', label: 'Morning (06:00 - 14:00)' },
  { id: 'afternoon', label: 'Afternoon (14:00 - 22:00)' },
  { id: 'night', label: 'Night (22:00 - 06:00)' },
];

export default function ManagerWorkScheduleTab({ globalLotId, setGlobalLotId }: { globalLotId: string, setGlobalLotId?: any }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [lots, setLots] = useState<any[]>([]);
  const [buildingStaff, setBuildingStaff] = useState<any[]>([]);
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }, []);

  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotas, setQuotas] = useState({ morning: 2, afternoon: 2, night: 2 });
  const [savingQuotas, setSavingQuotas] = useState(false);

  const activeLot = useMemo(() => lots.find((l: any) => l._id === globalLotId), [lots, globalLotId]);
  useEffect(() => {
    if (activeLot && activeLot.settings?.shiftQuotas) {
      setQuotas(activeLot.settings.shiftQuotas);
    } else {
      setQuotas({ morning: 2, afternoon: 2, night: 2 });
    }
  }, [activeLot]);

  useEffect(() => {
    if (globalLotId) {
      parkingLotService.getStaff(globalLotId).then((res: any) => setBuildingStaff(res.data)).catch(console.error);
    }
  }, [globalLotId]);

  const handleSaveQuotas = async () => {
    if (!globalLotId) return;
    setSavingQuotas(true);
    try {
      await parkingLotService.updateParkingLot(globalLotId, { settings: { ...activeLot?.settings, shiftQuotas: quotas } });
      setLots(prev => prev.map(l => l._id === globalLotId ? { ...l, settings: { ...l.settings, shiftQuotas: quotas } } : l));
      setQuotaModalOpen(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSavingQuotas(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'leaves'>('overview');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [dateOffset, setDateOffset] = useState(0);

  const [dayDetailsModal, setDayDetailsModal] = useState<{ dateStr: string; displayDate: string } | null>(null);
  const [actionModal, setActionModal] = useState<{ id: string, shiftId?: string, bulk?: boolean, action: 'approved' | 'rejected' | 'published' | 'leave_approved', title: string } | null>(null);
  const [assignModal, setAssignModal] = useState<{ date: string, shiftType: string, label: string } | null>(null);
  const [detailsModal, setDetailsModal] = useState<any | null>(null);
  const [managerNote, setManagerNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  useEffect(() => {
    if (globalLotId) {
      loadSchedules();
      const interval = setInterval(() => loadSchedules(true), 10000); // Auto-refresh every 10s
      return () => clearInterval(interval);
    }
  }, [globalLotId]);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const res = await parkingLotService.getParkingLots({ limit: 100 });
        let data: any[] = res.data || res.docs || (Array.isArray(res) ? res : []);
        if (user?.role === 'parking_manager') {
          const raw = user?.assignedParkingLot;
          const ids: string[] = Array.isArray(raw)
            ? raw.map((v: any) => (v?._id?.toString?.() || v?.toString?.() || '')).filter(Boolean)
            : (raw ? [(raw as any)?._id?.toString?.() || raw?.toString?.() || ''].filter(Boolean) : []);
          if (ids.length > 0) data = data.filter((l: any) => ids.includes(l._id));
        }
        setLots(data);
      } catch (e) { }
    };
    fetchLots();
  }, []);

  const loadSchedules = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const res: any = await workScheduleService.getManagerSchedules(globalLotId);
      setSchedules(res.data || res);
    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load schedules');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await workScheduleService.updateStatus(actionModal.id, actionModal.action, managerNote, actionModal.shiftId, actionModal.bulk);
      setActionModal(null);
      setManagerNote('');
      loadSchedules();

      // also close/update detailsModal if open
      if (detailsModal) {
        setDetailsModal(null);
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!assignModal || !selectedStaffId || !globalLotId) return;
    setActionLoading(true);
    try {
      await workScheduleService.assignStaffToShift({
        parkingLotId: globalLotId,
        staffId: selectedStaffId,
        date: assignModal.date,
        shiftType: assignModal.shiftType
      });
      setAssignModal(null);
      setSelectedStaffId('');
      loadSchedules();
    } catch (err: any) {
      setError(err.message || 'Assign failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Date calculation based on mode
  const baseDate = viewMode === 'month'
    ? dayjs().startOf('month').add(dateOffset, 'month')
    : dayjs().isoWeekday(1).add(dateOffset, 'week');

  const monthYear = baseDate.format('YYYY-MM');

  const currentMonthSchedules = useMemo(() => {
    return schedules.filter(s => s.monthYear === monthYear && (s.status === 'approved' || s.status === 'published' || s.status === 'pending')); // Pending may have approved shifts
  }, [schedules, monthYear]);

  const getStaffForShift = (dateStr: string, shiftId: string) => {
    const assignedStaff: any[] = [];
    currentMonthSchedules.forEach(schedule => {
      const shift = schedule.shifts.find((s: any) => s.date.startsWith(dateStr) && s.shiftType === shiftId && (s.status === 'approved' || s.status === 'published' || s.status === 'leave_pending'));
      if (shift) {
        assignedStaff.push({ ...schedule.staff, shiftStatus: shift.status });
      }
    });
    return assignedStaff;
  };

  const getAvailableStaffForAssignment = (dateStr: string, shiftType: string) => {
    const busyStaffIds = new Set<string>();
    currentMonthSchedules.forEach(schedule => {
      const shift = schedule.shifts.find((s: any) => s.date.startsWith(dateStr) && s.shiftType === shiftType && s.status !== 'rejected');
      if (shift && schedule.staff?._id) {
        busyStaffIds.add(schedule.staff._id);
      }
    });
    return buildingStaff.filter(staff => !busyStaffIds.has(staff._id));
  };

  const leaveShifts = useMemo(() => {
    return schedules.flatMap(s =>
      s.shifts
        .filter((shift: any) => shift.status === 'leave_pending' || shift.status === 'leave_approved')
        .map((shift: any) => ({ ...shift, scheduleId: s._id, staff: s.staff }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [schedules]);

  if (!globalLotId) {
    return <div className="text-gray-500 py-10 text-center">Please select a parking lot in another tab first.</div>;
  }

  // Calendar Grid Generation
  const generateCalendarGrid = () => {
    let startOfGrid, endOfGrid;

    if (viewMode === 'month') {
      startOfGrid = baseDate.isoWeekday(1); // Monday of the first week of the month
      const endOfMonth = baseDate.endOf('month');
      endOfGrid = endOfMonth.isoWeekday(7); // Sunday of the last week of the month
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Work Schedules</h2>
            <p className="text-sm text-gray-500">Manage monthly staff schedules and approve shift requests</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Building selector — same design as BuildingsTab */}
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={globalLotId || ''}
                onChange={e => { if (setGlobalLotId) setGlobalLotId(e.target.value); }}
                disabled={lots.length <= 1}
                className={`pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px] transition-all appearance-none ${
                  lots.length <= 1 ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-300'
                }`}
              >
                {lots.map((l: any) => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>

            <button onClick={() => setQuotaModalOpen(true)} className="p-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-colors" title="Shift Quota Settings">
              <Settings className="w-5 h-5" />
            </button>

            <button onClick={() => loadSchedules()} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-colors uppercase tracking-wider flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              Refresh
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-gray-200 w-full mt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Monthly Overview
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'requests' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Registration Requests
            {schedules.filter(s => s.shifts.some((shift: any) => shift.status === 'pending')).length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {schedules.filter(s => s.shifts.some((shift: any) => shift.status === 'pending')).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'leaves' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Leave Requests
            {leaveShifts.filter(s => s.status === 'leave_pending').length > 0 && (
              <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {leaveShifts.filter(s => s.status === 'leave_pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">
                Coverage for {viewMode === 'month' ? baseDate.format('MMMM YYYY') : `Week of ${baseDate.format('MMM DD, YYYY')}`}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner">
                <button
                  onClick={() => { setViewMode('week'); setDateOffset(0); }}
                  className={`px-3 py-1 text-xs font-bold rounded transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Week
                </button>
                <button
                  onClick={() => { setViewMode('month'); setDateOffset(0); }}
                  className={`px-3 py-1 text-xs font-bold rounded transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Month
                </button>
              </div>

              <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-inner">
                <button
                  onClick={() => setDateOffset(prev => prev - 1)}
                  className="px-3 py-1 text-xs font-medium rounded hover:bg-white hover:shadow-sm transition-all text-gray-700"
                >
                  Previous
                </button>
                <div className="px-4 py-1 text-xs font-bold bg-white shadow-sm rounded text-gray-900 mx-1 border border-gray-200 min-w-[120px] text-center">
                  {viewMode === 'month'
                    ? baseDate.format('MMMM YYYY')
                    : `${baseDate.format('MMM DD')} - ${baseDate.add(6, 'day').format('MMM DD')}`}
                </div>
                <button
                  onClick={() => setDateOffset(prev => prev + 1)}
                  className="px-3 py-1 text-xs font-medium rounded hover:bg-white hover:shadow-sm transition-all text-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                return (
                  <div key={i}
                    onClick={() => {
                      if (viewMode === 'month') {
                        setDayDetailsModal({ dateStr: d.dateStr, displayDate: d.date.format('dddd, DD MMMM YYYY') });
                      }
                    }}
                    className={`bg-white ${viewMode === 'week' ? 'min-h-[250px]' : 'min-h-[100px] cursor-pointer hover:shadow-md hover:z-10 relative'} flex flex-col p-2 transition-all ${!d.isCurrentMonth ? 'opacity-50 bg-gray-50' :
                        d.isToday ? 'bg-blue-50/10 ring-1 ring-inset ring-blue-500' : 'hover:bg-gray-50'
                      }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-bold ${d.isToday ? 'text-white bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'
                        }`}>
                        {d.date.format('D')}
                      </span>
                    </div>

                    <div className={`flex-1 flex ${viewMode === 'week' ? 'flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar' : 'flex-col gap-1'}`}>
                      {SHIFTS.map(shiftInfo => {
                        const staffList = getStaffForShift(d.dateStr, shiftInfo.id);
                        const isMorning = shiftInfo.id === 'morning';
                        const isAfternoon = shiftInfo.id === 'afternoon';
                        const isNight = shiftInfo.id === 'night';

                        if (viewMode === 'month') {
                          // Compact view for Month
                          const isUncovered = staffList.length === 0;
                          return (
                            <div key={shiftInfo.id} className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-bold ${isUncovered
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : isMorning ? 'bg-sky-50 text-sky-700' : isAfternoon ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                              }`}>
                              <span className="uppercase">{shiftInfo.id[0]}</span>
                              <span>{staffList.length}</span>
                            </div>
                          );
                        }

                        // Detailed view for Week
                        return (
                          <div key={shiftInfo.id} className={`flex flex-col gap-1 p-2 rounded border ${isMorning ? 'bg-sky-50/50 border-sky-100' :
                              isAfternoon ? 'bg-amber-50/50 border-amber-100' :
                                'bg-indigo-50/50 border-indigo-100'
                            }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider truncate ${isMorning ? 'text-sky-700' : isAfternoon ? 'text-amber-700' : 'text-indigo-700'
                                }`}>
                                {shiftInfo.id}
                              </span>
                              <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap">{shiftInfo.label.match(/\(([^)]+)\)/)?.[1]}</span>
                            </div>

                            {staffList.length === 0 ? (
                              <div className="text-[10px] font-bold text-gray-400 bg-white p-1 rounded border border-gray-200 border-dashed text-center">Uncovered</div>
                            ) : (
                              <div className="flex flex-col gap-1 mt-1">
                                {staffList.map((staff, idx) => (
                                  <div key={idx} className={`text-[11px] font-bold p-1.5 rounded border-l-2 shadow-sm bg-white flex items-center gap-2 ${staff.shiftStatus === 'leave_pending' ? 'border-orange-400 text-orange-900 bg-orange-50 opacity-60' :
                                      isMorning ? 'border-sky-400 text-sky-900' :
                                        isAfternoon ? 'border-amber-400 text-amber-900' :
                                          'border-indigo-400 text-indigo-900'
                                    } truncate`} title={staff?.fullName}>
                                    <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white ${staff.shiftStatus === 'leave_pending' ? 'bg-orange-500' :
                                        isMorning ? 'bg-sky-500' : isAfternoon ? 'bg-amber-500' : 'bg-indigo-500'
                                      }`}>
                                      {(staff?.fullName || 'S')[0]}
                                    </div>
                                    <span className="truncate">{staff?.fullName || 'Unknown'} {staff.shiftStatus === 'leave_pending' && '(Leave Req)'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="animate-fade-in-up">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : schedules.length === 0 ? (
            <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">No schedules submitted for this lot yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schedules.map((schedule) => (
                <div key={schedule._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
                  <div className={`px-5 py-4 border-b flex justify-between items-center ${schedule.status === 'pending' ? 'bg-yellow-50 border-yellow-100' :
                      schedule.status === 'approved' ? 'bg-green-50 border-green-100' :
                        'bg-red-50 border-red-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-gray-800 shadow-sm border border-gray-100 text-lg">
                        {(schedule.staff?.fullName || 'S')[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{schedule.staff?.fullName || 'Unknown Staff'}</h3>
                        <p className="text-xs font-semibold text-gray-500">Month of {dayjs(schedule.monthYear).format('MMMM YYYY')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${schedule.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          schedule.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-red-100 text-red-800 border-red-200'
                        }`}>
                        {schedule.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col border-b border-gray-50">
                    <div className="flex-1 flex flex-col justify-center items-center gap-1.5 py-4 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                      <div className="text-3xl font-black text-gray-800">{schedule.shifts.length}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shifts Requested</div>
                      <button
                        onClick={() => setDetailsModal(schedule)}
                        className="mt-2 px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </div>

                    {schedule.managerNote && (
                      <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex gap-2 items-start mt-auto">
                        <MessageSquare className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-orange-900"><span className="font-bold uppercase tracking-wider">Note:</span> {schedule.managerNote}</p>
                      </div>
                    )}
                  </div>

                  {schedule.shifts.some((s: any) => s.status === 'pending') && (
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 mt-auto">
                      <button
                        onClick={() => setActionModal({ id: schedule._id, bulk: true, action: 'approved', title: 'Approve All Pending' })}
                        className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <Check className="w-4 h-4" /> Bulk Approve
                      </button>
                    </div>
                  )}
                  {schedule.status === 'approved' && !schedule.shifts.some((s: any) => s.status === 'pending') && (
                    <div className="px-5 py-4 bg-blue-50 border-t border-blue-100 flex justify-end gap-3 mt-auto">
                      <button
                        onClick={() => setActionModal({ id: schedule._id, bulk: true, action: 'published', title: 'Publish Schedule' })}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <Calendar className="w-4 h-4" /> Publish
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="animate-fade-in-up">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : leaveShifts.length === 0 ? (
            <div className="py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">No leave requests.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaveShifts.map((shift, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
                  <div className={`px-5 py-4 border-b flex justify-between items-center ${shift.status === 'leave_pending' ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-gray-800 shadow-sm border border-gray-100 text-lg">
                        {(shift.staff?.fullName || 'S')[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{shift.staff?.fullName || 'Unknown Staff'}</h3>
                        <p className="text-xs font-semibold text-gray-500">{shift.date}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${shift.status === 'leave_pending' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-gray-200 text-gray-700 border-gray-300'
                      }`}>
                      {shift.status === 'leave_pending' ? 'PENDING' : 'APPROVED'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-gray-700 uppercase">{SHIFTS.find(s => s.id === shift.shiftType)?.label}</span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex gap-2 items-start text-sm text-gray-700 mb-4 flex-1">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold block text-xs uppercase tracking-wider text-gray-500 mb-0.5">Reason:</span>
                        {shift.leaveReason || 'No reason provided.'}
                      </div>
                    </div>
                  </div>

                  {shift.status === 'leave_pending' && (
                    <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 mt-auto">
                      <button
                        onClick={() => setActionModal({ id: shift.scheduleId, shiftId: shift._id, action: 'approved', title: 'Reject Leave (Revert to Approved)' })}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-bold rounded-lg transition-colors shadow-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setActionModal({ id: shift.scheduleId, shiftId: shift._id, action: 'leave_approved', title: 'Approve Leave' })}
                        className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActionModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up m-4">
            <h2 className="text-xl font-black text-gray-900 mb-2">{actionModal.title}</h2>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to {actionModal.action === 'approved' ? 'approve' : 'reject'} this schedule?</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Add a note (optional)
                </label>
                <textarea
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 outline-none transition-shadow"
                  rows={3}
                  placeholder="Explain why you are approving/rejecting..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setActionModal(null)}
                  className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`px-5 py-2.5 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${actionModal.action === 'approved' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Details Modal */}
      {detailsModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailsModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-fade-in-up m-4 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-black text-gray-800 text-lg shadow-sm">
                  {(detailsModal.staff?.fullName || 'S')[0]}
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">{detailsModal.staff?.fullName}'s Request</h2>
                  <p className="text-sm text-gray-500">Month of {dayjs(detailsModal.monthYear).format('MMMM YYYY')}</p>
                </div>
              </div>
              <button onClick={() => setDetailsModal(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white custom-scrollbar">
              {(() => {
                const weeks: any = {};
                detailsModal.shifts.forEach((s: any) => {
                  const week = dayjs(s.date).isoWeek();
                  if (!weeks[week]) weeks[week] = 0;
                  weeks[week]++;
                });
                const hasOvertimeWarning = Object.values(weeks).some((count: any) => count > 6);

                return (
                  <div className="space-y-4">
                    {hasOvertimeWarning && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm font-medium mb-4">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Warning: This staff has registered for more than 6 shifts in a single week.
                      </div>
                    )}

                    {Object.entries(
                      detailsModal.shifts.reduce((acc: any, curr: any) => {
                        if (!acc[curr.date]) acc[curr.date] = [];
                        acc[curr.date].push(curr);
                        return acc;
                      }, {})
                    ).sort((a: any, b: any) => a[0].localeCompare(b[0])).map(([date, shifts]: any) => (
                      <div key={date} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-3 hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 text-gray-700 w-12 h-12 flex flex-col items-center justify-center rounded-lg font-black leading-none shrink-0">
                            <span className="text-xs uppercase text-gray-500">{dayjs(date).format('ddd')}</span>
                            <span className="text-lg mt-0.5">{dayjs(date).format('DD')}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-600">{dayjs(date).format('MM YYYY')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1 justify-end">
                          {shifts.map((shift: any) => {
                            const shiftInfo = SHIFTS.find(s => s.id === shift.shiftType);
                            return (
                              <div key={shift._id} className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg border shadow-sm ${shift.shiftType === 'morning' ? 'bg-sky-50 border-sky-200' :
                                  shift.shiftType === 'afternoon' ? 'bg-amber-50 border-amber-200' :
                                    'bg-indigo-50 border-indigo-200'
                                }`}>
                                <div className="flex flex-col">
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${shift.shiftType === 'morning' ? 'text-sky-700' : shift.shiftType === 'afternoon' ? 'text-amber-700' : 'text-indigo-700'
                                    }`}>{shiftInfo?.id}</span>
                                  <span className="text-[9px] font-semibold text-gray-500 mt-0.5">{shiftInfo?.label.match(/\(([^)]+)\)/)?.[1]}</span>
                                </div>

                                {shift.status === 'pending' ? (
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => setActionModal({ id: detailsModal._id, shiftId: shift._id, action: 'approved', title: 'Approve Shift' })} className="p-1 bg-green-100 text-green-700 hover:bg-green-200 rounded">
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => setActionModal({ id: detailsModal._id, shiftId: shift._id, action: 'rejected', title: 'Reject Shift' })} className="p-1 bg-red-100 text-red-700 hover:bg-red-200 rounded">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${shift.status === 'approved' ? 'bg-green-100 text-green-700' :
                                      shift.status === 'published' ? 'bg-blue-100 text-blue-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {shift.status}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Day Details Modal */}
      {dayDetailsModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDayDetailsModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up m-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">Shift Details</h2>
                <p className="text-sm text-gray-500">{dayDetailsModal.displayDate}</p>
              </div>
              <button onClick={() => setDayDetailsModal(null)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {SHIFTS.map(shiftInfo => {
                const staffList = getStaffForShift(dayDetailsModal.dateStr, shiftInfo.id);
                const isMorning = shiftInfo.id === 'morning';
                const isAfternoon = shiftInfo.id === 'afternoon';

                return (
                  <div key={shiftInfo.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                      <span className={`text-sm font-black uppercase tracking-wider ${isMorning ? 'text-sky-700' : isAfternoon ? 'text-amber-700' : 'text-indigo-700'
                        }`}>
                        {shiftInfo.label.split(' ')[0]}
                      </span>
                      <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                        {shiftInfo.label.match(/\(([^)]+)\)/)?.[1]}
                      </span>
                    </div>

                    {staffList.length === 0 ? (
                      <div className="text-xs font-bold text-gray-400 bg-white p-3 rounded-lg border border-gray-200 border-dashed text-center">
                        No staff assigned
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {staffList.map((staff, idx) => (
                          <div key={idx} className={`text-xs font-bold p-2.5 rounded-lg border-l-4 shadow-sm bg-white flex items-center gap-3 ${staff.shiftStatus === 'leave_pending' ? 'border-orange-400 text-orange-900 bg-orange-50 opacity-60' :
                              isMorning ? 'border-sky-400 text-sky-900' :
                                isAfternoon ? 'border-amber-400 text-amber-900' :
                                  'border-indigo-400 text-indigo-900'
                            }`}>
                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white ${staff.shiftStatus === 'leave_pending' ? 'bg-orange-500' :
                                isMorning ? 'bg-sky-500' : isAfternoon ? 'bg-amber-500' : 'bg-indigo-500'
                              }`}>
                              {(staff?.fullName || 'S')[0]}
                            </div>
                            <span className="truncate" title={staff?.fullName}>{staff?.fullName || 'Unknown'} {staff.shiftStatus === 'leave_pending' && '(Leave)'}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {staffList.length < (quotas[shiftInfo.id as keyof typeof quotas] || 2) && (
                      <button
                        onClick={() => setAssignModal({ date: dayDetailsModal.dateStr, shiftType: shiftInfo.id, label: shiftInfo.label })}
                        className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-100 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        + Assign Staff
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Quota Settings Modal */}
      {quotaModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQuotaModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up m-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">Shift Quotas</h2>
                <p className="text-sm text-gray-500">Max number of staff allowed per shift</p>
              </div>
              <button onClick={() => setQuotaModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Morning Shift</span>
                  <input type="number" min="1" value={quotas.morning} onChange={(e) => setQuotas(prev => ({ ...prev, morning: parseInt(e.target.value) || 1 }))} className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center text-sm font-bold" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Afternoon Shift</span>
                  <input type="number" min="1" value={quotas.afternoon} onChange={(e) => setQuotas(prev => ({ ...prev, afternoon: parseInt(e.target.value) || 1 }))} className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center text-sm font-bold" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Night Shift</span>
                  <input type="number" min="1" value={quotas.night} onChange={(e) => setQuotas(prev => ({ ...prev, night: parseInt(e.target.value) || 1 }))} className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-center text-sm font-bold" />
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                If the quota is reached, staff members will not be able to register for that shift. This limits the total number of registrations across all staff.
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveQuotas}
                  disabled={savingQuotas}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-2 uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50"
                >
                  {savingQuotas && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Quotas
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Assign Modal */}
      {assignModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up m-4">
            <h2 className="text-xl font-black text-gray-900 mb-2">Assign Staff</h2>
            <p className="text-sm text-gray-500 mb-6">Assign a staff member to the {assignModal.label} shift on {assignModal.date}.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Staff
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                >
                  <option value="">-- Choose Staff --</option>
                  {getAvailableStaffForAssignment(assignModal.date, assignModal.shiftType).map(staff => (
                    <option key={staff._id} value={staff._id}>{staff.fullName} ({staff.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setAssignModal(null)}
                  className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignStaff}
                  disabled={actionLoading || !selectedStaffId}
                  className="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Assign Shift
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
