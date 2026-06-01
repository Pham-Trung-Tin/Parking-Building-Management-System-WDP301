import {
  Shield,
  Users,
  Key,
  Settings,
  Search,
  MoreVertical,
  Check,
  Eye,
  Copy,
  Bell,
  LogOut,
  ChevronDown,
  X,
  UserPlus,
  Trash2,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

const ROLE_COLORS = {
  Manager: "bg-violet-100 text-violet-700",
  Staff: "bg-sky-100 text-sky-700",
  Driver: "bg-emerald-100 text-emerald-700",
};

const initialUsers = [
  {
    id: "1",
    name: "Nguyen Van An",
    email: "nguyen.van.an@parksmart.vn",
    role: "Manager",
    status: "Active",
    avatar: "NA",
    joined: "Jan 12, 2024",
  },
  {
    id: "2",
    name: "Tran Thi Binh",
    email: "tran.thi.binh@parksmart.vn",
    role: "Staff",
    status: "Active",
    avatar: "TB",
    joined: "Mar 5, 2024",
  },
  {
    id: "3",
    name: "Le Minh Chau",
    email: "le.minh.chau@parksmart.vn",
    role: "Staff",
    status: "Active",
    avatar: "LC",
    joined: "Mar 22, 2024",
  },
  {
    id: "4",
    name: "Pham Trung Tin",
    email: "pham.trung.tin@parksmart.vn",
    role: "Driver",
    status: "Active",
    avatar: "PT",
    joined: "Apr 1, 2024",
  },
  {
    id: "5",
    name: "Hoang Thu Ha",
    email: "hoang.thu.ha@parksmart.vn",
    role: "Driver",
    status: "Suspended",
    avatar: "HH",
    joined: "May 14, 2024",
  },
];

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

/* ─────────────────── Add User Modal ─────────────────── */
function AddUserModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Staff",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    const initials = form.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    onAdd({
      id: Date.now().toString(),
      name: form.name,
      email: form.email,
      role: form.role,
      status: "Active",
      avatar: initials,
      joined: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
    onClose();
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
          >
            <X className="w-5 h-5" />
          </button>
        </div>
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              required
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              required
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
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
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

/* ─────────────────── PermissionCheckbox ─────────────────── */
function PermissionCheckbox({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 ${
        checked
          ? "bg-gray-900 shadow-sm"
          : "border-2 border-gray-200 hover:border-gray-500"
      }`}
    >
      {checked && (
        <Check className="w-3 h-3 text-white" strokeWidth={3} />
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
  const [activeNav, setActiveNav] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [anprEnabled, setAnprEnabled] = useState(true);
  const [gateEnabled, setGateEnabled] = useState(true);
  const [sensorEnabled, setSensorEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const [permissions, setPermissions] =
    useState(initialPermissions);
  const [permSaved, setPermSaved] = useState(false);

  const API_KEY = "pk_live_51K7x9HG2kP3mN4qR8sT";

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const togglePermission = (id, role) => {
    setPermissions(
      permissions.map((p) =>
        p.id === id ? { ...p, [role]: !p[role] } : p,
      ),
    );
    setPermSaved(false);
  };

  const getGroupedPermissions = () => {
    const groups = {};
    permissions.forEach((p) => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleUserStatus = (id) => {
    setUsers(
      users.map((u) =>
        u.id === id
          ? {
              ...u,
              status:
                u.status === "Active" ? "Suspended" : "Active",
            }
          : u,
      ),
    );
  };

  const deleteUser = (id) => {
    setUsers(users.filter((u) => u.id !== id));
    showToast("User removed");
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
                      {users.length} accounts registered
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
                      val: users.filter(
                        (u) => u.status === "Active",
                      ).length,
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                    },
                    {
                      label: "Suspended",
                      val: users.filter(
                        (u) => u.status === "Suspended",
                      ).length,
                      color: "text-rose-600",
                      bg: "bg-rose-50",
                    },
                    {
                      label: "Total Roles",
                      val: [
                        ...new Set(users.map((u) => u.role)),
                      ].length,
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

                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email or role…"
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition shadow-sm"
                  />
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-[1fr_140px_110px_96px] px-6 py-3 border-b border-gray-100 bg-gray-50">
                    {["Account", "Role", "Status", ""].map(
                      (h) => (
                        <div
                          key={h}
                          className="text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                          {h}
                        </div>
                      ),
                    )}
                  </div>

                  {filteredUsers.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-400">
                      No users match your search.
                    </div>
                  ) : (
                    filteredUsers.map((user, i) => (
                      <div
                        key={user.id}
                        className={`grid grid-cols-[1fr_140px_110px_96px] px-6 py-4 items-center hover:bg-gray-50/60 transition-colors ${
                          i !== filteredUsers.length - 1
                            ? "border-b border-gray-100"
                            : ""
                        }`}
                      >
                        {/* Account */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                            {user.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Role */}
                        <div>
                          <span
                            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-lg ${ROLE_COLORS[user.role]}`}
                          >
                            {user.role}
                          </span>
                        </div>

                        {/* Status */}
                        <div>
                          <button
                            onClick={() =>
                              toggleUserStatus(user.id)
                            }
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                              user.status === "Active"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === "Active"
                                  ? "bg-emerald-500"
                                  : "bg-rose-400"
                              }`}
                            />
                            {user.status}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              toggleUserStatus(user.id)
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Toggle status"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
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
              </div>
            )}

            {/* ══════════ PERMISSIONS ══════════ */}
            {activeNav === "permissions" && (
              <div>
                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
                      Access Control
                    </p>
                    <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
                      Permission Matrix
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                      Define what each role can do across the
                      system
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPermSaved(true);
                      showToast("Permissions saved");
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-colors shadow-sm ${
                      permSaved
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-900 text-white hover:bg-gray-700"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {permSaved ? "Saved" : "Save Changes"}
                  </button>
                </div>

                {/* Matrix */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  {/* Header Row */}
                  <div className="grid grid-cols-[1fr_repeat(4,100px)] px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Permission
                    </div>
                    {["Admin", "Manager", "Staff", "Driver"].map(
                      (r) => (
                        <div
                          key={r}
                          className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                        >
                          {r}
                        </div>
                      ),
                    )}
                  </div>

                  {/* Groups */}
                  {Object.entries(getGroupedPermissions()).map(
                    ([group, perms], gi) => (
                      <div
                        key={group}
                        className={
                          gi !==
                          Object.keys(getGroupedPermissions())
                            .length -
                            1
                            ? "border-b border-gray-100"
                            : ""
                        }
                      >
                        {/* Group label */}
                        <div className="px-6 pt-5 pb-2">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                            {group}
                          </span>
                        </div>

                        {/* Rows */}
                        {perms.map((perm, pi) => (
                          <div
                            key={perm.id}
                            className={`grid grid-cols-[1fr_repeat(4,100px)] px-6 py-3.5 items-center hover:bg-gray-50/60 transition-colors ${
                              pi !== perms.length - 1
                                ? "border-b border-gray-50"
                                : ""
                            }`}
                          >
                            <span className="text-sm text-gray-700 pl-2">
                              {perm.label}
                            </span>
                            {["admin", "manager", "staff", "driver"].map(
                              (role) => (
                                <div
                                  key={role}
                                  className="flex justify-center"
                                >
                                  <PermissionCheckbox
                                    checked={perm[role]}
                                    onChange={() =>
                                      togglePermission(
                                        perm.id,
                                        role,
                                      )
                                    }
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        ))}
                      </div>
                    ),
                  )}
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
          onAdd={(newUser) => {
            setUsers([...users, newUser]);
            showToast("User created successfully");
          }}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
    </>
  );
}
