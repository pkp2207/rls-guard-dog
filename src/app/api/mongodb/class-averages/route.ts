// MongoDB API Route for Class Averages
// Created: September 19, 2025
// Description: API endpoints for MongoDB class averages operations

import { NextRequest, NextResponse } from 'next/server';
import { 
  saveClassAverages, 
  getClassAverages,
  getClassAveragesTrends,
  getSchoolAveragesSummary,
  pingMongoDB
} from '@/lib/mongodb';
import type { ClassAverage } from '@/types/database';

// GET /api/mongodb/class-averages
// Query parameters: school_id, class_name?, subject?, month?, year?, limit?
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school_id');
    const action = searchParams.get('action');

    if (!schoolId) {
      return NextResponse.json(
        { error: 'school_id is required' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'trends') {
      return handleTrendsRequest(searchParams, schoolId);
    }
    
    if (action === 'summary') {
      return handleSummaryRequest(searchParams, schoolId);
    }
    
    if (action === 'ping') {
      return handlePingRequest();
    }

    // Default: Get class averages with optional filters
    return handleDefaultRequest(searchParams, schoolId);
    
  } catch (error) {
    console.error('MongoDB API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

async function handleTrendsRequest(searchParams: URLSearchParams, schoolId: string) {
  const className = searchParams.get('class_name');
  const subject = searchParams.get('subject');
  
  if (!className || !subject) {
    return NextResponse.json(
      { error: 'class_name and subject are required for trends' },
      { status: 400 }
    );
  }
  
  const trends = await getClassAveragesTrends(schoolId, className, subject);
  return NextResponse.json({ data: trends, success: true });
}

async function handleSummaryRequest(searchParams: URLSearchParams, schoolId: string) {
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  
  const summary = await getSchoolAveragesSummary(
    schoolId,
    year ? parseInt(year) : undefined,
    month ? parseInt(month) : undefined
  );
  return NextResponse.json({ data: summary, success: true });
}

async function handlePingRequest() {
  const isHealthy = await pingMongoDB();
  return NextResponse.json({ 
    data: { healthy: isHealthy }, 
    success: true 
  });
}

async function handleDefaultRequest(searchParams: URLSearchParams, schoolId: string) {
  const className = searchParams.get('class_name');
  const subject = searchParams.get('subject');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const limit = searchParams.get('limit');
  
  const filters = {
    class_name: className || undefined,
    subject: subject || undefined,
    month: month ? parseInt(month) : undefined,
    year: year ? parseInt(year) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  };

  const averages = await getClassAverages(schoolId, filters);
  return NextResponse.json({ data: averages, success: true });
}

// POST /api/mongodb/class-averages
// Body: ClassAverage[] - array of class averages to save
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be an array of ClassAverage objects' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['school_id', 'class_name', 'subject', 'average_score', 'total_students'];
    const invalidItems = body.filter(item => 
      !requiredFields.every(field => field in item && item[field] !== undefined)
    );

    if (invalidItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid data format',
          message: `Missing required fields: ${requiredFields.join(', ')}`,
          invalid_items: invalidItems.length
        },
        { status: 400 }
      );
    }

    // Add timestamps and calculated fields
    const currentDate = new Date();
    const processedAverages: Omit<ClassAverage, '_id'>[] = body.map(item => ({
      ...item,
      calculated_at: currentDate,
      month: item.month || currentDate.getMonth() + 1,
      year: item.year || currentDate.getFullYear(),
      average_percentage: Math.round((item.average_score / 100) * 100), // Assuming scores are already percentages
      total_assignments: item.total_assignments || 1
    }));

    await saveClassAverages(processedAverages);

    return NextResponse.json({
      message: `Successfully saved ${processedAverages.length} class averages`,
      count: processedAverages.length,
      success: true
    });

  } catch (error) {
    console.error('MongoDB save error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save class averages',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// PUT /api/mongodb/class-averages
// Update existing class averages
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be an array of ClassAverage objects' },
        { status: 400 }
      );
    }

    // For updates, we'll use the same save function with upsert behavior
    const currentDate = new Date();
    const processedAverages: Omit<ClassAverage, '_id'>[] = body.map(item => ({
      ...item,
      calculated_at: currentDate,
      month: item.month || currentDate.getMonth() + 1,
      year: item.year || currentDate.getFullYear(),
    }));

    await saveClassAverages(processedAverages);

    return NextResponse.json({
      message: `Successfully updated ${processedAverages.length} class averages`,
      count: processedAverages.length,
      success: true
    });

  } catch (error) {
    console.error('MongoDB update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update class averages',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}