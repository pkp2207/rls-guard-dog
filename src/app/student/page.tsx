// Student Dashboard for RLS Guard Dog
// Created: September 20, 2025
// Description: Protected student dashboard showing personal progress, charts, and statistics

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClientComponentClient } from '@/lib/supabase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  class_name: string;
  year_group: number;
  school_id: string;
}

interface ProgressRecord {
  id: string;
  subject: string;
  assignment_name: string;
  score: number;
  max_score: number;
  percentage_score: number;
  notes: string | null;
  completed_at: string;
  created_at: string;
}

interface SubjectSummary {
  subject: string;
  total_assignments: number;
  average_score: number;
  average_percentage: number;
  best_score: number;
  latest_assignment: string;
  trend: 'improving' | 'declining' | 'stable';
}

interface RecentActivity {
  assignment_name: string;
  subject: string;
  score: number;
  max_score: number;
  percentage: number;
  completed_at: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316'];

const SUBJECT_COLORS: Record<string, string> = {
  math: '#3B82F6',
  science: '#10B981', 
  english: '#F59E0B',
  history: '#EF4444',
  geography: '#8B5CF6',
  arts: '#EC4899',
  pe: '#F97316',
  other: '#6B7280'
};

export default function StudentDashboard() {
  const { user, userSession, loading } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [progressData, setProgressData] = useState<ProgressRecord[]>([]);
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectSummary[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const supabase = createClientComponentClient();

  const fetchStudentData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      if (!userSession?.profile) {
        throw new Error('Student profile not found');
      }

      // Set student data from session
      const studentProfile = userSession.profile as Student;
      setStudent(studentProfile);

      // Fetch student's progress data (RLS will automatically filter to this student)
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select(`
          id,
          subject,
          assignment_name,
          score,
          max_score,
          percentage_score,
          notes,
          completed_at,
          created_at
        `)
        .order('completed_at', { ascending: false });

      if (progressError) {
        console.error('Progress query error:', progressError);
        throw new Error(`Failed to fetch progress: ${progressError.message}`);
      }

      const formattedProgress = (progressData || []).map(item => ({
        ...item,
        percentage_score: Math.round((item.score / item.max_score) * 100)
      }));

      setProgressData(formattedProgress);

      // Calculate subject summaries
      const subjectMap = new Map<string, {
        scores: number[];
        percentages: number[];
        assignments: { name: string; date: string; percentage: number }[];
      }>();

      formattedProgress.forEach(record => {
        if (!subjectMap.has(record.subject)) {
          subjectMap.set(record.subject, {
            scores: [],
            percentages: [],
            assignments: []
          });
        }
        
        const subjectData = subjectMap.get(record.subject)!;
        subjectData.scores.push(record.score);
        subjectData.percentages.push(record.percentage_score);
        subjectData.assignments.push({
          name: record.assignment_name,
          date: record.completed_at,
          percentage: record.percentage_score
        });
      });

      const summaries: SubjectSummary[] = Array.from(subjectMap.entries()).map(([subject, data]) => {
        const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const avgPercentage = data.percentages.reduce((a, b) => a + b, 0) / data.percentages.length;
        const bestScore = Math.max(...data.percentages);
        
        // Calculate trend (comparing first half vs second half of assignments)
        const midpoint = Math.floor(data.assignments.length / 2);
        const firstHalf = data.assignments.slice(-midpoint);
        const secondHalf = data.assignments.slice(0, midpoint);
        
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (firstHalf.length > 0 && secondHalf.length > 0) {
          const firstAvg = firstHalf.reduce((a, b) => a + b.percentage, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b.percentage, 0) / secondHalf.length;
          
          if (secondAvg > firstAvg + 5) trend = 'improving';
          else if (secondAvg < firstAvg - 5) trend = 'declining';
        }

        return {
          subject,
          total_assignments: data.assignments.length,
          average_score: Math.round(avgScore * 100) / 100,
          average_percentage: Math.round(avgPercentage * 100) / 100,
          best_score: bestScore,
          latest_assignment: data.assignments[0]?.date || '',
          trend
        };
      });

      setSubjectSummaries(summaries);

      // Set recent activity (last 5 assignments)
      const recent = formattedProgress.slice(0, 5).map(record => ({
        assignment_name: record.assignment_name,
        subject: record.subject,
        score: record.score,
        max_score: record.max_score,
        percentage: record.percentage_score,
        completed_at: record.completed_at
      }));

      setRecentActivity(recent);

    } catch (err) {
      console.error('Error fetching student data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoadingData(false);
    }
  }, [supabase, userSession]);

  useEffect(() => {
    if (!loading && userSession) {
      if (userSession.role !== 'student') {
        // Redirect non-students away from student dashboard
        window.location.href = '/teacher';
        return;
      }
      
      fetchStudentData();
    }
  }, [user, userSession, loading, fetchStudentData]);

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
            onClick={fetchStudentData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter progress data for charts
  const filteredProgress = selectedSubject === 'all' 
    ? progressData 
    : progressData.filter(p => p.subject === selectedSubject);

  // Prepare chart data
  const progressOverTime = filteredProgress
    .slice(0, 10)
    .reverse()
    .map(record => ({
      name: record.assignment_name.substring(0, 15) + '...',
      score: record.percentage_score,
      date: new Date(record.completed_at).toLocaleDateString(),
      subject: record.subject
    }));

  const subjectDistribution = subjectSummaries.map(summary => ({
    name: summary.subject,
    value: summary.total_assignments,
    average: summary.average_percentage
  }));

  const overallAverage = subjectSummaries.length > 0
    ? Math.round(subjectSummaries.reduce((sum, s) => sum + s.average_percentage, 0) / subjectSummaries.length)
    : 0;

  const totalAssignments = progressData.length;
  const bestSubject = subjectSummaries.reduce((best, current) => 
    current.average_percentage > best.average_percentage ? current : best, 
    { subject: 'N/A', average_percentage: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Progress Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {student?.first_name} {student?.last_name}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <span>📚 Class: {student?.class_name}</span>
                  <span>🏫 Year {student?.year_group}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{overallAverage}%</div>
                <div className="text-sm text-gray-500">Overall Average</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{totalAssignments}</div>
            <div className="text-sm text-gray-500">Total Assignments</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{overallAverage}%</div>
            <div className="text-sm text-gray-500">Overall Average</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{subjectSummaries.length}</div>
            <div className="text-sm text-gray-500">Subjects</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{bestSubject.subject}</div>
            <div className="text-sm text-gray-500">Best Subject ({Math.round(bestSubject.average_percentage)}%)</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Progress Over Time */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Progress</h3>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">All Subjects</option>
                {subjectSummaries.map(subject => (
                  <option key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </option>
                ))}
              </select>
            </div>
            {progressOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Score']}
                    labelFormatter={(label) => `Assignment: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No progress data available
              </div>
            )}
          </div>

          {/* Subject Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Distribution</h3>
            {subjectDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell 
                        key={entry.name} 
                        fill={SUBJECT_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No subject data available
              </div>
            )}
          </div>
        </div>

        {/* Subject Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Performance</h3>
          {subjectSummaries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectSummaries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Average']} />
                <Bar dataKey="average_percentage" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No performance data available
            </div>
          )}
        </div>

        {/* Subject Summaries */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Subject Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjectSummaries.map((summary) => (
                <div key={summary.subject} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize text-gray-900">{summary.subject}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${(() => {
                      if (summary.trend === 'improving') return 'bg-green-100 text-green-800';
                      if (summary.trend === 'declining') return 'bg-red-100 text-red-800';
                      return 'bg-gray-100 text-gray-800';
                    })()}`}>
                      {(() => {
                        if (summary.trend === 'improving') return '📈 Improving';
                        if (summary.trend === 'declining') return '📉 Declining';
                        return '➡️ Stable';
                      })()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignments:</span>
                      <span className="font-medium">{summary.total_assignments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average:</span>
                      <span className="font-medium">{summary.average_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best Score:</span>
                      <span className="font-medium text-green-600">{summary.best_score}%</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${(() => {
                          if (summary.average_percentage >= 80) return 'bg-green-500';
                          if (summary.average_percentage >= 60) return 'bg-yellow-500';
                          return 'bg-red-500';
                        })()}`}
                        style={{ width: `${Math.min(summary.average_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
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
                {recentActivity.map((activity, index) => (
                  <tr key={`${activity.assignment_name}-${activity.completed_at}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {activity.assignment_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {activity.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.score}/{activity.max_score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(() => {
                        if (activity.percentage >= 80) return 'bg-green-100 text-green-800';
                        if (activity.percentage >= 60) return 'bg-yellow-100 text-yellow-800';
                        return 'bg-red-100 text-red-800';
                      })()}`}>
                        {activity.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(activity.completed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recentActivity.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No recent activity found. Complete some assignments to see your progress here!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
