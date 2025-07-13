import { getSupabaseClient } from './supabase'

export async function getStatesWithLocations() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('locations')
      .select('state')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .order('state')

    if (error) {
      console.error('Error fetching states:', error)
      return []
    }

    // Get unique states and count locations per state
    const stateCounts = data.reduce((acc: { [key: string]: number }, location: any) => {
      if (location.state) {
        acc[location.state] = (acc[location.state] || 0) + 1
      }
      return acc
    }, {})

    // Convert to array and sort
    const states = Object.entries(stateCounts)
      .map(([state, count]) => ({
        name: state,
        locationCount: count,
        slug: state.toLowerCase().replace(/\s+/g, '-')
      }))
      .sort((a, b) => b.locationCount - a.locationCount) // Sort by location count (highest first)

    return states
  } catch (error) {
    console.error('Error fetching states:', error)
    return []
  }
}

export async function getOpen24HourLocationCount() {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('open_24_hour_locations')
    .select('location_id', { count: 'exact', head: true });
  if (error) {
    console.error('Error fetching open 24 hour location count:', error);
    return 0;
  }
  return count || 0;
}
