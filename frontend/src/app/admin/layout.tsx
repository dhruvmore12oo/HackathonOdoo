import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gray-900 text-white">
        <div className="container-page flex items-center h-14 gap-3">
          <Shield className="h-5 w-5 text-brand-400" />
          <span className="font-heading text-lg font-bold">Traveloop Admin</span>
        </div>
      </header>
      <main className="container-page py-6">{children}</main>
    </div>
  );
}
