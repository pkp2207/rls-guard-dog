// Admin Page for RLS Guard Dog
// Created: September 19, 2025
// Description: Admin interface for testing Edge Functions and MongoDB operations

'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

import type { 
} from '@/lib/edge-functions';

interface TestResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  timestamp: string;
}

export default function AdminPage() {
  const { user, userSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Only allow head teachers to access this page
  if (!userSession || userSession.role !== 'head_teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-slate-400">This page is only accessible to head teachers.</p>
        </div>
      </div>
    );
  }

  const addTestResult = (result: Omit<TestResult, 'timestamp'>) => {
    setTestResults(prev => [{
      ...result,
      timestamp: new Date().toLocaleString()
    }, ...prev]);
  };

  const testEdgeFunction = async () => {
    setLoading(true);
    try {
      const { testEdgeFunctionHealth } = await import('@/lib/edge-functions');
      const result = await testEdgeFunctionHealth();
      addTestResult({
        success: result.success,
        message: result.message || 'Edge Function test completed',
        data: result.data,
        error: result.error
      });
    } catch (error) {
      addTestResult({
        success: false,
        message: 'Failed to test Edge Function',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentMonth = async () => {
    if (!schoolId) {
      addTestResult({
        success: false,
        message: 'School ID is required',
        error: 'Please enter a school ID'
      });
      return;
    }

    setLoading(true);
    try {
      const { calculateCurrentMonthAverages } = await import('@/lib/edge-functions');
      const result = await calculateCurrentMonthAverages(schoolId);
      addTestResult({
        success: result.success,
        message: result.message || 'Current month calculation completed',
        data: result.data,
        error: result.error
      });
    } catch (error) {
      addTestResult({
        success: false,
        message: 'Failed to calculate current month averages',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCustomPeriod = async () => {
    if (!schoolId || !month || !year) {
      addTestResult({
        success: false,
        message: 'School ID, month, and year are required',
        error: 'Please fill in all fields'
      });
      return;
    }

    setLoading(true);
    try {
      const { calculateClassAverages } = await import('@/lib/edge-functions');
      const result = await calculateClassAverages({
        school_id: schoolId,
        month: parseInt(month),
        year: parseInt(year),
        trigger_type: 'manual'
      });
      
      addTestResult({
        success: result.success,
        message: result.message || 'Custom period calculation completed',
        data: result.data,
        error: result.error
      });
    } catch (error) {
      addTestResult({
        success: false,
        message: 'Failed to calculate custom period averages',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testMongoDBHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health/mongodb');
      const result = await response.json();
      
      addTestResult({
        success: result.success,
        message: `MongoDB Status: ${result.status}`,
        data: result,
        error: result.error
      });
    } catch (error) {
      addTestResult({
        success: false,
        message: 'Failed to check MongoDB health',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl border border-slate-700 p-6 mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-300">
            Test Edge Functions and MongoDB operations. Available to head teachers only.
          </p>
          <div className="mt-4 text-sm text-slate-400">
            Logged in as: {user?.email} ({userSession.role})
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl border border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Test Controls</h2>
          
          {/* Basic Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testEdgeFunction}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Test Edge Function Health
            </button>
            <button
              onClick={testMongoDBHealth}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Test MongoDB Health
            </button>
          </div>

          {/* School ID Input */}
          <div className="mb-4">
            <label htmlFor="school-id" className="block text-sm font-medium text-slate-300 mb-2">
              School ID (for class average calculations)
            </label>
            <input
              id="school-id"
              type="text"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              placeholder="Enter school UUID"
              className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-slate-500 transition-colors duration-200 placeholder-slate-400"
            />
          </div>

          {/* Calculate Current Month */}
          <div className="mb-6">
            <button
              onClick={calculateCurrentMonth}
              disabled={loading || !schoolId}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Calculate Current Month Averages
            </button>
          </div>

          {/* Custom Period Calculation */}
          <div className="border-t border-slate-600 pt-6">
            <h3 className="text-lg font-medium text-slate-200 mb-4">Calculate Custom Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-slate-300 mb-1">
                  Month (1-12)
                </label>
                <input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-slate-500 transition-colors duration-200"
                />
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-slate-300 mb-1">
                  Year
                </label>
                <input
                  id="year"
                  type="number"
                  min="2020"
                  max="2030"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-slate-500 transition-colors duration-200"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={calculateCustomPeriod}
                  disabled={loading || !schoolId || !month || !year}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Calculate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-100">Test Results</h2>
            <button
              onClick={clearResults}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Clear Results
            </button>
          </div>

          {loading && (
            <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                <span className="text-blue-300">Running test...</span>
              </div>
            </div>
          )}

          {testResults.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No test results yet. Run a test to see results here.
            </p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={`test-result-${result.timestamp}-${index}`}
                  className={`p-4 rounded-lg border backdrop-blur-sm ${
                    result.success 
                      ? 'bg-green-500/20 border-green-500/30' 
                      : 'bg-red-500/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${
                      result.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.success ? '✅ Success' : '❌ Failed'}
                    </span>
                    <span className="text-sm text-slate-400">{result.timestamp}</span>
                  </div>
                  
                  <p className={`text-sm mb-2 ${
                    result.success ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {result.message}
                  </p>

                  {result.error && (
                    <p className="text-sm text-red-400 mb-2">
                      Error: {result.error}
                    </p>
                  )}

                  {result.data ? (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-slate-400 hover:text-slate-300 transition-colors">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-slate-700/50 rounded-lg overflow-auto text-xs text-slate-300">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}