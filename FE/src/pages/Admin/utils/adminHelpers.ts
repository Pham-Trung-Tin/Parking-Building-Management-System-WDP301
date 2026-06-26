import { Crown, Briefcase, UserCheck, Car, ShieldAlert, DollarSign, GitBranch, CalendarCheck } from "lucide-react";

export const ROLE_COLORS: { [key: string]: string } = {
  admin: "bg-gray-100 text-gray-700",
  manager: "bg-violet-100 text-violet-700",
  staff: "bg-sky-100 text-sky-700",
  driver: "bg-emerald-100 text-emerald-700",
  system_admin: "bg-gray-100 text-gray-700",
  parking_manager: "bg-violet-100 text-violet-700",
  parking_staff: "bg-sky-100 text-sky-700",
  parking_user: "bg-emerald-100 text-emerald-700",
};

export const ROLE_META = {
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

export const GROUP_META = {
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

export const ROLES = ["admin", "manager", "staff", "driver"];

export const initialPermissions = [
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
export const mapRoleToUI = (role: string): string => {
  if (role === 'system_admin') return 'admin';
  if (role === 'parking_manager') return 'manager';
  if (role === 'parking_staff') return 'staff';
  if (role === 'parking_user') return 'driver';
  return role;
};

export const mapRoleToBackend = (role: string): string => {
  if (role === 'admin' || role === 'Admin') return 'system_admin';
  if (role === 'manager' || role === 'Manager') return 'parking_manager';
  if (role === 'staff' || role === 'Staff') return 'parking_staff';
  if (role === 'driver' || role === 'Driver') return 'parking_user';
  return role;
};

export const mapStatusToUI = (status: string): string => {
  if (status === 'active') return 'Active';
  if (status === 'blocked') return 'Suspended';
  if (status === 'pending') return 'Pending';
  if (status === 'inactive') return 'Inactive';
  return status;
};

export const getInitials = (name: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};
