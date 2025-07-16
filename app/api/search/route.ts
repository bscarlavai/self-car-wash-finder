import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { searchLocationsByZipForAPI } from '@/lib/locationUtils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const supabase = getSupabaseClient()
    
    // Check if query looks like a zip code (5 digits)
    const isZipCode = /^\d{5}$/.test(query.trim())
    
    if (isZipCode) {
      // Handle zip code search using shared utility
      const results = await searchLocationsByZipForAPI(query.trim(), 25)
      return NextResponse.json({ results })
    }

    // Handle text-based search (name, city, state, description)
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, city, state, slug, google_rating, description, review_count')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,description.ilike.%${query}%`)
      .order('review_count', { ascending: false })
      .limit(20)
    // Sort in JS: non-null review_count descending, then nulls last, then take top 10
    const sorted = (data || []).sort((a, b) => {
      if (a.review_count == null && b.review_count == null) return 0;
      if (a.review_count == null) return 1;
      if (b.review_count == null) return -1;
      return b.review_count - a.review_count;
    }).slice(0, 10);

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ results: [] })
    }

    return NextResponse.json({ results: sorted })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ results: [] })
  }
} 