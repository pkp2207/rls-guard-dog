// Edge Function Client Utilities
// Created: September 19, 2025
// Description: Client-side utilities to call Supabase Edge Functions

import { createClientComponentClient } from './supabase';

// Interface for Edge Function responses
export interface EdgeFunctionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// Interface for class averages calculation request
export interface CalculateAveragesRequest {
  school_id: string;
  month?: number;
  year?: number;
  trigger_type?: 'manual' | 'scheduled' | 'webhook';
}

// Interface for class averages calculation response
export interface CalculateAveragesResponse {
  school_id: string;
  month: number;
  year: number;
  trigger_type: string;
  progress_records: number;
  class_averages: number;
  averages: Array<{
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
  }>;
}

/**
 * Call the calculate-class-averages Edge Function
 * @param request - Parameters for class averages calculation
 * @returns Promise with calculation results
 */
export async function calculateClassAverages(
  request: CalculateAveragesRequest
): Promise<EdgeFunctionResponse<CalculateAveragesResponse>> {
  try {
    console.log('Calling calculate-class-averages Edge Function:', request);

    const supabase = createClientComponentClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase client not initialized',
        message: 'Failed to initialize Supabase client'
      };
    }

    const { data, error } = await supabase.functions.invoke('calculate-class-averages', {
      body: request,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return {
        success: false,
        error: error.message || 'Edge Function call failed',
        message: 'Failed to calculate class averages'
      };
    }

    console.log('Edge Function response:', data);

    return {
      success: true,
      data: data as CalculateAveragesResponse,
      message: 'Class averages calculated successfully'
    };

  } catch (error) {
    console.error('Edge Function call error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to call Edge Function'
    };
  }
}

/**
 * Calculate class averages for current month
 * @param schoolId - School ID to calculate averages for
 * @returns Promise with calculation results
 */
export async function calculateCurrentMonthAverages(
  schoolId: string
): Promise<EdgeFunctionResponse<CalculateAveragesResponse>> {
  const currentDate = new Date();
  return calculateClassAverages({
    school_id: schoolId,
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    trigger_type: 'manual'
  });
}

/**
 * Calculate class averages for previous month
 * @param schoolId - School ID to calculate averages for
 * @returns Promise with calculation results
 */
export async function calculatePreviousMonthAverages(
  schoolId: string
): Promise<EdgeFunctionResponse<CalculateAveragesResponse>> {
  const currentDate = new Date();
  const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  
  return calculateClassAverages({
    school_id: schoolId,
    month: previousMonth.getMonth() + 1,
    year: previousMonth.getFullYear(),
    trigger_type: 'manual'
  });
}

/**
 * Calculate class averages for a specific month and year
 * @param schoolId - School ID to calculate averages for
 * @param month - Month (1-12)
 * @param year - Year (e.g., 2024)
 * @returns Promise with calculation results
 */
export async function calculateSpecificMonthAverages(
  schoolId: string,
  month: number,
  year: number
): Promise<EdgeFunctionResponse<CalculateAveragesResponse>> {
  return calculateClassAverages({
    school_id: schoolId,
    month,
    year,
    trigger_type: 'manual'
  });
}

/**
 * Schedule automatic calculation of class averages
 * This would typically be called by a cron job or webhook
 * @param schoolId - School ID to calculate averages for
 * @returns Promise with calculation results
 */
export async function scheduleClassAveragesCalculation(
  schoolId: string
): Promise<EdgeFunctionResponse<CalculateAveragesResponse>> {
  return calculateClassAverages({
    school_id: schoolId,
    trigger_type: 'scheduled'
  });
}

/**
 * Test Edge Function connectivity
 * @returns Promise with health check results
 */
export async function testEdgeFunctionHealth(): Promise<EdgeFunctionResponse<{ status: string }>> {
  try {
    const supabase = createClientComponentClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Supabase client not initialized',
        message: 'Failed to initialize Supabase client'
      };
    }

    const { error } = await supabase.functions.invoke('calculate-class-averages', {
      body: { test: true },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        message: 'Edge Function health check failed'
      };
    }

    return {
      success: true,
      data: { status: 'healthy' },
      message: 'Edge Function is responding'
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Edge Function health check failed'
    };
  }
}