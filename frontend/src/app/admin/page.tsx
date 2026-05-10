import { EmptyState } from '@/components/ui';
import { BarChart3 } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="animate-in">
      <h1 className="section-heading mb-6">Admin Analytics</h1>
      <EmptyState
        icon={<BarChart3 className="h-8 w-8 text-brand-400" />}
        title="Analytics Dashboard"
        description="Platform analytics and user management — available in a later phase."
      />
    </div>
  );
}
