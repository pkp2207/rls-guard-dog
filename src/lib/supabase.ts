// Supabase Client Configuration for RLS Guard Dog
// Created: September 19, 2025
// Description: Supabase client setup with SSR support for Next.js

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
const validateEnvVars = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env.local file.');
    return false;
  }
  return true;
};

// Client-side Supabase client
export const createClientComponentClient = () => {
  if (!validateEnvVars()) {
    throw new Error('Missing Supabase environment variables');
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Server-side Supabase client for Server Components
export const createServerComponentClient = async () => {
  if (!validateEnvVars()) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  );
};

// Server-side Supabase client for Route Handlers (API routes)
export const createRouteHandlerClient = async () => {
  if (!validateEnvVars()) {
    throw new Error('Missing Supabase environment variables');
  }
  
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  );
};

// Admin client with service role key (for server-side operations)
export const createAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase URL or service role key');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Legacy client for backwards compatibility - only create if env vars are available
export const supabase = validateEnvVars() 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Export types
export type SupabaseClient = ReturnType<typeof createClientComponentClient>;
export type SupabaseServerClient = Awaited<ReturnType<typeof createServerComponentClient>>;
export type SupabaseAdminClient = ReturnType<typeof createAdminClient>;