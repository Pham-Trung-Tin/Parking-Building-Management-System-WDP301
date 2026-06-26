import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { mapRoleToBackend } from "../utils/adminHelpers";

interface AddUserModalProps {
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
}

export function AddUserModal({ onClose, onAdd }: AddUserModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Staff",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
