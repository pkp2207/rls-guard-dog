-- RLS Guard Dog Database Schema
-- Created: September 19, 2025
-- Description: Database schema for role-based access control system with schools, teachers, students, and progress tracking

-- Create custom types for user roles
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'head_teacher');
CREATE TYPE subject_type AS ENUM ('math', 'science', 'english', 'history', 'geography', 'arts', 'pe', 'other');

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'teacher',
  classes TEXT[], -- Array of class names they teach
  subjects subject_type[] DEFAULT '{}', -- Array of subjects they teach
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT teachers_role_check CHECK (role IN ('teacher', 'head_teacher'))
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  year_group INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  subject subject_type NOT NULL,
  assignment_name VARCHAR(255) NOT NULL,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  max_score DECIMAL(5,2) NOT NULL DEFAULT 100 CHECK (max_score > 0),
  percentage_score DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score / max_score) * 100, 2)) STORED,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_progress_student_id ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_teacher_id ON progress(teacher_id);
CREATE INDEX IF NOT EXISTS idx_progress_school_id ON progress(school_id);
CREATE INDEX IF NOT EXISTS idx_progress_subject ON progress(subject);
CREATE INDEX IF NOT EXISTS idx_progress_completed_at ON progress(completed_at);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schools table
CREATE POLICY "Users can view schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert schools" ON schools FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update schools" ON schools FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for teachers table
CREATE POLICY "Teachers can view their own profile" ON teachers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view other teachers in same school" ON teachers FOR SELECT USING (
  school_id IN (
    SELECT school_id FROM teachers WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Service role can manage teachers" ON teachers FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Authenticated users can insert teachers" ON teachers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Teachers can update their own profile" ON teachers FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for students table
CREATE POLICY "Students can view their own profile" ON students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view students in their school" ON students FOR SELECT USING (
  school_id IN (
    SELECT school_id FROM teachers WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Service role can manage students" ON students FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Authenticated users can insert students" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Students can update their own profile" ON students FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for progress table
CREATE POLICY "Students can view their own progress" ON progress FOR SELECT USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Teachers can view progress for their school" ON progress FOR SELECT USING (
  school_id IN (
    SELECT school_id FROM teachers WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Teachers can insert progress" ON progress FOR INSERT WITH CHECK (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Teachers can update progress they created" ON progress FOR UPDATE USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Teachers can delete progress they created" ON progress FOR DELETE USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Service role can manage progress" ON progress FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');