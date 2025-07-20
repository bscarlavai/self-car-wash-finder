import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Allow access to the login page without authentication
  if (req.nextUrl.pathname === '/admin/login') {
    return res;
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  // Debug logging
  console.log('Supabase user:', user, 'Error:', error);

  if (!user && req.nextUrl.pathname.startsWith('/admin')) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
}; 