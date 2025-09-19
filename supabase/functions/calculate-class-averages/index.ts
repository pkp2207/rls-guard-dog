// Supabase Edge Function: Calculate Class Averages
// Created: September 19, 2025
// Description: TypeScript Edge Function to calculate class averages and save to MongoDB

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MONGODB_URI = Deno.env.get('MONGODB_URI')!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Interface for class average calculation
interface ClassAverageData {
  school_id: string;
  class_id: string;
  class_name: string;
  subject: string;
  average_score: number;
  average_percentage: number;
  total_students: number;
  total_assignments: number;
  month: number;
  year: number;
}

// Interface for progress data from Supabase
interface ProgressData {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  max_score: number;
  completed_at: string;
  students: {
    class_level: string;
    school_id: string;
  };
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const requestBody = await req.json();
    const { school_id, month, year, trigger_type = 'manual' } = requestBody;

    if (!school_id) {
      return new Response(
        JSON.stringify({ error: 'school_id is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Starting class average calculation for school ${school_id}`);

    // Get current date if month/year not provided
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    // Calculate date range for the target month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Fetch progress data from Supabase for the specified school and time period
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select(`
        id,
        student_id,
        subject,
        score,
        max_score,
        completed_at,
        students!inner (
          class_level,
          school_id
        )
      `)
      .eq('students.school_id', school_id)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());

    if (progressError) {
      console.error('Error fetching progress data:', progressError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch progress data', details: progressError }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!progressData || progressData.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No progress data found for the specified period',
          school_id,
          month: targetMonth,
          year: targetYear,
          count: 0
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${progressData.length} progress records`);

    // Group data by class and subject
    const groupedData = new Map<string, ProgressData[]>();
    
    (progressData as ProgressData[]).forEach(record => {
      const key = `${record.students.class_level}_${record.subject}`;
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)!.push(record);
    });

    // Calculate averages for each class-subject combination
    const classAverages: ClassAverageData[] = [];
    
    for (const [key, records] of groupedData.entries()) {
      const [className, subject] = key.split('_');
      
      // Calculate average scores and percentages
      const totalScore = records.reduce((sum, r) => sum + r.score, 0);
      const totalMaxScore = records.reduce((sum, r) => sum + r.max_score, 0);
      
      const averageScore = totalScore / records.length;
      const averagePercentage = (totalScore / totalMaxScore) * 100;
      
      // Count unique students
      const uniqueStudents = new Set(records.map(r => r.student_id)).size;
      
      classAverages.push({
        school_id,
        class_id: `${school_id}_${className}`, // Generate class_id
        class_name: className,
        subject,
        average_score: Math.round(averageScore * 100) / 100,
        average_percentage: Math.round(averagePercentage * 100) / 100,
        total_students: uniqueStudents,
        total_assignments: records.length,
        month: targetMonth,
        year: targetYear
      });
    }

    console.log(`Calculated ${classAverages.length} class averages`);

    // Save to MongoDB using the Next.js API route
    if (classAverages.length > 0) {
      try {
        // You would need to configure this URL based on your deployment
        const mongoApiUrl = `${SUPABASE_URL.replace('supabase.co', 'vercel.app')}/api/mongodb/class-averages`;
        
        const mongoResponse = await fetch(mongoApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(classAverages)
        });

        if (!mongoResponse.ok) {
          console.error('Failed to save to MongoDB:', await mongoResponse.text());
          // Continue anyway, don't fail the entire operation
        } else {
          console.log('Successfully saved class averages to MongoDB');
        }
      } catch (mongoError) {
        console.error('Error saving to MongoDB:', mongoError);
        // Continue anyway, don't fail the entire operation
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Class averages calculated successfully',
        data: {
          school_id,
          month: targetMonth,
          year: targetYear,
          trigger_type,
          progress_records: progressData.length,
          class_averages: classAverages.length,
          averages: classAverages
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});