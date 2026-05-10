import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const config: Record<AlertVariant, { icon: React.ReactNode; styles: string }> = {
  info: { icon: <Info className="h-4 w-4" />, styles: 'bg-blue-50 border-blue-200 text-blue-800' },
  success: { icon: <CheckCircle className="h-4 w-4" />, styles: 'bg-green-50 border-green-200 text-green-800' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, styles: 'bg-amber-50 border-amber-200 text-amber-800' },
  error: { icon: <AlertCircle className="h-4 w-4" />, styles: 'bg-danger-50 border-danger-200 text-danger-500' },
};

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { icon, styles } = config[variant];

  return (
    <div className={cn('flex gap-3 p-3 rounded-lg border text-sm', styles, className)} role="alert">
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
