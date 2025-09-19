// Student Dashboard for RLS Guard Dog
// Created: September 19, 2025
// Description: Protected student dashboard showing personal progress with data visualization

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';

interface ProgressData {
  id: string;
  subject: string;
  score: number;
  completed_at: string;
  max_score: number;
  percentage: number;
}

interface SubjectAverage {
  subject: string;
  average: number;
  count: number;
}

interface WeeklyProgress {
  week: string;
  averageScore: number;
}

export default function StudentDashboard() {
  const { user, userSession, loading } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [subjectAverages, setSubjectAverages] = useState<SubjectAverage[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && userSession) {
      if (userSession.role !== 'student') {
        // Redirect non-students away from student dashboard
        window.location.href = userSession.role === 'teacher' ? '/teacher' : '/';
        return;
      }
      
      fetchStudentProgress();
    }
  }, [user, userSession, loading]);

  const fetchStudentProgress = async () => {
    try {
      setLoadingData(true);
      setError(null);

      // Fetch student's progress data with RLS automatically filtering
      const { data: progress, error: progressError } = await supabase
        .from('progress')
        .select(`
          id,
          subject,
          score,
          max_score,
          completed_at
        `)
        .order('completed_at', { ascending: false });

      if (progressError) {
        throw progressError;
      }

      // Calculate percentage and format data
      const formattedProgress: ProgressData[] = (progress || []).map(item => ({
        ...item,
        percentage: Math.round((item.score / item.max_score) * 100)
      }));

      setProgressData(formattedProgress);

      // Calculate subject averages
      const subjectMap = new Map<string, { total: number; count: number }>();
      formattedProgress.forEach(item => {
        const existing = subjectMap.get(item.subject) || { total: 0, count: 0 };
        subjectMap.set(item.subject, {
          total: existing.total + item.percentage,
          count: existing.count + 1
        });
      });

      const averages: SubjectAverage[] = Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        average: Math.round(data.total / data.count),
        count: data.count
      }));

      setSubjectAverages(averages);

      // Calculate weekly progress (last 8 weeks)
      const weeklyMap = new Map<string, { total: number; count: number }>();
      const now = new Date();
      
      formattedProgress.forEach(item => {
        const itemDate = new Date(item.completed_at);
        const weeksDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        
        if (weeksDiff < 8) {
          const weekKey = `Week ${8 - weeksDiff}`;
          const existing = weeklyMap.get(weekKey) || { total: 0, count: 0 };
          weeklyMap.set(weekKey, {
            total: existing.total + item.percentage,
            count: existing.count + 1
          });
        }
      });

      const weekly: WeeklyProgress[] = Array.from(weeklyMap.entries()).map(([week, data]) => ({
        week,
        averageScore: Math.round(data.total / data.count)
      })).sort((a, b) => {
        const aNum = parseInt(a.week.split(' ')[1]);
        const bNum = parseInt(b.week.split(' ')[1]);
        return aNum - bNum;
      });

      setWeeklyProgress(weekly);

    } catch (err) {
      console.error('Error fetching student progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress data');
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchStudentProgress}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const overallAverage = subjectAverages.length > 0 
    ? Math.round(subjectAverages.reduce((sum, subject) => sum + subject.average, 0) / subjectAverages.length)
    : 0;

  const recentTests = progressData.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {(() => {
                    if (!userSession?.profile) return 'Student';
                    if ('first_name' in userSession.profile) {
                      return userSession.profile.first_name;
                    }
                    return 'Student';
                  })()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{overallAverage}%</div>
                  <div className="text-sm text-gray-500">Overall Average</div>
                </div>
                <button
                  onClick={fetchStudentProgress}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {progressData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Progress Data</h3>
            <p className="text-gray-500">
              You don&apos;t have any test scores recorded yet. Check back after completing some assessments.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">{progressData.length}</div>
                <div className="text-sm text-gray-500">Total Tests</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">{overallAverage}%</div>
                <div className="text-sm text-gray-500">Overall Average</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">{subjectAverages.length}</div>
                <div className="text-sm text-gray-500">Subjects</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-orange-600">
                  {progressData.filter(p => p.percentage >= 80).length}
                </div>
                <div className="text-sm text-gray-500">Tests ≥80%</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Subject Averages Chart */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Averages</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectAverages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Average']} />
                    <Bar dataKey="average" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly Progress Chart */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Progress</h3>
                {weeklyProgress.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                      <Line type="monotone" dataKey="averageScore" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Not enough data for weekly trend
                  </div>
                )}
              </div>
            </div>

            {/* Recent Tests Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Test Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTests.map((test) => (
                      <tr key={test.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {test.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {test.score}/{test.max_score}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            let className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full ';
                            if (test.percentage >= 80) {
                              className += 'bg-green-100 text-green-800';
                            } else if (test.percentage >= 60) {
                              className += 'bg-yellow-100 text-yellow-800';
                            } else {
                              className += 'bg-red-100 text-red-800';
                            }
                            return (
                              <span className={className}>
                                {test.percentage}%
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(test.completed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}