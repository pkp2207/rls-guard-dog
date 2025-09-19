// Middleware for RLS Guard Dog
// Created: September 19, 2025
// Description: Route protection and authentication middleware

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieOptions = {
  [key: string]: unknown;
};

async function getUserRole(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<'student' | 'teacher' | 'head_teacher'> {
  try {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('role')
      .eq('user_id', userId)
      .single();

    return teacher ? teacher.role : 'student';
  } catch {
    return 'student';
  }
}

function createSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createSupabaseClient(request, response);
  const { data: { session } } = await supabase.auth.getSession();

  const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/forgot-password'];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users to login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (session && pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Role-based route protection
  if (session) {
    const userRole = await getUserRole(supabase, session.user.id);
    
    if (pathname.startsWith('/student') && userRole !== 'student') {
      return NextResponse.redirect(new URL('/teacher', request.url));
    }
    
    if (pathname.startsWith('/teacher') && userRole === 'student') {
      return NextResponse.redirect(new URL('/student', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};