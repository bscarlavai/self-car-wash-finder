import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getAccessToken(req: NextRequest) {
  // Try Authorization header first
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }
  // Try cookie (for SSR)
  const cookie = req.cookies.get('sb-access-token');
  if (cookie) return cookie.value;
  return null;
}

// GET /api/admin-locations?page=0&pageSize=10&status=pending&search=foo&only24=false
export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } } });
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' || 'pending';
  const search = searchParams.get('search') || '';
  const only24 = searchParams.get('only24') === 'true';

  const from = page * pageSize;
  const to = from + pageSize - 1;

  try {
    let query;
    if (only24) {
      query = supabase
        .from('locations')
        .select('*, location_hours(*), reviews_tags, street_view_url, open_24_hour_locations!inner(location_id, review_status)', { count: 'exact' })
        .eq('open_24_hour_locations.review_status', status);
    } else {
      query = supabase
        .from('locations')
        .select('*, location_hours(*), reviews_tags, street_view_url', { count: 'exact' })
        .eq('review_status', status);
    }
    if (search && search.trim()) {
      const searchVal = `%${search.trim()}%`;
      query = query.or(`name.ilike.${searchVal},description.ilike.${searchVal},state.ilike.${searchVal},city.ilike.${searchVal}`);
    }
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 