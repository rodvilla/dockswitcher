import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onCancel} 
      />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10">
        <div className="p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 bg-gray-50 px-6 py-4 dark:bg-slate-800/50">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors ${
              destructive
                ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600'
                : 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
