// Supabase Database Types
// This file should be generated using: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
// For now, we'll use a placeholder that extends our database types

import type {
  School,
  Teacher,
  Student,
  Progress,
  UserRole,
  SubjectType,
  StudentProgressSummary
} from './database';

// Type aliases for common patterns
type CommonTimestamps = 'id' | 'created_at' | 'updated_at';
type InsertType<T> = Omit<T, CommonTimestamps>;
type UpdateType<T> = Partial<Omit<T, CommonTimestamps>>;

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: School;
        Insert: InsertType<School>;
        Update: UpdateType<School>;
      };
      teachers: {
        Row: Teacher;
        Insert: InsertType<Teacher>;
        Update: UpdateType<Teacher>;
      };
      students: {
        Row: Student;
        Insert: InsertType<Student>;
        Update: UpdateType<Student>;
      };
      progress: {
        Row: Progress;
        Insert: Omit<Progress, 'id' | 'percentage_score' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Progress, 'id' | 'percentage_score' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      student_progress_summary: {
        Row: StudentProgressSummary;
      };
    };
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      get_current_user_school_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_sample_progress: {
        Args: {
          p_student_id: string;
          p_teacher_id: string;
          p_school_id: string;
          p_subject: SubjectType;
          p_num_entries?: number;
        };
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
      subject_type: SubjectType;
    };
  };
}