// Student Dashboard for RLS Guard Dog
// Created: September 20, 2025
// Description: Protected student dashboard showing personal progress, charts, and statistics

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClientComponentClient } from '@/lib/supabase';
import LogoutButton from '@/components/ui/logout-button';
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

const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#FB923C'];

const SUBJECT_COLORS: Record<string, string> = {
  math: '#60A5FA',
  science: '#34D399', 
  english: '#FBBF24',
  history: '#F87171',
  geography: '#A78BFA',
  arts: '#F472B6',
  pe: '#FB923C',
  other: '#9CA3AF'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <p className="text-slate-300 mb-4">{error}</p>
          <button 
            onClick={fetchStudentData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-50">My Progress Dashboard</h1>
                <p className="mt-1 text-sm text-slate-300">
                  Welcome back, {student?.first_name} {student?.last_name}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-slate-400">
                  <span>📚 Class: {student?.class_name}</span>
                  <span>🏫 Year {student?.year_group}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">{overallAverage}%</div>
                  <div className="text-sm text-slate-400">Overall Average</div>
                </div>
                <LogoutButton size="md" variant="danger" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <div className="text-2xl font-bold text-blue-400">{totalAssignments}</div>
            <div className="text-sm text-slate-400">Total Assignments</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <div className="text-2xl font-bold text-green-400">{overallAverage}%</div>
            <div className="text-sm text-slate-400">Overall Average</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <div className="text-2xl font-bold text-purple-400">{subjectSummaries.length}</div>
            <div className="text-sm text-slate-400">Subjects</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <div className="text-2xl font-bold text-orange-400">{bestSubject.subject}</div>
            <div className="text-sm text-slate-400">Best Subject ({Math.round(bestSubject.average_percentage)}%)</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Progress Over Time */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-50">Recent Progress</h3>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border border-slate-600 rounded-lg px-3 py-1 text-sm bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:border-slate-500 transition-colors duration-200 backdrop-blur-sm"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.2em 1.2em',
                  paddingRight: '2rem'
                }}
              >
                <option value="all" className="py-1 px-2 text-slate-200 bg-slate-800">All Subjects</option>
                {subjectSummaries.map(subject => (
                  <option key={subject.subject} value={subject.subject} className="py-1 px-2 text-slate-200 bg-slate-800">
                    {subject.subject}
                  </option>
                ))}
              </select>
            </div>
            {progressOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Score']}
                    labelFormatter={(label) => `Assignment: ${label}`}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#60A5FA" 
                    strokeWidth={3}
                    dot={{ fill: '#60A5FA', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                No progress data available
              </div>
            )}
          </div>

          {/* Subject Distribution */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <h3 className="text-lg font-medium text-slate-50 mb-4">Subject Distribution</h3>
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
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                No subject data available
              </div>
            )}
          </div>
        </div>

        {/* Subject Performance Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700 mb-8">
          <h3 className="text-lg font-medium text-slate-50 mb-4">Subject Performance</h3>
          {subjectSummaries.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectSummaries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Average']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="average_percentage" fill="#34D399" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-400">
              No performance data available
            </div>
          )}
        </div>

        {/* Subject Summaries */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700 mb-8">
          <div className="px-6 py-4 border-b border-slate-600">
            <h3 className="text-lg font-medium text-slate-50">Subject Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjectSummaries.map((summary) => (
                <div key={summary.subject} className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize text-slate-50">{summary.subject}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${(() => {
                      if (summary.trend === 'improving') return 'bg-green-500/20 text-green-400 border border-green-500/30';
                      if (summary.trend === 'declining') return 'bg-red-500/20 text-red-400 border border-red-500/30';
                      return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
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
                      <span className="text-slate-400">Assignments:</span>
                      <span className="font-medium text-slate-200">{summary.total_assignments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average:</span>
                      <span className="font-medium text-slate-200">{summary.average_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Best Score:</span>
                      <span className="font-medium text-green-400">{summary.best_score}%</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="bg-slate-600 rounded-full h-2">
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
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700">
          <div className="px-6 py-4 border-b border-slate-600">
            <h3 className="text-lg font-medium text-slate-50">Recent Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/30 divide-y divide-slate-600">
                {recentActivity.map((activity, index) => (
                  <tr key={`${activity.assignment_name}-${activity.completed_at}-${index}`} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                      {activity.assignment_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                      {activity.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {activity.score}/{activity.max_score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(() => {
                        if (activity.percentage >= 80) return 'bg-green-500/20 text-green-400 border border-green-500/30';
                        if (activity.percentage >= 60) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
                        return 'bg-red-500/20 text-red-400 border border-red-500/30';
                      })()}`}>
                        {activity.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(activity.completed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recentActivity.length === 0 && (
              <div className="px-6 py-8 text-center text-slate-400">
                No recent activity found. Complete some assignments to see your progress here!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
