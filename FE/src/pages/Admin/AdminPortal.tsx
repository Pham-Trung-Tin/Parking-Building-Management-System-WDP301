import {
  Shield,
  Users,
  Key,
  Settings,
  Search,
  Check,
  Eye,
  Copy,
  Bell,
  LogOut,
  ChevronDown,
  X,
  UserPlus,
  Trash2,
  RefreshCw,
  Crown,
  Briefcase,
  UserCheck,
  Car,
  Lock,
  Unlock,
  Info,
  DollarSign,
  BarChart2,
  GitBranch,
  Camera,
  CalendarCheck,
  Ticket,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useUsers from "../../hooks/useUsers";
import { userService } from "../../services/api";

const ROLE_COLORS = {
  admin: "bg-gray-100 text-gray-700",
  manager: "bg-violet-100 text-violet-700",
  staff: "bg-sky-100 text-sky-700",
  driver: "bg-emerald-100 text-emerald-700",
  system_admin: "bg-gray-100 text-gray-700",
  parking_manager: "bg-violet-100 text-violet-700",
  parking_staff: "bg-sky-100 text-sky-700",
  parking_user: "bg-emerald-100 text-emerald-700",
};

/* Role metadata for the permission matrix */
const ROLE_META = {
  admin: {
    label: "Admin",
    Icon: Crown,
    color: "text-gray-900",
    bg: "bg-white",
    border: "border-gray-900",
    ring: "ring-gray-900",
    colBg: "bg-gray-50/60",
    check: "bg-gray-900",
    desc: "Full system access",
  },
  manager: {
    label: "Manager",
    Icon: Briefcase,
    color: "text-gray-700",
    bg: "bg-white",
    border: "border-gray-300",
    ring: "ring-gray-400",
    colBg: "bg-gray-50/40",
    check: "bg-gray-700",
    desc: "Operational oversight",
  },
  staff: {
    label: "Staff",
    Icon: UserCheck,
    color: "text-gray-600",
    bg: "bg-white",
    border: "border-gray-200",
    ring: "ring-gray-300",
    colBg: "bg-gray-50/30",
    check: "bg-gray-500",
    desc: "Day-to-day tasks",
  },
  driver: {
    label: "Driver",
    Icon: Car,
    color: "text-gray-500",
    bg: "bg-white",
    border: "border-gray-200",
    ring: "ring-gray-200",
    colBg: "bg-gray-50/20",
    check: "bg-gray-400",
    desc: "Parking & booking",
  },
};

const GROUP_META = {
  "Administrative Level": {
    Icon: ShieldAlert,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  "Financial & Tariff Operations": {
    Icon: DollarSign,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  "Gate & Barrier Logistics": {
    Icon: GitBranch,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  "End-User Parking Flows": {
    Icon: CalendarCheck,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
};

const ROLES = ["admin", "manager", "staff", "driver"];

const initialPermissions = [
  {
    id: "p1",
    label: "Manage User Directory & Account States",
    group: "Administrative Level",
    admin: true,
    manager: false,
    staff: false,
    driver: false,
  },
  {
    id: "p2",
    label: "Modify Global System & Hardware Config",
    group: "Administrative Level",
    admin: true,
    manager: false,
    staff: false,
    driver: false,
  },
  {
    id: "p3",
    label: "Configure Dynamic Pricing & Base Rates",
    group: "Financial & Tariff Operations",
    admin: true,
    manager: true,
    staff: false,
    driver: false,
  },
  {
    id: "p4",
    label: "View Facility Revenue Reports & Logs",
    group: "Financial & Tariff Operations",
    admin: true,
    manager: true,
    staff: false,
    driver: false,
  },
  {
    id: "p5",
    label: "Manual Barrier Override / Open Gate",
    group: "Gate & Barrier Logistics",
    admin: true,
    manager: true,
    staff: true,
    driver: false,
  },
  {
    id: "p6",
    label: "Process Live ANPR Inbound/Outbound",
    group: "Gate & Barrier Logistics",
    admin: false,
    manager: false,
    staff: true,
    driver: false,
  },
  {
    id: "p7",
    label: "Access Advanced Pre-booking Slot Grid",
    group: "End-User Parking Flows",
    admin: false,
    manager: false,
    staff: false,
    driver: true,
  },
  {
    id: "p8",
    label: "Generate Quick Check-In Pass & Live Track",
    group: "End-User Parking Flows",
    admin: false,
    manager: false,
    staff: false,
    driver: true,
  },
];

// Helper functions for backend/frontend data mapping
const mapRoleToUI = (role: string): string => {
  if (role === 'system_admin') return 'admin';
  if (role === 'parking_manager') return 'manager';
  if (role === 'parking_staff') return 'staff';
  if (role === 'parking_user') return 'driver';
  return role;
};

const mapRoleToBackend = (role: string): string => {
  if (role === 'admin' || role === 'Admin') return 'system_admin';
  if (role === 'manager' || role === 'Manager') return 'parking_manager';
  if (role === 'staff' || role === 'Staff') return 'parking_staff';
  if (role === 'driver' || role === 'Driver') return 'parking_user';
  return role;
};

const mapStatusToUI = (status: string): string => {
  if (status === 'active') return 'Active';
  if (status === 'blocked') return 'Suspended';
  if (status === 'pending') return 'Pending';
  if (status === 'inactive') return 'Inactive';
  return status;
};

const getInitials = (name: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/* ─────────────────── Add User Modal ─────────────────── */
function AddUserModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Staff",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;
    setError(null);
    setLoading(true);
    try {
      await onAdd({
        fullName: form.name,
        email: form.email,
        password: form.password,
        role: mapRoleToBackend(form.role),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              New User
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Add a system account
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-650 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Nguyen Van A"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-white"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="user@parksmart.vn"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-white"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-white"
              required
              minLength={8}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Role
            </label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-white"
                disabled={loading}
              >
                <option>Manager</option>
                <option>Staff</option>
                <option>Driver</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────── User Detail Modal ─────────────────── */
function UserDetailModal({ user, onClose }) {
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
              <span className={`inline-block text-[11px] font-bold px-2 py-0.5 mt-1.5 rounded-md ${ROLE_COLORS[mapRoleToUI(user.role)] || "bg-gray-100 text-gray-700"}`}>
                {ROLE_META[mapRoleToUI(user.role)]?.label || user.role}
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

/* ─────────────────── Toast ─────────────────── */
function Toast({ message, onDone }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white text-sm px-5 py-3.5 rounded-2xl shadow-xl animate-slide-up"
      onAnimationEnd={onDone}
    >
      <Check className="w-4 h-4 text-emerald-400" />
      {message}
    </div>
  );
}

/* ─────────────────── RoleToggle (replaces PermissionCheckbox) ─────────────────── */
function RoleToggle({ checked, onChange, role }) {
  const meta = ROLE_META[role];
  return (
    <button
      onClick={onChange}
      title={checked ? `Remove from ${meta.label}` : `Grant to ${meta.label}`}
      className={`group relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 focus:outline-none ${
        checked
          ? `${meta.bg} ${meta.border} border-2 shadow-sm`
          : "border-2 border-gray-100 hover:border-gray-300 bg-white"
      }`}
    >
      {checked ? (
        <Check
          className={`w-4 h-4 ${meta.color} transition-transform duration-200 scale-100`}
          strokeWidth={2.5}
        />
      ) : (
        <span className="w-4 h-4 rounded-sm border-2 border-gray-300 group-hover:border-gray-400 transition-colors" />
      )}
    </button>
  );
}


/* ─────────────────── Toggle ─────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ─────────────────── Main Component ─────────────────── */
export default function AdminPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState(location.state?.activeNav || "users");

  useEffect(() => {
    if (location.state?.activeNav) {
      setActiveNav(location.state.activeNav);
    }
  }, [location.state]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [anprEnabled, setAnprEnabled] = useState(true);
  const [gateEnabled, setGateEnabled] = useState(true);
  const [sensorEnabled, setSensorEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const [permissions, setPermissions] = useState(initialPermissions);
  const [permSaved, setPermSaved] = useState(false);

  const API_KEY = "pk_live_51K7x9HG2kP3mN4qR8sT";

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const {
    users,
    pagination,
    loading,
    error,
    stats,
    createUser,
    deleteUser,
    toggleBlockUser,
    updateFilters,
  } = useUsers(5);

  // Debounced search query
  useEffect(() => {
    const handler = setTimeout(() => {
      updateFilters({ search: searchQuery });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, updateFilters]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const togglePermission = (id, role) => {
    setPermissions(
      permissions.map((p) =>
        p.id === id ? { ...p, [role]: !p[role] } : p
      )
    );
    setPermSaved(false);
  };

  const getGroupedPermissions = () => {
    const groups: { [key: string]: any[] } = {};
    permissions.forEach((p) => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  };

  const handleToggleUserStatus = async (id: string, currentStatus: string) => {
    try {
      const isCurrentlyBlocked = currentStatus === 'blocked';
      await toggleBlockUser(id, isCurrentlyBlocked);
      showToast(isCurrentlyBlocked ? "User unblocked" : "User blocked");
    } catch (err: any) {
      showToast(err.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(id);
        showToast("User removed");
      } catch (err: any) {
        showToast(err.message || "Failed to delete user");
      }
    }
  };

  const handleCreateUser = async (userData) => {
    await createUser(userData);
    showToast("User created successfully");
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(API_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { id: "users", icon: Users, label: "Users" },
    { id: "permissions", icon: Key, label: "Permissions" },
    { id: "config", icon: Settings, label: "Configuration" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in  { animation: fade-in  0.2s ease-out; }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>

      <div className="min-h-screen bg-[#F8F8F6] flex">
        {/* ── Sidebar ── */}
        <div className="w-[72px] bg-white border-r border-gray-100 flex flex-col items-center py-7 gap-0 sticky top-0 h-screen z-10">
          {/* Logo */}
          <div className="mb-10">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 flex flex-col items-center gap-2">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                title={label}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 ${
                  activeNav === id
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
              </button>
            ))}
            {/* Staff Assignment Link */}
            <button
              onClick={() => navigate('/admin/staff-assignment')}
              title="Staff Assignment"
              className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-all duration-150"
            >
              <Building2 className="w-[18px] h-[18px]" />
            </button>
          </nav>

          {/* Bottom */}
          <div className="flex flex-col items-center gap-3">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 transition-colors"
              title="Pham Trung Tin (Admin)"
            >
              PT
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-12 py-10">

            {/* ══════════ USERS ══════════ */}
            {activeNav === "users" && (
              <div>
                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
                      System Admin
                    </p>
                    <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
                      User Management
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                      {pagination?.totalDocs || users.length} accounts registered
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    {
                      label: "Active",
                      val: stats.activeCount,
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                    },
                    {
                      label: "Suspended",
                      val: stats.suspendedCount,
                      color: "text-rose-600",
                      bg: "bg-rose-50",
                    },
                    {
                      label: "Total Roles",
                      val: stats.totalRoles,
                      color: "text-violet-600",
                      bg: "bg-violet-50",
                    },
                  ].map(({ label, val, color, bg }) => (
                    <div
                      key={label}
                      className="bg-white rounded-2xl px-5 py-4 border border-gray-100"
                    >
                      <p className="text-xs text-gray-400 mb-1">
                        {label}
                      </p>
                      <p className={`text-2xl font-bold ${color}`}>
                        {val}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Search and Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email or role…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition shadow-sm"
                    />
                  </div>
                  
                  {/* Role Selector */}
                  <select
                    onChange={(e) => updateFilters({ role: e.target.value })}
                    className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition shadow-sm"
                  >
                    <option value="">All Roles</option>
                    <option value="system_admin">System Admin</option>
                    <option value="parking_manager">Manager</option>
                    <option value="parking_staff">Staff</option>
                    <option value="parking_user">Driver</option>
                  </select>

                  {/* Status Selector */}
                  <select
                    onChange={(e) => updateFilters({ status: e.target.value })}
                    className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition shadow-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="blocked">Suspended</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-[1fr_140px_110px_130px] px-6 py-3 border-b border-gray-100 bg-gray-50">
                    {["Account", "Role", "Status", ""].map(
                      (h) => (
                        <div
                          key={h}
                          className="text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                          {h}
                        </div>
                      )
                    )}
                  </div>

                  {loading && users.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      Loading users...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-400">
                      No users found.
                    </div>
                  ) : (
                    users.map((user, i) => (
                      <div
                        key={user.id || user._id}
                        className={`grid grid-cols-[1fr_140px_110px_130px] px-6 py-4 items-center hover:bg-gray-50/60 transition-colors ${
                          i !== users.length - 1
                            ? "border-b border-gray-100"
                            : ""
                        }`}
                      >
                        {/* Account */}
                        <div className="flex items-center gap-3">
                          {user.avatar?.url || user.avatarUrl ? (
                            <img
                              src={user.avatar?.url || user.avatarUrl}
                              alt={user.fullName}
                              className="w-9 h-9 rounded-full object-cover bg-white shadow-sm"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0 shadow-sm">
                              {getInitials(user.fullName)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {user.fullName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Role */}
                        <div>
                          <span
                            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg ${
                              ROLE_COLORS[mapRoleToUI(user.role)] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {ROLE_META[mapRoleToUI(user.role)]?.label || user.role}
                          </span>
                        </div>

                        {/* Status */}
                        <div>
                          <button
                            onClick={() =>
                              handleToggleUserStatus(user.id || user._id, user.status)
                            }
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                              user.status === "active"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === "active"
                                  ? "bg-emerald-500"
                                  : "bg-rose-400"
                              }`}
                            />
                            {mapStatusToUI(user.status)}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleUserStatus(user.id || user._id, user.status)
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Toggle status"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id || user._id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-xs text-gray-450">
                      Showing Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNo) => (
                        <button
                          key={pageNo}
                          onClick={() => updateFilters({ page: pageNo })}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            pageNo === pagination.page
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {pageNo}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ PERMISSIONS ══════════ */}
            {activeNav === "permissions" && (
              <div>
                {/* Header */}
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
                      Access Control
                    </p>
                    <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
                      Permission Matrix
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                      Define what each role can do across the system
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {permSaved && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" strokeWidth={3} />
                        Changes saved
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setPermSaved(true);
                        showToast("Permission matrix saved");
                      }}
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm ${
                        permSaved
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-gray-900 text-white hover:bg-gray-700"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {permSaved ? "Saved!" : "Save Changes"}
                    </button>
                  </div>
                </div>

                {/* Role summary cards */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {ROLES.map((role) => {
                    const meta = ROLE_META[role];
                    const count = permissions.filter((p) => p[role]).length;
                    const total = permissions.length;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div
                        key={role}
                        className={`rounded-2xl border-2 ${meta.border} ${meta.bg} p-4`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-8 h-8 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center`}>
                            <meta.Icon className={`w-4 h-4 ${meta.color}`} />
                          </div>
                          <span className={`text-xs font-bold ${meta.color}`}>
                            {count}/{total}
                          </span>
                        </div>
                        <p className={`text-sm font-semibold ${meta.color} mb-0.5`}>
                          {meta.label}
                        </p>
                        <p className="text-[11px] text-gray-400 mb-2">{meta.desc}</p>
                        {/* Progress bar */}
                        <div className="h-1 bg-white/70 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${meta.check} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Matrix Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  {/* Sticky column headers */}
                  <div className="grid grid-cols-[1fr_repeat(4,88px)] gap-0 border-b-2 border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                    <div className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-3.5 h-3.5" />
                      Permission
                    </div>
                    {ROLES.map((role) => {
                      const meta = ROLE_META[role];
                      return (
                        <div
                          key={role}
                          className={`py-4 flex flex-col items-center justify-center gap-1 border-l border-gray-100`}
                        >
                          <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center`}>
                            <meta.Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                          </div>
                          <span className={`text-[11px] font-semibold ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Permission groups */}
                  {Object.entries(getGroupedPermissions()).map(([group, perms], gi, arr) => {
                    const gm = GROUP_META[group] || {
                      Icon: Key,
                      color: "text-gray-600",
                      bg: "bg-gray-50",
                      border: "border-gray-200",
                    };
                    return (
                      <div
                        key={group}
                        className={gi !== arr.length - 1 ? "border-b-2 border-gray-100" : ""}
                      >
                        {/* Group header pill */}
                        <div className="px-6 pt-5 pb-3 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${gm.bg} ${gm.color} ${gm.border}`}>
                            <gm.Icon className="w-3 h-3" />
                            {group}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {perms.length} permission{perms.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Permission rows */}
                        {perms.map((perm, pi) => (
                          <div
                            key={perm.id}
                            className={`group grid grid-cols-[1fr_repeat(4,88px)] gap-0 items-center hover:bg-blue-50/20 transition-colors duration-150 ${
                              pi !== perms.length - 1 ? "border-b border-gray-50" : ""
                            }`}
                          >
                            {/* Permission label */}
                            <div className="px-6 py-4 flex items-center gap-3">
                              <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                                {perm.label}
                              </span>
                            </div>

                            {/* Role toggles */}
                            {ROLES.map((role) => {
                              const meta = ROLE_META[role];
                              return (
                                <div
                                  key={role}
                                  className={`py-4 flex justify-center border-l border-gray-100 transition-colors ${
                                    perm[role] ? meta.colBg : ""
                                  }`}
                                >
                                  <RoleToggle
                                    checked={perm[role]}
                                    role={role}
                                    onChange={() => togglePermission(perm.id, role)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-6 px-1">
                  <span className="text-xs text-gray-400">Legend:</span>
                  {ROLES.map((role) => {
                    const meta = ROLE_META[role];
                    return (
                      <span key={role} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className={`w-3 h-3 rounded-sm ${meta.check}`} />
                        {meta.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}



            {/* ══════════ CONFIG ══════════ */}
            {activeNav === "config" && (
              <div>
                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
                      System
                    </p>
                    <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
                      Configuration
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                      Manage facility settings and hardware
                      integration
                    </p>
                  </div>
                  <button
                    onClick={() => showToast("Configuration saved")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Save All
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Facility */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-800 mb-5">
                      Facility Details
                    </h2>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                          Facility Name
                        </label>
                        <input
                          type="text"
                          defaultValue="ParkSmart Central Station"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                            Opening
                          </label>
                          <input
                            type="time"
                            defaultValue="05:00"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                            Closing
                          </label>
                          <input
                            type="time"
                            defaultValue="23:30"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                          Currency & Timezone
                        </label>
                        <div className="relative">
                          <select className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition bg-white">
                            <option>VND (₫) — GMT+7</option>
                            <option>USD ($) — GMT+7</option>
                            <option>EUR (€) — GMT+0</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hardware */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-800 mb-5">
                      Hardware Integration
                    </h2>
                    <div className="space-y-4">
                      {[
                        {
                          label: "ANPR Camera",
                          sub: "Plate recognition active",
                          state: anprEnabled,
                          set: setAnprEnabled,
                        },
                        {
                          label: "Gate Barrier",
                          sub: "Entry/exit control",
                          state: gateEnabled,
                          set: setGateEnabled,
                        },
                        {
                          label: "Slot Sensors",
                          sub: "Occupancy detection",
                          state: sensorEnabled,
                          set: setSensorEnabled,
                        },
                      ].map(({ label, sub, state, set }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100/60 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {label}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {state ? sub : "Disabled"}
                            </p>
                          </div>
                          <Toggle
                            checked={state}
                            onChange={() => set(!state)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Policy */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-800 mb-5">
                      Data Policy
                    </h2>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                          Log Retention
                        </label>
                        <div className="relative">
                          <select className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition bg-white">
                            <option>365 Days</option>
                            <option>180 Days</option>
                            <option>90 Days</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                          Backup Frequency
                        </label>
                        <div className="relative">
                          <select className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition bg-white">
                            <option>Every Midnight</option>
                            <option>Every 6 Hours</option>
                            <option>Weekly</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="pt-1 text-xs text-gray-400">
                        Last backup: <span className="text-gray-600 font-medium">Today at 04:00 AM</span>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-800 mb-5">
                      Security
                    </h2>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                          API Gateway Key
                        </label>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50">
                          <input
                            type={showApiKey ? "text" : "password"}
                            value={showApiKey ? API_KEY : "•".repeat(24)}
                            readOnly
                            className="flex-1 text-sm bg-transparent focus:outline-none font-mono text-gray-700"
                          />
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCopyKey}
                            className={`p-1 rounded-lg transition-colors ${copied ? "text-emerald-500" : "text-gray-400 hover:text-gray-700 hover:bg-white"}`}
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {copied && (
                          <p className="text-xs text-emerald-600 mt-1.5">
                            Copied to clipboard!
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                          Session Timeout
                        </label>
                        <div className="relative">
                          <select className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition bg-white">
                            <option>30 Minutes</option>
                            <option>1 Hour</option>
                            <option>4 Hours</option>
                            <option>Never</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Email Escalation
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Alert on critical events
                          </p>
                        </div>
                        <Toggle
                          checked={true}
                          onChange={() => {}}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleCreateUser}
        />
      )}

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
