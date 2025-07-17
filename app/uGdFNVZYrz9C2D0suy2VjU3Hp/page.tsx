'use client'
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface Location {
  id: string;
  name: string;
  street_address?: string;
  photo_url?: string;
  description?: string;
  review_tags?: string[];
  location_hours?: any;
  reviews_tags?: string[];
  street_view_url?: string;
  business_status?: string;
  google_rating?: number;
  location_url?: string;
  business_type?: string;
  review_status?: 'pending' | 'approved' | 'rejected';
}

const PAGE_SIZE = 10;
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminPendingLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchText, setSearchText] = useState('');
  const [only24Hour, setOnly24Hour] = useState(false);

  async function fetchPending(pageNum: number, status: 'pending' | 'approved' | 'rejected', search: string = '', only24: boolean = false) {
    setLoading(true);
    setErrorMsg(null);
    const supabase = getSupabaseClient();
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
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
    const { data, error, count } = await query as { data: Location[]; error: any; count: number };
    if (error) {
      setErrorMsg(error.message || 'Unknown error');
      console.log('Supabase error:', error, data);
    } else {
      setLocations(data || []);
      setHasMore((count ?? 0) > to + 1);
      console.log('Supabase data:', data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPending(page, reviewStatus, searchText, only24Hour);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reviewStatus, searchText, only24Hour]);

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    const supabase = getSupabaseClient();
    await supabase
      .from('locations')
      .update({ review_status: status })
      .eq('id', id);
    setLocations(locs => {
      const updated = locs.filter(loc => loc.id !== id);
      // If we just removed the last item and there are more, auto-advance
      if (updated.length === 0 && hasMore) {
        setPage(p => p + 1);
      }
      return updated;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 w-full">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Pending Location Reviews</h1>
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
        <div className="flex items-center">
          <label htmlFor="reviewStatus" className="mr-2 font-semibold text-gray-900">Filter by status:</label>
          <select
            id="reviewStatus"
            value={reviewStatus}
            onChange={e => { setPage(0); setReviewStatus(e.target.value as any); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carwash-blue focus:border-transparent text-gray-900"
          >
            <option value="pending">Pending</option>
            <option value="approved">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex items-center ml-4">
          <input
            type="checkbox"
            id="only24Hour"
            checked={only24Hour}
            onChange={e => { setPage(0); setOnly24Hour(e.target.checked); }}
            className="mr-2"
          />
          <label htmlFor="only24Hour" className="font-semibold text-gray-900">Show only 24-hour locations</label>
        </div>
      </div>
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchText}
          onChange={e => { setPage(0); setSearchText(e.target.value); }}
          className="w-full max-w-xl px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-carwash-blue focus:border-transparent text-gray-900 placeholder-gray-400"
        />
      </div>
      {errorMsg && (
        <div className="p-8 text-center text-red-600 font-semibold">Error: {errorMsg}</div>
      )}
      {loading ? (
        <div className="p-8 text-center">Loading…</div>
      ) : locations.length === 0 && !errorMsg ? (
        <div className="p-8 text-center">No pending locations.</div>
      ) : (
        <>
          <div className="space-y-8">
            {locations.map(loc => (
              <div key={loc.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col gap-6 items-start max-w-4xl mx-auto">
                {loc.photo_url && (
                  <img src={loc.photo_url} alt={loc.name} className="w-full max-w-3xl h-[28rem] object-cover rounded-lg border border-gray-100 mx-auto" />
                )}
                {loc.street_view_url && (
                  <img src={loc.street_view_url} alt={loc.name} className="w-full max-w-3xl h-[28rem] object-cover rounded-lg border border-gray-100 mx-auto" />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-tarawera mb-2">{loc.name}</h2>
                  {loc.street_address && <div className="text-gray-700 mb-1">{loc.street_address}</div>}
                  {loc.business_type && (
                    <div className="text-xs text-gray-500 mb-1">Type: {loc.business_type}</div>
                  )}
                  {loc.business_status && (
                    <div className="text-xs text-gray-500 mb-1">Status: {loc.business_status}</div>
                  )}
                  {loc.review_status && (
                    <div className="text-xs text-gray-500 mb-1">Review Status: <span className="font-semibold">{loc.review_status.charAt(0).toUpperCase() + loc.review_status.slice(1)}</span></div>
                  )}
                  {typeof loc.google_rating === 'number' && (
                    <div className="text-xs text-gray-500 mb-1">Google Rating: {loc.google_rating}</div>
                  )}
                  {loc.location_url && (
                    <div className="text-xs text-gray-500 mb-1">
                      <a href={loc.location_url} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 text-base font-semibold bg-carwash-blue text-white rounded-lg shadow hover:bg-tarawera transition">View Location</a>
                    </div>
                  )}
                  {loc.description && <div className="text-gray-600 mb-2 text-sm">{loc.description}</div>}
                  {loc.location_hours && Array.isArray(loc.location_hours) && loc.location_hours.length > 0 && (
                    <div className="text-xs text-gray-500 mb-2">
                      <strong>Hours:</strong>
                      <ul className="ml-2 mt-1">
                        {dayNames.map((day, i) => {
                          const entry = loc.location_hours.find((h: any) => h.day_of_week === i + 1);
                          if (!entry) return (
                            <li key={day}>{day}: <span className="italic">No data</span></li>
                          );
                          return (
                            <li key={day}>
                              {day}: {entry.is_closed ? <span className="italic">Closed</span> : `${entry.open_time} - ${entry.close_time}`}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {loc.reviews_tags && Array.isArray(loc.reviews_tags) && loc.reviews_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {loc.reviews_tags.map((tag: string) => (
                        <span key={tag} className="bg-carwash-light-100 text-carwash-blue px-2 py-1 rounded text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 mt-4">
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                      onClick={() => handleReview(loc.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                      onClick={() => handleReview(loc.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-10">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span className="text-gray-600">Page {page + 1}</span>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
} 