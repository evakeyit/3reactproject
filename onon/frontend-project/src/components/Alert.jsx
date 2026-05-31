import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function Alert({ type = 'info', message, onClose }) {
  const Icon = icons[type];
  return (
    <div className={`mb-4 flex items-center gap-3 rounded-lg border p-4 ${styles[type]}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="flex-1 text-sm">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-sm font-medium underline">
          Dismiss
        </button>
      )}
    </div>
  );
}
