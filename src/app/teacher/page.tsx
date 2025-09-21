// Teacher Dashboard for RLS Guard Dog
// Created: September 19, 2025
// Description: Protected teacher dashboard with ability to view and edit student progress

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClientComponentClient } from '@/lib/supabase';
import LogoutButton from '@/components/ui/logout-button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  class_name: string;
}

interface ProgressRecord {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  max_score: number;
  completed_at: string;
  percentage: number;
  student_name: string;
}

interface ClassStats {
  subject: string;
  average: number;
  count: number;
  students: number;
}

interface EditingProgress {
  id: string;
  score: number;
  max_score: number;
}

const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

export default function TeacherDashboard() {
  const { user, userSession, loading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [progressData, setProgressData] = useState<ProgressRecord[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProgress, setEditingProgress] = useState<EditingProgress | null>(null);
  const [newProgressForm, setNewProgressForm] = useState({
    student_id: '',
    subject: '',
    score: '',
    max_score: '100'
  });
  const [showNewProgressForm, setShowNewProgressForm] = useState(false);

  const subjects = ['math', 'science', 'english', 'history', 'geography', 'arts', 'pe', 'other'];

  const supabase = createClientComponentClient();

  const fetchTeacherData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);

      // Fetch students under this teacher (RLS will filter automatically)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          email,
          class_name
        `)
        .order('last_name');

      if (studentsError) {
        console.error('Students query error:', studentsError);
        throw new Error(`Failed to fetch students: ${studentsError.message}`);
      }

  setStudents(studentsData || []);

      // Fetch progress data for all students under this teacher
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select(`
          id,
          student_id,
          subject,
          score,
          max_score,
          completed_at,
          students (
            first_name,
            last_name
          )
        `)
        .order('completed_at', { ascending: false });

      if (progressError) {
        console.error('Progress query error:', progressError);
        throw new Error(`Failed to fetch progress: ${progressError.message}`);
      }

      // Build a quick lookup from student_id -> name as a fallback if nested relation is null
      const studentNameLookup = new Map<string, string>(
        (studentsData || []).map((s) => [s.id, `${s.first_name} ${s.last_name}`])
      );

      // Format progress data with calculated percentages and student names
      const formattedProgress: ProgressRecord[] = (progressData || []).map((item) => {
        // Handle both single object and array responses from Supabase relation
        const studentData = Array.isArray(item.students) 
          ? item.students[0] 
          : item.students;
        const fallbackName = studentNameLookup.get(item.student_id);
        
        return {
          ...item,
          percentage: Math.round((item.score / item.max_score) * 100),
          student_name: studentData
            ? `${studentData.first_name} ${studentData.last_name}`
            : (fallbackName || 'Unknown')
        };
      });

      setProgressData(formattedProgress);

      // Calculate class statistics by subject
      const statsMap = new Map<string, { total: number; count: number; studentIds: Set<string> }>();
      formattedProgress.forEach(item => {
        const existing = statsMap.get(item.subject) || { total: 0, count: 0, studentIds: new Set() };
        statsMap.set(item.subject, {
          total: existing.total + item.percentage,
          count: existing.count + 1,
          studentIds: existing.studentIds.add(item.student_id)
        });
      });

      const stats: ClassStats[] = Array.from(statsMap.entries()).map(([subject, data]) => ({
        subject,
        average: Math.round(data.total / data.count),
        count: data.count,
        students: data.studentIds.size
      }));

      setClassStats(stats);

    } catch (err) {
      console.error('Error fetching teacher data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teacher data');
    } finally {
      setLoadingData(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!loading && userSession) {
      if (userSession.role === 'student') {
        // Redirect students away from teacher dashboard
        window.location.href = '/student';
        return;
      }
      
      fetchTeacherData();
    }
  }, [user, userSession, loading, fetchTeacherData]);

  const handleUpdateProgress = async (progressId: string, newScore: number, newMaxScore: number) => {
    try {
      const { error } = await supabase
        .from('progress')
        .update({
          score: newScore,
          max_score: newMaxScore
        })
        .eq('id', progressId);

      if (error) {
        throw error;
      }

      // Refresh data after update
      await fetchTeacherData();
      setEditingProgress(null);
    } catch (err) {
      console.error('Error updating progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to update progress');
    }
  };

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('progress')
        .insert([{
          student_id: newProgressForm.student_id,
          subject: newProgressForm.subject,
          score: parseInt(newProgressForm.score),
          max_score: parseInt(newProgressForm.max_score)
        }]);

      if (error) {
        throw error;
      }

      // Reset form and refresh data
      setNewProgressForm({
        student_id: '',
        subject: '',
        score: '',
        max_score: '100'
      });
      setShowNewProgressForm(false);
      await fetchTeacherData();
    } catch (err) {
      console.error('Error adding progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to add progress');
    }
  };

  const handleDeleteProgress = async (progressId: string) => {
    if (!confirm('Are you sure you want to delete this progress record?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('progress')
        .delete()
        .eq('id', progressId);

      if (error) {
        throw error;
      }

      await fetchTeacherData();
    } catch (err) {
      console.error('Error deleting progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete progress');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading teacher dashboard...</p>
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
            onClick={fetchTeacherData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter progress data based on selected student and subject
  const filteredProgress = progressData.filter(item => {
    const studentMatch = selectedStudent === 'all' || item.student_id === selectedStudent;
    const subjectMatch = selectedSubject === 'all' || item.subject === selectedSubject;
    return studentMatch && subjectMatch;
  });

  const gradeDistributionData = [
    { name: 'A (90-100%)', value: progressData.filter(p => p.percentage >= 90).length },
    { name: 'B (80-89%)', value: progressData.filter(p => p.percentage >= 80 && p.percentage < 90).length },
    { name: 'C (70-79%)', value: progressData.filter(p => p.percentage >= 70 && p.percentage < 80).length },
    { name: 'D (60-69%)', value: progressData.filter(p => p.percentage >= 60 && p.percentage < 70).length },
    { name: 'F (<60%)', value: progressData.filter(p => p.percentage < 60).length }
  ].filter(item => item.value > 0);

  const overallClassAverage = classStats.length > 0 
    ? Math.round(classStats.reduce((sum, stat) => sum + stat.average, 0) / classStats.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-50">Teacher Dashboard</h1>
                <p className="mt-1 text-sm text-slate-300">
                  Welcome, {(() => {
                    if (!userSession?.profile) return 'Teacher';
                    if ('first_name' in userSession.profile) {
                      return userSession.profile.first_name;
                    }
                    return 'Teacher';
                  })()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">{overallClassAverage}%</div>
                  <div className="text-sm text-slate-400">Class Average</div>
                </div>
                <button
                  onClick={() => setShowNewProgressForm(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                >
                  Add Progress
                </button>
                <button
                  onClick={fetchTeacherData}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                >
                  Refresh
                </button>
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
            <div className="text-2xl font-bold text-blue-400">{students.length}</div>
            <div className="text-sm text-slate-400">Total Students</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <div className="text-2xl font-bold text-green-400">{progressData.length}</div>
            <div className="text-sm text-slate-400">Progress Records</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <div className="text-2xl font-bold text-purple-400">{classStats.length}</div>
            <div className="text-sm text-slate-400">Active Subjects</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <div className="text-2xl font-bold text-orange-400">{overallClassAverage}%</div>
            <div className="text-sm text-slate-400">Class Average</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Subject Performance Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <h3 className="text-lg font-medium text-slate-50 mb-4">Subject Performance</h3>
            {classStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classStats}>
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
                  <Bar dataKey="average" fill="#60A5FA" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                No performance data available
              </div>
            )}
          </div>

          {/* Grade Distribution Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700">
            <h3 className="text-lg font-medium text-slate-50 mb-4">Grade Distribution</h3>
            {progressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
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
                No grade data available
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-slate-700 mb-8">
          <h3 className="text-lg font-medium text-slate-50 mb-4">Filter Progress Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student-filter" className="block text-sm font-medium text-slate-300 mb-2">Student</label>
              <select
                id="student-filter"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:border-slate-500 transition-colors duration-200 backdrop-blur-sm"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all" className="py-2 px-3 text-slate-200 bg-slate-800">All Students</option>
                {students.map(student => (
                  <option key={student.id} value={student.id} className="py-2 px-3 text-slate-200 bg-slate-800">
                    {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subject-filter" className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <select
                id="subject-filter"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:border-slate-500 transition-colors duration-200 backdrop-blur-sm"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all" className="py-2 px-3 text-slate-200 bg-slate-800">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject} className="py-2 px-3 text-slate-200 bg-slate-800">
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Progress Records Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700">
          <div className="px-6 py-4 border-b border-slate-600">
            <h3 className="text-lg font-medium text-slate-50">
              Progress Records ({filteredProgress.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Student
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/30 divide-y divide-slate-600">
                {filteredProgress.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                      {record.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {record.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {editingProgress?.id === record.id ? (
                        <div className="flex space-x-1 items-center">
                          <input
                            type="number"
                            value={editingProgress.score}
                            onChange={(e) => setEditingProgress({
                              ...editingProgress,
                              score: parseInt(e.target.value) || 0
                            })}
                            className="w-16 border border-slate-600 rounded px-2 py-1 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-slate-500 transition-colors duration-200"
                          />
                          <span className="text-slate-400">/</span>
                          <input
                            type="number"
                            value={editingProgress.max_score}
                            onChange={(e) => setEditingProgress({
                              ...editingProgress,
                              max_score: parseInt(e.target.value) || 100
                            })}
                            className="w-16 border border-slate-600 rounded px-2 py-1 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-slate-500 transition-colors duration-200"
                          />
                        </div>
                      ) : (
                        `${record.score}/${record.max_score}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        let className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full border ';
                        if (record.percentage >= 80) {
                          className += 'bg-green-500/20 text-green-400 border-green-500/30';
                        } else if (record.percentage >= 60) {
                          className += 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                        } else {
                          className += 'bg-red-500/20 text-red-400 border-red-500/30';
                        }
                        return (
                          <span className={className}>
                            {record.percentage}%
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(record.completed_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingProgress?.id === record.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateProgress(record.id, editingProgress.score, editingProgress.max_score)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProgress(null)}
                            className="text-slate-400 hover:text-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingProgress({
                              id: record.id,
                              score: record.score,
                              max_score: record.max_score
                            })}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProgress(record.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Progress Modal */}
      {showNewProgressForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-slate-700 w-96 shadow-2xl rounded-xl bg-slate-800/90 backdrop-blur-sm">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-slate-50 mb-4">Add New Progress Record</h3>
              <form onSubmit={handleAddProgress} className="space-y-4">
                <div>
                  <label htmlFor="new-student-select" className="block text-sm font-medium text-slate-300 mb-1">Student</label>
                  <select
                    id="new-student-select"
                    value={newProgressForm.student_id}
                    onChange={(e) => setNewProgressForm({...newProgressForm, student_id: e.target.value})}
                    required
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:border-slate-500 transition-colors duration-200"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23cbd5e1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="" className="py-2 px-3 text-slate-400 bg-slate-700">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id} className="py-2 px-3 text-slate-200 bg-slate-700">
                        {student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-subject-select" className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                  <select
                    id="new-subject-select"
                    value={newProgressForm.subject}
                    onChange={(e) => setNewProgressForm({...newProgressForm, subject: e.target.value})}
                    required
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer hover:border-slate-500 transition-colors duration-200"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23cbd5e1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="" className="py-2 px-3 text-slate-400 bg-slate-700">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject} className="py-2 px-3 text-slate-200 bg-slate-700">
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="new-score-input" className="block text-sm font-medium text-slate-300 mb-1">Score</label>
                    <input
                      id="new-score-input"
                      type="number"
                      value={newProgressForm.score}
                      onChange={(e) => setNewProgressForm({...newProgressForm, score: e.target.value})}
                      required
                      min="0"
                      className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-slate-500 transition-colors duration-200 placeholder-slate-400"
                      placeholder="Enter score"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-maxscore-input" className="block text-sm font-medium text-slate-300 mb-1">Max Score</label>
                    <input
                      id="new-maxscore-input"
                      type="number"
                      value={newProgressForm.max_score}
                      onChange={(e) => setNewProgressForm({...newProgressForm, max_score: e.target.value})}
                      required
                      min="1"
                      className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700/50 text-slate-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none hover:border-slate-500 transition-colors duration-200 placeholder-slate-400"
                      placeholder="Enter max score"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewProgressForm(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Add Progress
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}