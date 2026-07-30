import React, { useState, useEffect } from 'react';
import { workScheduleService } from '../../services/api';
import { Loader2, Check, X, Calendar, AlertTriangle, MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';

export default function ManagerWorkScheduleTab({ globalLotId }: { globalLotId: string }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [actionModal, setActionModal] = useState<{ id: string, action: 'approved' | 'rejected', title: string } | null>(null);
  const [managerNote, setManagerNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (globalLotId) loadSchedules();
  }, [globalLotId]);

  const loadSchedules = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await workScheduleService.getManagerSchedules(globalLotId);
      setSchedules(res.data || res);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await workScheduleService.updateStatus(actionModal.id, actionModal.action, managerNote);
      setActionModal(null);
      setManagerNote('');
      loadSchedules();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (!globalLotId) {
    return <div className="text-gray-500 py-10 text-center">Please select a parking lot in another tab first.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Staff Work Schedules</h2>
          <p className="text-sm text-gray-500">Review and approve staff schedule registrations</p>
        </div>
        <button onClick={loadSchedules} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
          Refresh
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : schedules.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No schedules submitted for this lot yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {schedules.map((schedule) => (
            <div key={schedule._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className={`px-5 py-4 border-b flex justify-between items-center ${
                schedule.status === 'pending' ? 'bg-yellow-50 border-yellow-100' :
                schedule.status === 'approved' ? 'bg-green-50 border-green-100' :
                'bg-red-50 border-red-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-gray-800 shadow-sm border border-gray-100">
                    {(schedule.staff?.fullName || 'S')[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{schedule.staff?.fullName || 'Unknown Staff'}</h3>
                    <p className="text-xs text-gray-500">Week starting: {dayjs(schedule.weekStartDate).format('DD MMM YYYY')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                    schedule.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    schedule.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                    'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {schedule.status}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Requested Shifts</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {schedule.shifts.map((s: any, i: number) => (
                    <div key={i} className="flex flex-col bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="text-xs font-medium text-gray-500">{dayjs(s.date).format('ddd, DD/MM')}</span>
                      <span className="text-sm font-bold text-indigo-700 capitalize">{s.shiftType}</span>
                    </div>
                  ))}
                </div>
                
                {schedule.managerNote && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex gap-2 items-start">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-700"><span className="font-semibold">Note:</span> {schedule.managerNote}</p>
                  </div>
                )}
              </div>
              
              {schedule.status === 'pending' && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                  <button 
                    onClick={() => setActionModal({ id: schedule._id, action: 'rejected', title: 'Reject Schedule' })}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button 
                    onClick={() => setActionModal({ id: schedule._id, action: 'approved', title: 'Approve Schedule' })}
                    className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActionModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{actionModal.title}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add a note (optional)</label>
                <textarea 
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                  rows={3}
                  placeholder="Explain why you are approving/rejecting..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    actionModal.action === 'approved' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
