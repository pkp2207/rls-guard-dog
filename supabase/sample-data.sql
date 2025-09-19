-- Sample Data for RLS Guard Dog
-- Created: September 19, 2025
-- Description: Sample data for testing the application

-- Insert sample schools
INSERT INTO schools (id, name, address) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Greenwood Elementary', '123 Oak Street, Springfield'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Riverside High School', '456 Elm Avenue, Springfield');

-- Note: User IDs below are placeholders. In production, these would be actual auth.users IDs
-- You'll need to replace these with real user IDs after users sign up

-- Insert sample teachers
INSERT INTO teachers (id, user_id, school_id, email, first_name, last_name, role, classes, subjects) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440101', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440001',
    'john.smith@greenwood.edu',
    'John',
    'Smith',
    'head_teacher',
    ARRAY['5A', '5B', '6A'],
    ARRAY['math', 'science']
  ),
  (
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440102', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440001',
    'sarah.johnson@greenwood.edu',
    'Sarah',
    'Johnson',
    'teacher',
    ARRAY['5A', '5C'],
    ARRAY['english', 'history']
  ),
  (
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440103', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440002',
    'michael.brown@riverside.edu',
    'Michael',
    'Brown',
    'head_teacher',
    ARRAY['10A', '10B', '11A'],
    ARRAY['math', 'science', 'pe']
  );

-- Insert sample students
INSERT INTO students (id, user_id, school_id, email, first_name, last_name, class_name, year_group) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440201', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440001',
    'alice.wilson@student.greenwood.edu',
    'Alice',
    'Wilson',
    '5A',
    5
  ),
  (
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440202', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440001',
    'bob.davis@student.greenwood.edu',
    'Bob',
    'Davis',
    '5A',
    5
  ),
  (
    '550e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440203', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440001',
    'charlie.miller@student.greenwood.edu',
    'Charlie',
    'Miller',
    '5B',
    5
  ),
  (
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440204', -- Replace with actual user ID
    '550e8400-e29b-41d4-a716-446655440002',
    'diana.garcia@student.riverside.edu',
    'Diana',
    'Garcia',
    '10A',
    10
  );

-- Insert sample progress data
INSERT INTO progress (student_id, teacher_id, school_id, subject, assignment_name, score, max_score, notes) VALUES 
  -- Alice Wilson's progress
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'math',
    'Fractions Test',
    85,
    100,
    'Good understanding of basic fractions'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'science',
    'Plant Biology Quiz',
    92,
    100,
    'Excellent work on plant structures'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440012',
    '550e8400-e29b-41d4-a716-446655440001',
    'english',
    'Essay on Shakespeare',
    78,
    100,
    'Good analysis, needs work on grammar'
  ),
  
  -- Bob Davis's progress
  (
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'math',
    'Fractions Test',
    73,
    100,
    'Needs more practice with complex fractions'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440022',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'science',
    'Plant Biology Quiz',
    88,
    100,
    'Good understanding of photosynthesis'
  ),
  
  -- Charlie Miller's progress
  (
    '550e8400-e29b-41d4-a716-446655440023',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'math',
    'Geometry Basics',
    95,
    100,
    'Excellent spatial reasoning skills'
  ),
  
  -- Diana Garcia's progress (High school)
  (
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440002',
    'math',
    'Algebra II Test',
    89,
    100,
    'Strong algebraic skills'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440024',
    '550e8400-e29b-41d4-a716-446655440013',
    '550e8400-e29b-41d4-a716-446655440002',
    'science',
    'Chemistry Lab Report',
    94,
    100,
    'Excellent lab technique and analysis'
  );

-- Insert additional progress entries to show trends
INSERT INTO progress (student_id, teacher_id, school_id, subject, assignment_name, score, max_score, notes, completed_at) VALUES 
  -- More recent assignments for Alice
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'math',
    'Decimals Quiz',
    88,
    100,
    'Improvement shown in decimal calculations',
    NOW() - INTERVAL '3 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440011',
    '550e8400-e29b-41d4-a716-446655440001',
    'math',
    'Problem Solving Worksheet',
    91,
    100,
    'Great progress in word problems',
    NOW() - INTERVAL '1 day'
  );

-- Create a utility function to generate more sample data if needed
CREATE OR REPLACE FUNCTION generate_sample_progress(
  p_student_id UUID,
  p_teacher_id UUID,
  p_school_id UUID,
  p_subject subject_type,
  p_num_entries INTEGER DEFAULT 5
)
RETURNS VOID AS $$
DECLARE
  i INTEGER;
  assignment_names TEXT[] := ARRAY[
    'Weekly Quiz', 'Unit Test', 'Homework Assignment', 'Project Work', 'Class Participation',
    'Lab Report', 'Essay', 'Presentation', 'Group Work', 'Final Assessment'
  ];
  base_score INTEGER;
  score_variation INTEGER;
BEGIN
  -- Generate random base score between 70-95
  base_score := 70 + (RANDOM() * 25)::INTEGER;
  
  FOR i IN 1..p_num_entries LOOP
    -- Add some variation to scores
    score_variation := base_score + (RANDOM() * 20 - 10)::INTEGER;
    score_variation := GREATEST(0, LEAST(100, score_variation));
    
    INSERT INTO progress (
      student_id, 
      teacher_id, 
      school_id, 
      subject, 
      assignment_name, 
      score, 
      max_score, 
      notes,
      completed_at
    ) VALUES (
      p_student_id,
      p_teacher_id,
      p_school_id,
      p_subject,
      assignment_names[1 + (RANDOM() * array_length(assignment_names, 1))::INTEGER % array_length(assignment_names, 1)],
      score_variation,
      100,
      'Auto-generated sample entry #' || i,
      NOW() - (RANDOM() * INTERVAL '30 days')
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;