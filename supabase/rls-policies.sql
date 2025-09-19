-- Row Level Security Policies for RLS Guard Dog
-- Created: September 19, 2025
-- Description: Comprehensive RLS policies for role-based access control

-- Helper function to get current user's role and school
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
  -- Check if user is a teacher first
  IF EXISTS (
    SELECT 1 FROM teachers 
    WHERE user_id = auth.uid()
  ) THEN
    RETURN (SELECT role FROM teachers WHERE user_id = auth.uid());
  -- Check if user is a student
  ELSIF EXISTS (
    SELECT 1 FROM students 
    WHERE user_id = auth.uid()
  ) THEN
    RETURN 'student'::user_role;
  ELSE
    -- Default to student if no role found
    RETURN 'student'::user_role;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_user_school_id()
RETURNS UUID AS $$
BEGIN
  -- Check if user is a teacher
  IF EXISTS (
    SELECT 1 FROM teachers 
    WHERE user_id = auth.uid()
  ) THEN
    RETURN (SELECT school_id FROM teachers WHERE user_id = auth.uid());
  -- Check if user is a student
  ELSIF EXISTS (
    SELECT 1 FROM students 
    WHERE user_id = auth.uid()
  ) THEN
    RETURN (SELECT school_id FROM students WHERE user_id = auth.uid());
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schools table policies
CREATE POLICY "Users can view their own school" ON schools
  FOR SELECT
  USING (id = get_current_user_school_id());

CREATE POLICY "Head teachers can update their school" ON schools
  FOR UPDATE
  USING (
    id = get_current_user_school_id() 
    AND get_current_user_role() = 'head_teacher'
  );

-- Teachers table policies
CREATE POLICY "Teachers can view teachers in their school" ON teachers
  FOR SELECT
  USING (
    school_id = get_current_user_school_id()
    AND (
      get_current_user_role() IN ('teacher', 'head_teacher')
      OR user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own profile" ON teachers
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Head teachers can update teachers in their school" ON teachers
  FOR UPDATE
  USING (
    school_id = get_current_user_school_id()
    AND get_current_user_role() = 'head_teacher'
  );

CREATE POLICY "New teachers can insert their profile" ON teachers
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND school_id = get_current_user_school_id()
  );

-- Students table policies
CREATE POLICY "Students can view their own profile" ON students
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can view students in their school" ON students
  FOR SELECT
  USING (
    school_id = get_current_user_school_id()
    AND get_current_user_role() IN ('teacher', 'head_teacher')
  );

CREATE POLICY "Students can update their own profile" ON students
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can update students in their school" ON students
  FOR UPDATE
  USING (
    school_id = get_current_user_school_id()
    AND get_current_user_role() IN ('teacher', 'head_teacher')
  );

CREATE POLICY "New students can insert their profile" ON students
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND school_id = get_current_user_school_id()
  );

-- Progress table policies (The most complex and important)
CREATE POLICY "Students can view their own progress" ON progress
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view progress of students in their classes" ON progress
  FOR SELECT
  USING (
    CASE 
      WHEN get_current_user_role() = 'head_teacher' THEN
        -- Head teachers can see all progress in their school
        school_id = get_current_user_school_id()
      WHEN get_current_user_role() = 'teacher' THEN
        -- Regular teachers can see progress for students in their classes
        school_id = get_current_user_school_id()
        AND student_id IN (
          SELECT s.id 
          FROM students s
          JOIN teachers t ON t.user_id = auth.uid()
          WHERE s.school_id = t.school_id
          AND s.class_name = ANY(t.classes)
        )
      ELSE
        -- Students can only see their own progress (handled by student policy above)
        FALSE
    END
  );

CREATE POLICY "Teachers can insert progress for students in their classes" ON progress
  FOR INSERT
  WITH CHECK (
    get_current_user_role() IN ('teacher', 'head_teacher')
    AND school_id = get_current_user_school_id()
    AND (
      get_current_user_role() = 'head_teacher'
      OR student_id IN (
        SELECT s.id 
        FROM students s
        JOIN teachers t ON t.user_id = auth.uid()
        WHERE s.school_id = t.school_id
        AND s.class_name = ANY(t.classes)
      )
    )
  );

CREATE POLICY "Teachers can update progress for students in their classes" ON progress
  FOR UPDATE
  USING (
    get_current_user_role() IN ('teacher', 'head_teacher')
    AND school_id = get_current_user_school_id()
    AND (
      get_current_user_role() = 'head_teacher'
      OR student_id IN (
        SELECT s.id 
        FROM students s
        JOIN teachers t ON t.user_id = auth.uid()
        WHERE s.school_id = t.school_id
        AND s.class_name = ANY(t.classes)
      )
    )
  );

CREATE POLICY "Teachers can delete progress for students in their classes" ON progress
  FOR DELETE
  USING (
    get_current_user_role() IN ('teacher', 'head_teacher')
    AND school_id = get_current_user_school_id()
    AND (
      get_current_user_role() = 'head_teacher'
      OR student_id IN (
        SELECT s.id 
        FROM students s
        JOIN teachers t ON t.user_id = auth.uid()
        WHERE s.school_id = t.school_id
        AND s.class_name = ANY(t.classes)
      )
    )
  );

-- Create views for easier data access
CREATE VIEW student_progress_summary AS
SELECT 
  s.id as student_id,
  s.first_name,
  s.last_name,
  s.class_name,
  s.year_group,
  p.subject,
  COUNT(p.id) as total_assignments,
  ROUND(AVG(p.percentage_score), 2) as average_percentage,
  ROUND(AVG(p.score), 2) as average_score,
  MAX(p.completed_at) as last_assignment_date
FROM students s
LEFT JOIN progress p ON s.id = p.student_id
GROUP BY s.id, s.first_name, s.last_name, s.class_name, s.year_group, p.subject;

-- Enable RLS on the view
ALTER VIEW student_progress_summary SET (security_barrier = true);

-- Grant access to authenticated users
GRANT SELECT ON schools TO authenticated;
GRANT SELECT, INSERT, UPDATE ON teachers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON progress TO authenticated;
GRANT SELECT ON student_progress_summary TO authenticated;