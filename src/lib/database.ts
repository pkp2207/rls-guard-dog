// Database utility functions for RLS Guard Dog
// Created: September 19, 2025
// Description: Helper functions for common database operations

import type { SupabaseClient } from './supabase';
import type {
  Student,
  Teacher,
  Progress,
  UserRole,
  SubjectType,
  ProgressFilters,
  StudentFilters,
  CreateProgressRequest,
  UpdateProgressRequest,
  ProgressWithRelations,
  StudentWithProgress
} from '@/types/database';

// User profile operations
export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  // First check if user is a teacher
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select(`
      *,
      schools (*)
    `)
    .eq('user_id', userId)
    .single();

  if (teacher && !teacherError) {
    return { profile: teacher, role: teacher.role as UserRole };
  }

  // Then check if user is a student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      schools (*)
    `)
    .eq('user_id', userId)
    .single();

  if (student && !studentError) {
    return { profile: student, role: 'student' as UserRole };
  }

  throw new Error('User profile not found');
}

// Progress operations
export async function getStudentProgress(
  supabase: SupabaseClient,
  studentId: string,
  filters?: ProgressFilters
) {
  let query = supabase
    .from('progress')
    .select(`
      *,
      teachers (id, first_name, last_name),
      students (id, first_name, last_name, class_name)
    `)
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false });

  if (filters?.subject) {
    query = query.eq('subject', filters.subject);
  }

  if (filters?.date_from) {
    query = query.gte('completed_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('completed_at', filters.date_to);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ProgressWithRelations[];
}

export async function getTeacherStudentsProgress(
  supabase: SupabaseClient,
  teacherId: string,
  filters?: ProgressFilters & StudentFilters
) {
  // First get the teacher's classes
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('classes, role, school_id')
    .eq('id', teacherId)
    .single();

  if (teacherError) throw teacherError;

  let studentsQuery = supabase
    .from('students')
    .select(`
      *,
      progress (
        *,
        teachers (id, first_name, last_name)
      )
    `)
    .eq('school_id', teacher.school_id);

  // Regular teachers only see their classes, head teachers see all
  if (teacher.role !== 'head_teacher') {
    studentsQuery = studentsQuery.in('class_name', teacher.classes);
  }

  if (filters?.class_name) {
    studentsQuery = studentsQuery.eq('class_name', filters.class_name);
  }

  if (filters?.year_group) {
    studentsQuery = studentsQuery.eq('year_group', filters.year_group);
  }

  if (filters?.search) {
    studentsQuery = studentsQuery.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await studentsQuery;

  if (error) throw error;
  return data as StudentWithProgress[];
}

export async function createProgress(
  supabase: SupabaseClient,
  progressData: CreateProgressRequest
): Promise<Progress> {
  // Get current user (teacher) info
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, school_id')
    .eq('user_id', user.id)
    .single();

  if (!teacher) throw new Error('Teacher profile not found');

  const { data, error } = await supabase
    .from('progress')
    .insert({
      ...progressData,
      teacher_id: teacher.id,
      school_id: teacher.school_id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProgress(
  supabase: SupabaseClient,
  progressData: UpdateProgressRequest
): Promise<Progress> {
  const { id, ...updateData } = progressData;

  const { data, error } = await supabase
    .from('progress')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProgress(
  supabase: SupabaseClient,
  progressId: string
): Promise<void> {
  const { error } = await supabase
    .from('progress')
    .delete()
    .eq('id', progressId);

  if (error) throw error;
}

// Student operations
export async function getStudentsByClass(
  supabase: SupabaseClient,
  className: string,
  schoolId?: string
) {
  let query = supabase
    .from('students')
    .select('*')
    .eq('class_name', className)
    .order('last_name');

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Statistics and summary operations
export async function getStudentSubjectAverages(
  supabase: SupabaseClient,
  studentId: string
) {
  const { data, error } = await supabase
    .from('student_progress_summary')
    .select('*')
    .eq('student_id', studentId);

  if (error) throw error;
  return data;
}

export async function getClassAverages(
  supabase: SupabaseClient,
  className: string,
  schoolId: string,
  subject?: SubjectType
) {
  let query = supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      progress!inner (
        subject,
        percentage_score
      )
    `)
    .eq('class_name', className)
    .eq('school_id', schoolId);

  if (subject) {
    query = query.eq('progress.subject', subject);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Calculate averages
  const subjectAverages: Record<string, { total: number; count: number; students: string[] }> = {};

  // Type for the nested query result
  interface StudentWithProgressData {
    id: string;
    first_name: string;
    last_name: string;
    progress: Array<{
      subject: string;
      percentage_score: number;
    }>;
  }

  (data as StudentWithProgressData[]).forEach((student) => {
    student.progress.forEach((progress) => {
      const key = progress.subject;
      if (!subjectAverages[key]) {
        subjectAverages[key] = { total: 0, count: 0, students: [] };
      }
      subjectAverages[key].total += progress.percentage_score;
      subjectAverages[key].count += 1;
      if (!subjectAverages[key].students.includes(student.id)) {
        subjectAverages[key].students.push(student.id);
      }
    });
  });

  return Object.entries(subjectAverages).map(([subject, stats]) => ({
    subject: subject as SubjectType,
    average: Math.round(stats.total / stats.count * 100) / 100,
    total_assignments: stats.count,
    total_students: stats.students.length,
    class_name: className
  }));
}

// School operations
export async function getSchoolStats(
  supabase: SupabaseClient,
  schoolId: string
) {
  const [studentsResult, teachersResult, progressResult] = await Promise.all([
    supabase.from('students').select('id').eq('school_id', schoolId),
    supabase.from('teachers').select('id').eq('school_id', schoolId),
    supabase.from('progress').select('id, percentage_score').eq('school_id', schoolId)
  ]);

  const totalStudents = studentsResult.data?.length || 0;
  const totalTeachers = teachersResult.data?.length || 0;
  const totalAssignments = progressResult.data?.length || 0;
  const averageScore = progressResult.data?.length
    ? Math.round(
        progressResult.data.reduce((sum, p) => sum + p.percentage_score, 0) / 
        progressResult.data.length * 100
      ) / 100
    : 0;

  return {
    total_students: totalStudents,
    total_teachers: totalTeachers,
    total_assignments: totalAssignments,
    average_score: averageScore
  };
}

// Recent activity
export async function getRecentProgress(
  supabase: SupabaseClient,
  schoolId?: string,
  studentId?: string,
  limit: number = 10
) {
  let query = supabase
    .from('progress')
    .select(`
      *,
      students (id, first_name, last_name, class_name),
      teachers (id, first_name, last_name)
    `)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ProgressWithRelations[];
}

// Authentication helpers
export async function signUpUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  userData: Partial<Student | Teacher>
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });

  if (error) throw error;
  return data;
}

export async function signInUser(
  supabase: SupabaseClient,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signOutUser(supabase: SupabaseClient) {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}