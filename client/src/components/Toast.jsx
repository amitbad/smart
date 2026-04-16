import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-400" />,
    error: <XCircle size={20} className="text-red-400" />,
    info: <Info size={20} className="text-blue-400" />
  };

  const bgColors = {
    success: 'bg-gray-900 border-green-600',
    error: 'bg-gray-900 border-red-600',
    info: 'bg-gray-900 border-blue-600'
  };

  const textColors = {
    success: 'text-gray-100',
    error: 'text-gray-100',
    info: 'text-gray-100'
  };

  return (
    <div className={`${bgColors[type]} border rounded-lg p-4 shadow-xl flex items-start gap-3 min-w-[300px] max-w-[400px] animate-slide-in`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1">
        <p className={`text-sm ${textColors[type]}`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-500 hover:text-white transition"
      >
        <X size={16} />
      </button>
    </div>
  );
}
