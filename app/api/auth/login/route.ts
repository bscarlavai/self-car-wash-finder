import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isProd = host.endsWith('selfcarwashfinder.com');
  const cookieOptions = isProd
    ? {
        domain: '.selfcarwashfinder.com',
        path: '/',
        sameSite: 'Lax',
        secure: true,
      }
    : {
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
        secure: false,
      };

  const supabase = createRouteHandlerClient(
    { cookies },
    { cookieOptions }
  );
  const { email, password } = await request.json();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (data.session) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Login failed' }, { status: 401 });
} 