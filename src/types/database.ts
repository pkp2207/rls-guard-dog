// Database Types for RLS Guard Dog
// Created: September 19, 2025
// Description: TypeScript types matching the Supabase database schema

export type UserRole = 'student' | 'teacher' | 'head_teacher';

export type SubjectType = 
  | 'math' 
  | 'science' 
  | 'english' 
  | 'history' 
  | 'geography' 
  | 'arts' 
  | 'pe' 
  | 'other';

export interface School {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  classes: string[];
  subjects: SubjectType[];
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  school_id: string;
  email: string;
  first_name: string;
  last_name: string;
  class_name: string;
  year_group: number;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: string;
  student_id: string;
  teacher_id: string | null;
  school_id: string;
  subject: SubjectType;
  assignment_name: string;
  score: number;
  max_score: number;
  percentage_score: number;
  notes: string | null;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface StudentWithProgress extends Student {
  progress?: Progress[];
}

export interface ProgressWithRelations extends Progress {
  student?: Student;
  teacher?: Teacher;
  school?: School;
}

export interface TeacherWithRelations extends Teacher {
  school?: School;
}

export interface StudentProgressSummary {
  student_id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  year_group: number;
  subject: SubjectType;
  total_assignments: number;
  average_percentage: number;
  average_score: number;
  last_assignment_date: string;
}

// MongoDB types for class averages
export interface ClassAverage {
  _id?: string;
  school_id: string;
  class_id: string;
  class_name: string;
  subject: SubjectType;
  average_score: number;
  average_percentage: number;
  total_students: number;
  total_assignments: number;
  calculated_at: Date;
  month: number;
  year: number;
}

// Form types for API requests
export interface CreateProgressRequest {
  student_id: string;
  subject: SubjectType;
  assignment_name: string;
  score: number;
  max_score: number;
  notes?: string;
}

export interface UpdateProgressRequest extends Partial<CreateProgressRequest> {
  id: string;
}

export interface CreateStudentRequest {
  email: string;
  first_name: string;
  last_name: string;
  class_name: string;
  year_group: number;
  password: string;
}

export interface CreateTeacherRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  classes: string[];
  subjects: SubjectType[];
  password: string;
}

// Dashboard data types
export interface DashboardStats {
  total_students?: number;
  total_assignments?: number;
  average_score?: number;
  recent_assignments?: Progress[];
}

export interface StudentDashboardData extends DashboardStats {
  student: Student;
  progress: Progress[];
  subject_averages: Array<{
    subject: SubjectType;
    average: number;
    count: number;
  }>;
}

export interface TeacherDashboardData extends DashboardStats {
  teacher: Teacher;
  students: StudentWithProgress[];
  class_averages: ClassAverage[];
  recent_progress: ProgressWithRelations[];
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  subject?: string;
}

export interface ProgressChartData {
  subject_performance: ChartDataPoint[];
  progress_over_time: ChartDataPoint[];
  class_comparison: ChartDataPoint[];
}

// User session types
export interface UserSession {
  user_id: string;
  email: string;
  role: UserRole;
  school_id: string;
  profile: Student | Teacher;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Filter and query types
export interface ProgressFilters {
  student_id?: string;
  teacher_id?: string;
  subject?: SubjectType;
  class_name?: string;
  date_from?: string;
  date_to?: string;
  min_score?: number;
  max_score?: number;
}

export interface StudentFilters {
  class_name?: string;
  year_group?: number;
  search?: string;
}

// Export all subject types as array for form selects
export const SUBJECTS: SubjectType[] = [
  'math',
  'science', 
  'english',
  'history',
  'geography',
  'arts',
  'pe',
  'other'
];

export const ROLES: UserRole[] = [
  'student',
  'teacher', 
  'head_teacher'
];

// Helper type guards
export const isTeacher = (profile: Student | Teacher): profile is Teacher => {
  return 'role' in profile;
};

export const isStudent = (profile: Student | Teacher): profile is Student => {
  return 'class_name' in profile;
};

export const isHeadTeacher = (profile: Student | Teacher): boolean => {
  return isTeacher(profile) && profile.role === 'head_teacher';
};