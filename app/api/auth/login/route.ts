import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { email, password } = await request.json();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  // The helper should set the cookie automatically
  if (data.session) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Login failed' }, { status: 401 });
} 