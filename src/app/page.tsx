// Home Page for RLS Guard Dog
// Created: September 19, 2025
// Description: Landing page with authentication check and role-based redirect

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, userSession, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userSession) {
      // Redirect authenticated users to their appropriate dashboard
      const dashboardPath = userSession.role === 'student' ? '/student' : '/teacher';
      router.push(dashboardPath);
    }
  }, [user, userSession, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Hero Section */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-blue-100 mb-8">
            <span className="text-6xl">🐕‍🦺</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
            RLS Guard Dog
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Secure student progress tracking with role-based access control using 
            Supabase Row Level Security
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Row Level Security
              </h3>
              <p className="text-gray-600">
                Advanced database security ensuring users only see data they&apos;re authorized to access
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Role-Based Access
              </h3>
              <p className="text-gray-600">
                Students, teachers, and head teachers each have different permissions and views
              </p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Progress Tracking
              </h3>
              <p className="text-gray-600">
                Comprehensive progress monitoring with charts and analytics
              </p>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Try Demo Accounts
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold text-blue-600 mb-2">Head Teacher</h3>
              <p className="text-sm text-gray-600 mb-2">Full school access</p>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                john.smith@greenwood.edu
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold text-green-600 mb-2">Teacher</h3>
              <p className="text-sm text-gray-600 mb-2">Class-level access</p>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                sarah.johnson@greenwood.edu
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold text-purple-600 mb-2">Student</h3>
              <p className="text-sm text-gray-600 mb-2">Personal data only</p>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                alice.wilson@student.greenwood.edu
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Password: <span className="font-mono">demo123</span> (for all accounts)
          </p>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Built With Modern Tech
          </h2>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="px-3 py-1 bg-white rounded-full shadow">Next.js 15</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">TypeScript</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Supabase</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">PostgreSQL</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">MongoDB</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Tailwind CSS</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Recharts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
