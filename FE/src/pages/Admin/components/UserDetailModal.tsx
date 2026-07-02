import React, { useState, useEffect } from "react";
import { X, ShieldAlert } from "lucide-react";
import { userService } from "../../../services/api";
import { getInitials, mapRoleToUI, ROLE_COLORS, ROLE_META, mapStatusToUI } from "../utils/adminHelpers";

interface UserDetailModalProps {
  user: any;
  onClose: () => void;
}

export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const res = await userService.getUserActivityLogs(user.id || user._id, { limit: 5 });
        if (res.success) {
          setLogs(res.data);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [user]);

  const initials = getInitials(user.fullName || user.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 animate-fade-in overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              User Details
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Detailed account information & logs
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 space-y-6">
          {/* Header Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            {user.avatar?.url || user.avatarUrl ? (
              <img
                src={user.avatar?.url || user.avatarUrl}
                alt={user.fullName}
                className="w-16 h-16 rounded-full object-cover bg-white shadow-sm border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg font-bold text-gray-750 shadow-sm border border-gray-200">
                {initials}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-gray-800">{user.fullName}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 mt-1.5 rounded-md ${(ROLE_COLORS as any)[mapRoleToUI(user.role)] || "bg-gray-100 text-gray-700"}`}>
                {(ROLE_META as any)[mapRoleToUI(user.role)]?.label || user.role}
              </span>
            </div>
          </div>

          {/* Account Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Phone Number</span>
              <span className="text-sm font-semibold text-gray-800">{user.phone || 'Not provided'}</span>
            </div>
            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Status</span>
              <span className="text-sm font-semibold text-gray-800">{mapStatusToUI(user.status)}</span>
            </div>
            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Registered On</span>
              <span className="text-sm font-semibold text-gray-800">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Last Updated</span>
              <span className="text-sm font-semibold text-gray-800">
                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Activity Logs Section */}
          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-gray-500" />
              Recent Activity Logs
            </h4>
            
            {loadingLogs ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mx-auto mb-2"></div>
                Loading logs...
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No recent activity logs found.</p>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id || log._id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs flex justify-between items-start gap-4">
                    <div>
                      <p className="font-semibold text-gray-850">{log.action}</p>
                      <p className="text-gray-450 mt-0.5">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
