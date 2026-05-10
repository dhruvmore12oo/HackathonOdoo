import { EmptyState } from '@/components/ui';
import { Search } from 'lucide-react';

export default function SearchCitiesPage() {
  return (
    <div className="animate-in">
      <h1 className="section-heading mb-6">Search Cities</h1>
      <EmptyState
        icon={<Search className="h-8 w-8 text-brand-400" />}
        title="City search"
        description="Search and explore cities for your next trip — coming in the next phase."
      />
    </div>
  );
}
