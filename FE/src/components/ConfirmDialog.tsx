import { useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({
  message, detail, confirmLabel = 'Delete', confirmClass, onConfirm, onCancel,
}: {
  message: string;
  detail?: string;
  confirmLabel?: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-fade-in">
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
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${confirmClass || 'bg-red-500 hover:bg-red-600'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [confirm, setConfirm] = useState<{
    message: string;
    detail?: string;
    confirmLabel?: string;
    confirmClass?: string;
    onConfirm: () => void;
  } | null>(null);

  const askConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    detail?: string,
    confirmLabel?: string,
    confirmClass?: string,
  ) => {
    setConfirm({ message, detail, confirmLabel, confirmClass, onConfirm });
  }, []);

  const ConfirmNode = confirm ? (
    <ConfirmDialog
      message={confirm.message}
      detail={confirm.detail}
      confirmLabel={confirm.confirmLabel}
      confirmClass={confirm.confirmClass}
      onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
      onCancel={() => setConfirm(null)}
    />
  ) : null;

  return { askConfirm, ConfirmNode };
}
