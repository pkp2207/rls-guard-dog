// Teacher Dashboard for RLS Guard Dog
// Created: September 19, 2025
// Description: Protected teacher dashboard with ability to view and edit student progress

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  class_level: string;
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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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

  const subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography'];

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
          class_level
        `)
        .order('last_name');

      if (studentsError) {
        throw studentsError;
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
        throw progressError;
      }

      // Format progress data with calculated percentages and student names
      const formattedProgress: ProgressRecord[] = (progressData || []).map(item => {
        const studentData = Array.isArray(item.students) && item.students.length > 0 ? item.students[0] : null;
        return {
          ...item,
          percentage: Math.round((item.score / item.max_score) * 100),
          student_name: studentData 
            ? `${studentData.first_name} ${studentData.last_name}` 
            : 'Unknown'
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
  }, []);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teacher dashboard...</p>
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
            onClick={fetchTeacherData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
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
                  <div className="text-2xl font-bold text-blue-600">{overallClassAverage}%</div>
                  <div className="text-sm text-gray-500">Class Average</div>
                </div>
                <button
                  onClick={() => setShowNewProgressForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Progress
                </button>
                <button
                  onClick={fetchTeacherData}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Refresh
                </button>
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
            <div className="text-2xl font-bold text-blue-600">{students.length}</div>
            <div className="text-sm text-gray-500">Total Students</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{progressData.length}</div>
            <div className="text-sm text-gray-500">Progress Records</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{classStats.length}</div>
            <div className="text-sm text-gray-500">Active Subjects</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{overallClassAverage}%</div>
            <div className="text-sm text-gray-500">Class Average</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Subject Performance Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Performance</h3>
            {classStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Average']} />
                  <Bar dataKey="average" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No performance data available
              </div>
            )}
          </div>

          {/* Grade Distribution Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Distribution</h3>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No grade data available
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Progress Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select
                id="student-filter"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Students</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                id="subject-filter"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Progress Records Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Progress Records ({filteredProgress.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProgress.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingProgress?.id === record.id ? (
                        <div className="flex space-x-1">
                          <input
                            type="number"
                            value={editingProgress.score}
                            onChange={(e) => setEditingProgress({
                              ...editingProgress,
                              score: parseInt(e.target.value) || 0
                            })}
                            className="w-16 border border-gray-300 rounded px-2 py-1"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            value={editingProgress.max_score}
                            onChange={(e) => setEditingProgress({
                              ...editingProgress,
                              max_score: parseInt(e.target.value) || 100
                            })}
                            className="w-16 border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                      ) : (
                        `${record.score}/${record.max_score}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        let className = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full ';
                        if (record.percentage >= 80) {
                          className += 'bg-green-100 text-green-800';
                        } else if (record.percentage >= 60) {
                          className += 'bg-yellow-100 text-yellow-800';
                        } else {
                          className += 'bg-red-100 text-red-800';
                        }
                        return (
                          <span className={className}>
                            {record.percentage}%
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.completed_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingProgress?.id === record.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateProgress(record.id, editingProgress.score, editingProgress.max_score)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProgress(null)}
                            className="text-gray-600 hover:text-gray-900"
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
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProgress(record.id)}
                            className="text-red-600 hover:text-red-900"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Progress Record</h3>
              <form onSubmit={handleAddProgress} className="space-y-4">
                <div>
                  <label htmlFor="new-student-select" className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select
                    id="new-student-select"
                    value={newProgressForm.student_id}
                    onChange={(e) => setNewProgressForm({...newProgressForm, student_id: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-subject-select" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    id="new-subject-select"
                    value={newProgressForm.subject}
                    onChange={(e) => setNewProgressForm({...newProgressForm, subject: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="new-score-input" className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                    <input
                      id="new-score-input"
                      type="number"
                      value={newProgressForm.score}
                      onChange={(e) => setNewProgressForm({...newProgressForm, score: e.target.value})}
                      required
                      min="0"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-maxscore-input" className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
                    <input
                      id="new-maxscore-input"
                      type="number"
                      value={newProgressForm.max_score}
                      onChange={(e) => setNewProgressForm({...newProgressForm, max_score: e.target.value})}
                      required
                      min="1"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewProgressForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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