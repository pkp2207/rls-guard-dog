// Dashboard Redirect Page for RLS Guard Dog
// Created: September 19, 2025
// Description: Redirects users to appropriate dashboard based on their role

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, userSession, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/auth/login');
      } else if (userSession) {
        // Redirect to appropriate dashboard based on role
        const dashboardPath = userSession.role === 'student' ? '/student' : '/teacher';
        router.push(dashboardPath);
      }
    }
  }, [user, userSession, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}