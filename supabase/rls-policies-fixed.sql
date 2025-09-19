-- Fixed RLS Policies for RLS Guard Dog (No Recursion)
-- Created: September 19, 2025
-- Description: Simplified RLS policies that avoid infinite recursion

-- Drop existing policies and functions if they exist
DROP POLICY IF EXISTS "Users can view their own school" ON schools;
DROP POLICY IF EXISTS "Head teachers can update their school" ON schools;
DROP POLICY IF EXISTS "Teachers can view teachers in their school" ON teachers;
DROP POLICY IF EXISTS "Teachers can update their own profile" ON teachers;
DROP POLICY IF EXISTS "Head teachers can update teachers in their school" ON teachers;
DROP POLICY IF EXISTS "New teachers can insert their profile" ON teachers;
DROP POLICY IF EXISTS "Students can view their own profile" ON students;
DROP POLICY IF EXISTS "Teachers can view students in their school" ON students;
DROP POLICY IF EXISTS "Students can update their own profile" ON students;
DROP POLICY IF EXISTS "Teachers can update students in their school" ON students;
DROP POLICY IF EXISTS "New students can insert their profile" ON students;
DROP POLICY IF EXISTS "Students can view their own progress" ON progress;
DROP POLICY IF EXISTS "Teachers can view progress of students in their classes" ON progress;
DROP POLICY IF EXISTS "Teachers can insert progress for students in their classes" ON progress;
DROP POLICY IF EXISTS "Teachers can update progress for students in their classes" ON progress;
DROP POLICY IF EXISTS "Teachers can delete progress for students in their classes" ON progress;

DROP FUNCTION IF EXISTS get_current_user_role();
DROP FUNCTION IF EXISTS get_current_user_school_id();

-- Simple Schools table policies
CREATE POLICY "Anyone can view schools" ON schools
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage schools" ON schools
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Simple Teachers table policies
CREATE POLICY "Teachers can view their own profile" ON teachers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view other teachers in same school" ON teachers
  FOR SELECT
  USING (
    school_id IN (
      SELECT t.school_id FROM teachers t WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own profile" ON teachers
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert teachers" ON teachers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Simple Students table policies
CREATE POLICY "Students can view their own profile" ON students
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view students in their school" ON students
  FOR SELECT
  USING (
    school_id IN (
      SELECT t.school_id FROM teachers t WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own profile" ON students
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert students" ON students
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Simple Progress table policies
CREATE POLICY "Students can view their own progress" ON progress
  FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view progress in their school" ON progress
  FOR SELECT
  USING (
    school_id IN (
      SELECT t.school_id FROM teachers t WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert progress" ON progress
  FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()
    )
    AND school_id IN (
      SELECT t.school_id FROM teachers t WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update progress they created" ON progress
  FOR UPDATE
  USING (
    teacher_id IN (
      SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete progress they created" ON progress
  FOR DELETE
  USING (
    teacher_id IN (
      SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()
    )
  );

-- Keep service role policies for administrative access
CREATE POLICY "Service role can manage all tables" ON schools FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role can manage teachers" ON teachers FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role can manage students" ON students FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role can manage progress" ON progress FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');