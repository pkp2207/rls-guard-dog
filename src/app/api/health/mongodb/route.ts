// MongoDB Health Check API Route
// Created: September 19, 2025
// Description: Simple health check endpoint for MongoDB connection

import { NextResponse } from 'next/server';
import { pingMongoDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const isHealthy = await pingMongoDB();
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      mongodb: isHealthy,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        mongodb: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        success: false
      },
      { status: 500 }
    );
  }
}