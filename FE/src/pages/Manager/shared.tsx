import { useState, useCallback } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

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

/* ── ConfirmDialog component ── */
export function ConfirmDialog({
  message, detail, confirmLabel = 'Delete', onConfirm, onCancel
}: {
  message: string;
  detail?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{message}</p>
            {detail && <p className="text-sm text-gray-500 mt-1">{detail}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── useConfirm hook ── */
export function useConfirm() {
  const [confirm, setConfirm] = useState<{
    message: string; detail?: string; confirmLabel?: string; onConfirm: () => void;
  } | null>(null);

  const askConfirm = useCallback((message: string, onConfirm: () => void, detail?: string, confirmLabel?: string) => {
    setConfirm({ message, detail, confirmLabel, onConfirm });
  }, []);

  const ConfirmNode = confirm ? (
    <ConfirmDialog
      message={confirm.message}
      detail={confirm.detail}
      confirmLabel={confirm.confirmLabel}
      onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
      onCancel={() => setConfirm(null)}
    />
  ) : null;

  return { askConfirm, ConfirmNode };
}

/* ── Status badge color map ── */
export const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
  maintenance: 'bg-amber-50 text-amber-700',
};
