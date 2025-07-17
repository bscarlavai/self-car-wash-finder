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

// Search locations by zip code with distance calculation using locations_within_radius RPC
export async function searchLocationsByZip(zipCode: string, radiusMiles: number = 25) {
  try {
    const coords = await getCoordinatesFromZip(zipCode)
    if (!coords) return []

    const { getSupabaseClient } = await import('./supabase')
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('locations_within_radius', {
        search_lat: coords.latitude,
        search_lng: coords.longitude,
        radius_miles: radiusMiles
      })

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error searching locations by zip:', error)
    return []
  }
}

// Search locations by zip code for API responses (returns simplified data) using locations_within_radius RPC
export async function searchLocationsByZipForAPI(zipCode: string, radiusMiles: number = 25) {
  try {
    const coords = await getCoordinatesFromZip(zipCode)
    if (!coords) return []

    const { getSupabaseClient } = await import('./supabase')
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('locations_within_radius', {
        search_lat: coords.latitude,
        search_lng: coords.longitude,
        radius_miles: radiusMiles
      })

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    // Return first 10 results and remove coordinates/distance from API response
    return (data || [])
      .slice(0, 10)
      .map((location: any) => {
        const { latitude, longitude, distance_miles, ...result } = location
        return result
      })
  } catch (error) {
    console.error('Error searching locations by zip:', error)
    return []
  }
}

// Search locations by latitude/longitude with distance calculation using locations_within_radius RPC
export async function searchLocationsByLatLng(lat: number, lng: number, radiusMiles: number = 25, excludeIds: string[] = []) {
  try {
    const { getSupabaseClient } = await import('./supabase')
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('locations_within_radius', {
        search_lat: lat,
        search_lng: lng,
        radius_miles: radiusMiles,
        exclude_ids: excludeIds
      })

    if (error) {
      console.error('Error fetching locations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error searching locations by lat/lng:', error)
    return []
  }
} 