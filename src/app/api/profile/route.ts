// API route for user profile lookup
// This runs server-side and can use the service role key safely

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameters (safer approach)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 });
    }

    // Use service role to query profile
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is a teacher
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (teacher && !teacherError) {
      // Get school data
      const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('id', teacher.school_id)
        .single();

      const profileWithSchool = {
        ...teacher,
        schools: school || null
      };

      return NextResponse.json({
        profile: profileWithSchool,
        role: teacher.role
      });
    }

    // Check if user is a student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (student && !studentError) {
      // Get school data
      const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('id', student.school_id)
        .single();

      const profileWithSchool = {
        ...student,
        schools: school || null
      };

      return NextResponse.json({
        profile: profileWithSchool,
        role: 'student'
      });
    }

    // No profile found
    return NextResponse.json(
      { 
        error: 'User profile not found',
        details: {
          teacherError: teacherError?.message,
          studentError: studentError?.message,
          userId
        }
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Profile lookup error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}