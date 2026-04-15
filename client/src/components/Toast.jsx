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
    success: 'bg-green-600/20 border-green-600/50',
    error: 'bg-red-600/20 border-red-600/50',
    info: 'bg-blue-600/20 border-blue-600/50'
  };

  const textColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  };

  return (
    <div className={`${bgColors[type]} border rounded-lg p-4 shadow-lg flex items-start gap-3 min-w-[300px] max-w-[400px] animate-slide-in`}>
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
