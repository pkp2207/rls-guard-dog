// Supabase Client Configuration for RLS Guard Dog
// Created: September 19, 2025
// Description: Supabase client setup with SSR support for Next.js

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client
export const createClientComponentClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Server-side Supabase client for Server Components
export const createServerComponentClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};

// Server-side Supabase client for Route Handlers (API routes)
export const createRouteHandlerClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

// Admin client with service role key (for server-side operations)
export const createAdminClient = () => {
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Legacy client for backwards compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export types
export type SupabaseClient = ReturnType<typeof createClientComponentClient>;
export type SupabaseServerClient = Awaited<ReturnType<typeof createServerComponentClient>>;
export type SupabaseAdminClient = ReturnType<typeof createAdminClient>;