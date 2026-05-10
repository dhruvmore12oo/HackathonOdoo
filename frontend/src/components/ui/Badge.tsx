import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'brand' | 'accent' | 'danger' | 'success' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-600',
  brand: 'bg-brand-50 text-brand-500',
  accent: 'bg-accent-50 text-accent-600',
  danger: 'bg-danger-50 text-danger-400',
  success: 'bg-green-50 text-green-700',
  outline: 'border border-gray-300 text-gray-600 bg-transparent',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
