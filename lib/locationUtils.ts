// Utility functions for location-based operations

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get coordinates from zip code using zippopotam.us API
export async function getCoordinatesFromZip(zipCode: string): Promise<{latitude: number, longitude: number} | null> {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      latitude: parseFloat(data.places[0].latitude),
      longitude: parseFloat(data.places[0].longitude)
    };
  } catch (error) {
    console.error('Error getting coordinates from zip:', error);
    return null;
  }
}

// Search locations by zip code with distance calculation
export async function searchLocationsByZip(zipCode: string, radiusMiles: number = 25) {
  try {
    const coords = await getCoordinatesFromZip(zipCode)
    if (!coords) return []

    const { getSupabaseClient } = await import('./supabase')
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        location_amenities(amenity_name, amenity_category),
        location_hours(day_of_week, open_time, close_time, is_closed)
      `)
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    // Calculate distances and filter by radius
    const locationsWithDistance = (data || [])
      .map((location: any) => ({
        ...location,
        distance: calculateDistance(coords.latitude, coords.longitude, location.latitude!, location.longitude!)
      }))
      .filter((location: any) => location.distance <= radiusMiles)
      .sort((a: any, b: any) => a.distance - b.distance)

    return locationsWithDistance
  } catch (error) {
    console.error('Error searching locations by zip:', error)
    return []
  }
}

// Search locations by zip code for API responses (returns simplified data)
export async function searchLocationsByZipForAPI(zipCode: string, radiusMiles: number = 25) {
  try {
    const coords = await getCoordinatesFromZip(zipCode)
    if (!coords) return []

    const { getSupabaseClient } = await import('./supabase')
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, city, state, slug, google_rating, description, latitude, longitude')
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    // Calculate distances and filter by radius
    const locationsWithDistance = (data || [])
      .map((location: any) => ({
        ...location,
        distance: calculateDistance(coords.latitude, coords.longitude, location.latitude, location.longitude)
      }))
      .filter((location: any) => location.distance <= radiusMiles)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, 10)
      .map((location: any) => {
        // Remove coordinates and distance from results
        const { latitude, longitude, distance, ...result } = location
        return result
      })

    return locationsWithDistance
  } catch (error) {
    console.error('Error searching locations by zip:', error)
    return []
  }
}

// Search locations by latitude/longitude with distance calculation
export async function searchLocationsByLatLng(lat: number, lng: number, radiusMiles: number = 25) {
  try {
    const { getSupabaseClient } = await import('./supabase')
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        location_amenities(amenity_name, amenity_category),
        location_hours(day_of_week, open_time, close_time, is_closed)
      `)
      .in('business_status', ['OPERATIONAL', 'CLOSED_TEMPORARILY'])
      .eq('review_status', 'approved')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    // Calculate distances and filter by radius
    const locationsWithDistance = (data || [])
      .map((location: any) => ({
        ...location,
        distance: calculateDistance(lat, lng, location.latitude!, location.longitude!)
      }))
      .filter((location: any) => location.distance <= radiusMiles)
      .sort((a: any, b: any) => a.distance - b.distance)

    return locationsWithDistance
  } catch (error) {
    console.error('Error searching locations by lat/lng:', error)
    return []
  }
}
