import React from 'react';
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
  UserPlus,
  Trash2,
  RefreshCw,
  Building2,
  BarChart2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useUsers from "../../hooks/useUsers";
import { userService } from "../../services/api";
import { useConfirm } from '../../components/ConfirmDialog';

// Import custom helpers
import {
  ROLE_COLORS,
  ROLE_META,
  GROUP_META,
  ROLES,
  initialPermissions,
  mapRoleToUI,
  mapStatusToUI,
  getInitials
} from "./utils/adminHelpers";

// Import custom components
import { Toast, Toggle, RoleToggle } from "./components/UIComponents";
import { AddUserModal } from "./components/AddUserModal";
import { UserDetailModal } from "./components/UserDetailModal";
import { ReportsDashboard } from "./components/ReportsDashboard";
import StaffAssignmentPage from '../Staff/StaffAssignmentPage';
import AdminBuildingTab from './AdminBuildingTab';

/* ─────────────────── Main Component ─────────────────── */
export default function AdminPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
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
  const { askConfirm, ConfirmNode } = useConfirm();

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

  const handleDeleteUser = (id: string) => {
    askConfirm(
      'Delete this user?',
      async () => {
        try {
          await deleteUser(id);
          showToast('User removed');
        } catch (err: any) {
          showToast(err.message || 'Failed to delete user');
        }
      }
    );
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
    { id: "buildings", icon: Building2, label: "Buildings" },
    // { id: "permissions", icon: Key, label: "Permissions" },
    { id: "config", icon: Settings, label: "Configuration" },
    // { id: "reports", icon: BarChart2, label: "Reports" },
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
        <div className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen z-10">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Admin Portal</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">System Administration</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeNav === item.id
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                {getInitials(user?.fullName || 'Admin')}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'Admin'}</p>
                <p className="text-[10px] text-gray-400 uppercase">System Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
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
                  {/* <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </button> */}
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
                        className={`grid grid-cols-[1fr_140px_110px_130px] px-6 py-4 items-center hover:bg-gray-50/60 transition-colors ${i !== users.length - 1
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
                            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg ${ROLE_COLORS[mapRoleToUI(user.role)] || "bg-gray-100 text-gray-700"
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
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${user.status === "active"
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${user.status === "active"
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
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${pageNo === pagination.page
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
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm ${permSaved
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
                            className={`group grid grid-cols-[1fr_repeat(4,88px)] gap-0 items-center hover:bg-blue-50/20 transition-colors duration-150 ${pi !== perms.length - 1 ? "border-b border-gray-50" : ""
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
                                  className={`py-4 flex justify-center border-l border-gray-100 transition-colors ${perm[role] ? meta.colBg : ""
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
                          onChange={() => { }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeNav === "buildings" && (
              <AdminBuildingTab />
            )}

            {activeNav === "reports" && (
              <ReportsDashboard />
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
      {ConfirmNode}
    </>
  );
}
