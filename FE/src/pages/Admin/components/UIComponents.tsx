import React from "react";
import { Check } from "lucide-react";
import { ROLE_META } from "../utils/adminHelpers";

/* ─────────────────── Toast ─────────────────── */
interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
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
interface RoleToggleProps {
  checked: boolean;
  onChange: () => void;
  role: string;
}

export function RoleToggle({ checked, onChange, role }: RoleToggleProps) {
  const meta = (ROLE_META as any)[role];
  if (!meta) return null;
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
interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
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
