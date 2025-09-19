-- ULTIMATE FIX: Simple RLS Policies without ANY recursion
-- Run this in your Supabase SQL Editor

-- ========== DISABLE RLS TEMPORARILY ==========
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;

-- ========== DROP ALL EXISTING POLICIES ==========
-- Schools
DROP POLICY IF EXISTS "Users can view schools" ON schools;
DROP POLICY IF EXISTS "Authenticated users can insert schools" ON schools;
DROP POLICY IF EXISTS "Authenticated users can update schools" ON schools;
DROP POLICY IF EXISTS "Anyone can view schools" ON schools;
DROP POLICY IF EXISTS "Authenticated users can manage schools" ON schools;
DROP POLICY IF EXISTS "Service role can manage all tables" ON schools;

-- Teachers
DROP POLICY IF EXISTS "Teachers can view their own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can view other teachers in same school" ON teachers;
DROP POLICY IF EXISTS "Service role can manage teachers" ON teachers;
DROP POLICY IF EXISTS "Authenticated users can insert teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;

-- Students
DROP POLICY IF EXISTS "Students can view their own profile" ON students;
DROP POLICY IF EXISTS "Teachers can view students in their school" ON students;
DROP POLICY IF EXISTS "Service role can manage students" ON students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON students;
DROP POLICY IF EXISTS "Students can update their own profile" ON students;

-- Progress
DROP POLICY IF EXISTS "Students can view their own progress" ON progress;
DROP POLICY IF EXISTS "Teachers can view progress for their school" ON progress;
DROP POLICY IF EXISTS "Teachers can insert progress" ON progress;
DROP POLICY IF EXISTS "Teachers can update progress they created" ON progress;
DROP POLICY IF EXISTS "Teachers can delete progress they created" ON progress;
DROP POLICY IF EXISTS "Service role can manage progress" ON progress;
DROP POLICY IF EXISTS "Teachers can view progress in their school" ON progress;

-- ========== CREATE SIMPLE, NON-RECURSIVE POLICIES ==========

-- Schools: Allow everyone to read, only service role to modify
CREATE POLICY "schools_select_policy" ON schools
  FOR SELECT USING (true);

CREATE POLICY "schools_modify_policy" ON schools
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Teachers: Only allow users to see their own record
CREATE POLICY "teachers_own_record_policy" ON teachers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "teachers_insert_policy" ON teachers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "teachers_update_own_policy" ON teachers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "teachers_service_role_policy" ON teachers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Students: Only allow users to see their own record
CREATE POLICY "students_own_record_policy" ON students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "students_insert_policy" ON students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "students_update_own_policy" ON students
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "students_service_role_policy" ON students
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Progress: Simple policies without cross-table references
CREATE POLICY "progress_service_role_policy" ON progress
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "progress_authenticated_read_policy" ON progress
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "progress_authenticated_write_policy" ON progress
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "progress_authenticated_update_policy" ON progress
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "progress_authenticated_delete_policy" ON progress
  FOR DELETE USING (auth.role() = 'authenticated');

-- ========== RE-ENABLE RLS ==========
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;