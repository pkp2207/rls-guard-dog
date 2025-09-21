// Dashboard Redirect Page for RLS Guard Dog
// Created: September 19, 2025
// Description: Redirects users to appropriate dashboard based on their role

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user, userSession, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/auth/login');
      } else if (userSession) {
        // Redirect to appropriate dashboard based on role
        const dashboardPath = userSession.role === 'student' ? '/student' : '/teacher';
        router.push(dashboardPath);
      }
    }
  }, [user, userSession, loading, router, mounted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto"></div>
        <p className="mt-4 text-slate-300">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}