# Dummy Data for RLS Guard Dog

This directory contains sample data for testing the RLS Guard Dog application.

## Schools Data (`schools.json`)

Contains 10 sample schools with the following information:
- **School ID**: UUID format for database references
- **Name**: Realistic school names
- **Address**: Sample addresses in Springfield, IL
- **Contact Info**: Phone and email
- **Principal**: Sample principal names
- **Type**: Various school types (Elementary, Middle, High, STEM, Arts, etc.)
- **Grades**: Grade levels served
- **Student Count**: Realistic enrollment numbers
- **Established**: Year the school was founded

## Sample Users (`users.json`)

Contains test user accounts for different roles:

### Head Teachers (Principals)
- **john.smith@greenwood.edu** - Greenwood Elementary
- **james.rodriguez@lincoln.edu** - Lincoln Middle School
- **sarah.chen@roosevelt.edu** - Roosevelt High School
- **david.park@edison.edu** - Edison STEM Academy
- **rebecca.martinez@franklin.edu** - Franklin Arts Magnet
- **hassan.ahmad@kennedy.edu** - Kennedy International

### Teachers
- **sarah.johnson@greenwood.edu** - Mathematics Teacher
- **emily.davis@lincoln.edu** - Science Teacher

### Students
- **alice.wilson@student.greenwood.edu** - 5th Grade
- **bob.martinez@student.lincoln.edu** - 7th Grade

**All accounts use password: `demo123`**

## Usage for Testing

### User Signup Testing
When testing user signup, you can use any of the school IDs from `schools.json`:

1. **Greenwood Elementary**: `550e8400-e29b-41d4-a716-446655440001`
2. **Lincoln Middle School**: `550e8400-e29b-41d4-a716-446655440002`
3. **Roosevelt High School**: `550e8400-e29b-41d4-a716-446655440003`
4. **Washington Elementary**: `550e8400-e29b-41d4-a716-446655440004`
5. **Jefferson Academy**: `550e8400-e29b-41d4-a716-446655440005`
6. **MLK Elementary**: `550e8400-e29b-41d4-a716-446655440006`
7. **Edison STEM Academy**: `550e8400-e29b-41d4-a716-446655440007`
8. **Franklin Arts Magnet**: `550e8400-e29b-41d4-a716-446655440008`
9. **Kennedy International**: `550e8400-e29b-41d4-a716-446655440009`
10. **Adams Community**: `550e8400-e29b-41d4-a716-446655440010`

### Quick Test Signup Examples

**Head Teacher Signup:**
```
Email: new.principal@greenwood.edu
Password: test123
Role: head_teacher
First Name: Test
Last Name: Principal
School ID: 550e8400-e29b-41d4-a716-446655440001
```

**Teacher Signup:**
```
Email: new.teacher@lincoln.edu
Password: test123
Role: teacher
First Name: Test
Last Name: Teacher
School ID: 550e8400-e29b-41d4-a716-446655440002
Subject: English
```

**Student Signup:**
```
Email: new.student@student.roosevelt.edu
Password: test123
Role: student
First Name: Test
Last Name: Student
School ID: 550e8400-e29b-41d4-a716-446655440003
Class Level: 10th Grade
```

## Database Setup

If you need to populate your Supabase database with this school data, you can create a schools table and insert this data:

```sql
-- Create schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  principal TEXT,
  type TEXT,
  grades TEXT,
  student_count INTEGER,
  established INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data (you would run INSERT statements with the data from schools.json)
```

This dummy data should give you plenty of realistic test scenarios for your RLS Guard Dog application!