'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { isBusinessOpen, getNextOpenTime } from '@/lib/timeUtils'

interface BusinessHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface OpenStatusProps {
  hours: BusinessHour[];
  state: string;
  businessStatus?: string;
}

// Helper function to remove leading zeros from 12-hour time strings
function formatTime(time: string): string {
  if (!time) return '';
  // Remove leading zeros from hour part (e.g., "09:00 PM" -> "9:00 PM")
  return time.replace(/^0(\d:)/, '$1');
}

// Helper function to check if a day is open 24 hours
function isOpen24Hours(hour: BusinessHour | undefined): boolean {
  if (!hour || hour.is_closed) return false;
  // Accept both 11:59 PM and 12:00 AM next day as close time
  return (
    (hour.open_time === '12:00 AM' && (hour.close_time === '11:59 PM' || hour.close_time === '12:00 AM'))
  );
}

export default function OpenStatus({ hours, state, businessStatus }: OpenStatusProps) {
  const [status, setStatus] = useState<{ isOpen: boolean; nextOpen?: string; isTemporarilyClosed?: boolean }>({ isOpen: false });
  const [currentTime, setCurrentTime] = useState<string>('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Update status immediately
    const updateStatus = () => {
      // Check if temporarily closed first
      if (businessStatus === 'CLOSED_TEMPORARILY') {
        setStatus({ isOpen: false, isTemporarilyClosed: true });
        return;
      }
      
      // Otherwise check hours-based status
      const newStatus = isBusinessOpen(hours, state);
      const nextOpen = getNextOpenTime(hours, state);
      setStatus({ ...newStatus, nextOpen: nextOpen || undefined, isTemporarilyClosed: false });
      
      // Update current time
      const now = new Date();
      const timezone = getStateTimezone(state);
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZone: timezone 
      }));
    };

    updateStatus();

    // Update every minute
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, [hours, state, businessStatus]);

  if (!hours || hours.length === 0) {
    return null;
  }

  // Find today's hours
  const now = new Date();
  const timezone = getStateTimezone(state);
  const businessTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const currentDay = businessTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayOfWeek = currentDay === 0 ? 7 : currentDay; // 1 = Monday, ..., 7 = Sunday
  const todayHours = hours.find(h => h.day_of_week === dayOfWeek);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
            status.isTemporarilyClosed
              ? 'bg-red-100 text-red-600'
              : status.isOpen 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
          }`}>
            {status.isTemporarilyClosed ? (
              <XCircle className="h-6 w-6" />
            ) : status.isOpen ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className={`text-lg font-bold ${
              status.isTemporarilyClosed
                ? 'text-red-700'
                : status.isOpen 
                  ? 'text-green-700' 
                  : 'text-red-700'
            }`}>
              {status.isTemporarilyClosed ? 'Temporarily Closed' : (
                status.isOpen ? (
                  isOpen24Hours(todayHours)
                    ? 'Open 24 hours'
                    : `Open Now Until ${formatTime(todayHours?.close_time || '')}`
                ) : 'Closed')}
            </div>
            <div className="text-sm text-gray-600">
            Current Local Time: {currentTime} {getTimezoneAbbr(state)}
            </div>
          </div>
        </div>
        
        {!status.isOpen && !status.isTemporarilyClosed && status.nextOpen && (
          <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
            <div className="text-sm text-gray-600">Next Open</div>
            <div className="font-semibold text-gray-900">{status.nextOpen}</div>
          </div>
        )}
      </div>
      {/* Expand/collapse for full hours */}
      <div className="mt-4">
        <button
          className="flex items-center text-carwash-blue font-semibold focus:outline-none hover:text-carwash-light"
          onClick={() => setExpanded(e => !e)}
          type="button"
        >
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? 'Hide full hours' : 'Show all hours'}
        </button>
        {expanded && (
          <div className="mt-4 space-y-2">
            {dayNames.map((day, idx) => {
              const dayNum = idx + 1;
              const h = hours.find(hh => hh.day_of_week === dayNum);
              const isToday = dayNum === dayOfWeek;
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                    isToday 
                      ? 'bg-carwash-blue text-white font-semibold shadow-sm border border-carwash-blue' 
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{day}</span>
                    {isToday && (
                      <span className="bg-white text-carwash-blue text-xs font-bold px-2 py-1 rounded-full">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className={isToday ? 'text-white' : 'text-gray-700'}>
                    {!h || h.is_closed ? (
                      <span className={isToday ? 'text-red-200' : 'text-red-600'} style={{fontWeight: isToday ? '500' : '500'}}>
                        Closed
                      </span>
                    ) : (
                      <span style={{fontWeight: isToday ? '500' : '500'}}>
                        {isOpen24Hours(h)
                          ? 'Open 24 hours'
                          : `${formatTime(h.open_time)} - ${formatTime(h.close_time)}`}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get timezone abbreviation
function getStateTimezone(state: string): string {
  const timezoneMap: { [key: string]: string } = {
    // Eastern Time
    'Alabama': 'America/New_York',
    'Connecticut': 'America/New_York',
    'Delaware': 'America/New_York',
    'Florida': 'America/New_York',
    'Georgia': 'America/New_York',
    'Indiana': 'America/New_York',
    'Kentucky': 'America/New_York',
    'Maine': 'America/New_York',
    'Maryland': 'America/New_York',
    'Massachusetts': 'America/New_York',
    'Michigan': 'America/New_York',
    'New Hampshire': 'America/New_York',
    'New Jersey': 'America/New_York',
    'New York': 'America/New_York',
    'North Carolina': 'America/New_York',
    'Ohio': 'America/New_York',
    'Pennsylvania': 'America/New_York',
    'Rhode Island': 'America/New_York',
    'South Carolina': 'America/New_York',
    'Tennessee': 'America/New_York',
    'Vermont': 'America/New_York',
    'Virginia': 'America/New_York',
    'West Virginia': 'America/New_York',

    // Central Time
    'Arkansas': 'America/Chicago',
    'Illinois': 'America/Chicago',
    'Iowa': 'America/Chicago',
    'Kansas': 'America/Chicago',
    'Louisiana': 'America/Chicago',
    'Minnesota': 'America/Chicago',
    'Mississippi': 'America/Chicago',
    'Missouri': 'America/Chicago',
    'Nebraska': 'America/Chicago',
    'North Dakota': 'America/Chicago',
    'Oklahoma': 'America/Chicago',
    'South Dakota': 'America/Chicago',
    'Texas': 'America/Chicago',
    'Wisconsin': 'America/Chicago',

    // Mountain Time
    'Arizona': 'America/Denver',
    'Colorado': 'America/Denver',
    'Idaho': 'America/Denver',
    'Montana': 'America/Denver',
    'New Mexico': 'America/Denver',
    'Utah': 'America/Denver',
    'Wyoming': 'America/Denver',

    // Pacific Time
    'Alaska': 'America/Anchorage',
    'California': 'America/Los_Angeles',
    'Nevada': 'America/Los_Angeles',
    'Oregon': 'America/Los_Angeles',
    'Washington': 'America/Los_Angeles',

    // Hawaii
    'Hawaii': 'Pacific/Honolulu',
  };

  return timezoneMap[state] || 'America/New_York';
}

function getTimezoneAbbr(state: string): string {
  const timezone = getStateTimezone(state);
  const now = new Date();
  const timeString = now.toLocaleString('en-US', { 
    timeZone: timezone,
    timeZoneName: 'short'
  });
  
  // Extract timezone abbreviation (e.g., "EST", "PST")
  const match = timeString.match(/\s([A-Z]{3,4})$/);
  return match ? match[1] : '';
} 