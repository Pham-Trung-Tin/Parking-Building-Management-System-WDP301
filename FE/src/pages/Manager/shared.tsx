import { useState } from 'react';
import { Check, X } from 'lucide-react';

/* ── Toast component ── */
export function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium anim-up ${ok ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
      {ok ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4" />}
      {msg}
    </div>
  );
}

/* ── useToast hook ── */
export function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast };
}

/* ── Status badge color map ── */
export const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  maintenance: 'bg-amber-50 text-amber-700',
};
