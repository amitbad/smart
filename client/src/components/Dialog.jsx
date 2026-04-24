import { X } from 'lucide-react';

export default function Dialog({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
      <div className={`bg-gray-900 border border-gray-700 rounded-xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] flex flex-col animate-scale-in`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 transition p-1 rounded-lg hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', autoCloseOnConfirm = true }) {
  if (!isOpen) return null;

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-orange-600 hover:bg-orange-700',
    info: 'bg-cyan-600 hover:bg-cyan-700'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 transition p-1 rounded-lg hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-300 text-sm">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg text-sm transition"
          >
            {cancelText}
          </button>
          <button
            onClick={async () => {
              const result = await onConfirm();
              if (autoCloseOnConfirm || result) {
                onClose();
              }
            }}
            className={`px-4 py-2 ${buttonColors[type]} text-gray-100 rounded-lg text-sm transition`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
