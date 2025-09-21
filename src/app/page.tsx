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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Hero Section */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 mb-8">
            <span className="text-6xl">🐕‍🦺</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            RLS Guard Dog
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Secure student progress tracking with role-based access control using 
            Supabase Row Level Security
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center px-6 py-3 border border-slate-600 text-base font-medium rounded-lg text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-slate-50 text-center mb-12">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-slate-50 mb-2">
                Row Level Security
              </h3>
              <p className="text-slate-300">
                Advanced database security ensuring users only see data they&apos;re authorized to access
              </p>
            </div>
            
            <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-slate-50 mb-2">
                Role-Based Access
              </h3>
              <p className="text-slate-300">
                Students, teachers, and head teachers each have different permissions and views
              </p>
            </div>
            
            <div className="text-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-slate-50 mb-2">
                Progress Tracking
              </h3>
              <p className="text-slate-300">
                Comprehensive progress monitoring with charts and analytics
              </p>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-20 bg-slate-800/30 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-slate-50 text-center mb-6">
            Try Demo Accounts
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-slate-600 rounded-lg bg-slate-800/50">
              <h3 className="font-semibold text-blue-400 mb-2">Head Teacher</h3>
              <p className="text-sm text-slate-300 mb-2">Full school access</p>
              <p className="text-xs font-mono bg-slate-700/50 text-slate-200 p-2 rounded">
                john.smith@greenwood.edu
              </p>
            </div>
            
            <div className="text-center p-4 border border-slate-600 rounded-lg bg-slate-800/50">
              <h3 className="font-semibold text-green-400 mb-2">Teacher</h3>
              <p className="text-sm text-slate-300 mb-2">Class-level access</p>
              <p className="text-xs font-mono bg-slate-700/50 text-slate-200 p-2 rounded">
                sarah.johnson@greenwood.edu
              </p>
            </div>
            
            <div className="text-center p-4 border border-slate-600 rounded-lg bg-slate-800/50">
              <h3 className="font-semibold text-purple-400 mb-2">Student</h3>
              <p className="text-sm text-slate-300 mb-2">Personal data only</p>
              <p className="text-xs font-mono bg-slate-700/50 text-slate-200 p-2 rounded">
                alice.wilson@student.greenwood.edu
              </p>
            </div>
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
            Password: <span className="font-mono text-slate-300">demo123</span> (for all accounts)
          </p>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-slate-50 mb-6">
            Built With Modern Tech
          </h2>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="px-3 py-1 bg-slate-800/50 text-slate-300 rounded-full shadow border border-slate-700">Next.js 15</span>
            <span className="px-3 py-1 bg-slate-800/50 text-slate-300 rounded-full shadow border border-slate-700">TypeScript</span>
            <span className="px-3 py-1 bg-slate-800/50 text-slate-300 rounded-full shadow border border-slate-700">Supabase</span>
            <span className="px-3 py-1 bg-slate-800/50 text-slate-300 rounded-full shadow border border-slate-700">PostgreSQL</span>
            <span className="px-3 py-1 bg-slate-800/50 text-slate-300 rounded-full shadow border border-slate-700">MongoDB</span>
            <span className="px-3 py-1 bg-slate-800/50 text-slate-300 rounded-full shadow border border-slate-700">Tailwind CSS</span>
            <span className="px-3 py-1 bg-slate-800/50 text-slate-300 rounded-full shadow border border-slate-700">Recharts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
