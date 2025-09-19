// Supabase Edge Function: Calculate Class Averages
// Created: September 19, 2025
// Updated: Fixed errors and added direct MongoDB integration

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const MONGO_URI = Deno.env.get('MONGO_URI');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MONGO_URI) {
  throw new Error("Missing environment variables. Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MONGO_URI.");
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialize MongoDB client
const mongoClient = new MongoClient();
await mongoClient.connect(MONGO_URI);
const db = mongoClient.database("my_database"); // replace with your DB name
const classAveragesCollection = db.collection("class_averages");

// Interfaces
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

// Edge function
serve(async (req: Request) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

    const requestBody = await req.json();
    const { school_id, month, year, trigger_type = 'manual' } = requestBody;

    if (!school_id) return new Response(JSON.stringify({ error: 'school_id is required' }), { status: 400, headers });

    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Fetch progress data
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select(`
        id,
        student_id,
        subject,
        score,
        max_score,
        completed_at,
        students (
          class_level,
          school_id
        )
      `)
      .eq('students.school_id', school_id)
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());

    if (progressError) {
      console.error('Error fetching progress data:', progressError);
      return new Response(JSON.stringify({ error: 'Failed to fetch progress data', details: progressError }), { status: 500, headers });
    }

    if (!progressData || progressData.length === 0) {
      return new Response(JSON.stringify({ message: 'No progress data found', school_id, month: targetMonth, year: targetYear, count: 0 }), { status: 200, headers });
    }

    // Group data by class and subject
    const groupedData = new Map<string, ProgressData[]>();
    (progressData as ProgressData[]).forEach(record => {
      const key = `${record.students.class_level}_${record.subject}`;
      if (!groupedData.has(key)) groupedData.set(key, []);
      groupedData.get(key)!.push(record);
    });

    // Calculate averages
    const classAverages: ClassAverageData[] = [];
    for (const [key, records] of groupedData.entries()) {
      const [className, subject] = key.split('_');
      const totalScore = records.reduce((sum, r) => sum + r.score, 0);
      const totalMaxScore = records.reduce((sum, r) => sum + r.max_score, 0);
      const averageScore = totalScore / records.length;
      const averagePercentage = (totalScore / totalMaxScore) * 100;
      const uniqueStudents = new Set(records.map(r => r.student_id)).size;

      classAverages.push({
        school_id,
        class_id: `${school_id}_${className}`,
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

    // Save to MongoDB
    if (classAverages.length > 0) {
      try {
        await classAveragesCollection.insertMany(classAverages);
        console.log('Successfully saved class averages to MongoDB');
      } catch (mongoError) {
        console.error('Error saving to MongoDB:', mongoError);
      }
    }

    return new Response(JSON.stringify({
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
    }), { status: 200, headers });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { status: 500, headers });
  }
});