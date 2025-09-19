'use client';

import { useAuth } from '@/lib/auth-context';
import { LoadingSpinner } from '@/components/ui/loading';

export const dynamic = 'force-dynamic';

export default function StudentDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div>Please log in to view your dashboard.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Student Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user.email}</h2>
        <p className="text-gray-600">Your student dashboard is under construction.</p>
      </div>
    </div>
  );
}
