import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Filter,
  Plus,
  Users,
  Building,
  X
} from 'lucide-react';

// Mock events data
const mockEvents = [
  {
    id: '1',
    name: 'NOSH Live Winter 2025',
    description: 'Conference for better-for-you food & beverage brands',
    date: '2025-01-27',
    endDate: '2025-01-28',
    location: 'The Ritz-Carlton',
    city: 'Marina del Rey, CA',
    type: 'conference',
    url: 'https://www.noshlive.com',
    relatedSplitsCount: 2
  },
  {
    id: '2',
    name: 'CPG Founders Meetup',
    description: 'Casual networking for emerging CPG brands. Great opportunity to connect with fellow founders.',
    date: '2025-02-15',
    endDate: '2025-02-15',
    location: 'WeWork Soho',
    city: 'New York, NY',
    type: 'networking',
    url: null,
    relatedSplitsCount: 0
  },
  {
    id: '3',
    name: 'Expo West 2025',
    description: 'Natural & organic products expo - the biggest CPG trade show of the year. 3,000+ exhibitors, 65,000+ attendees.',
    date: '2025-03-04',
    endDate: '2025-03-08',
    location: 'Anaheim Convention Center',
    city: 'Anaheim, CA',
    type: 'trade_show',
    url: 'https://www.expowest.com',
    relatedSplitsCount: 5
  },
  {
    id: '4',
    name: 'Fancy Food Show Summer',
    description: 'Specialty food industry trade show featuring the latest in gourmet and specialty foods.',
    date: '2025-06-29',
    endDate: '2025-07-01',
    location: 'Javits Center',
    city: 'New York, NY',
    type: 'trade_show',
    url: 'https://www.specialtyfood.com',
    relatedSplitsCount: 3
  },
  {
    id: '5',
    name: 'BevNET Live Summer',
    description: 'Conference focused on the beverage industry',
    date: '2025-06-10',
    endDate: '2025-06-11',
    location: 'Metropolitan Pavilion',
    city: 'New York, NY',
    type: 'conference',
    url: 'https://www.bevnet.com/live',
    relatedSplitsCount: 1
  },
  {
    id: '6',
    name: 'LA CPG Happy Hour',
    description: 'Monthly meetup for CPG founders in Los Angeles',
    date: '2025-02-20',
    endDate: '2025-02-20',
    location: 'TBD',
    city: 'Los Angeles, CA',
    type: 'networking',
    url: null,
    relatedSplitsCount: 0
  }
];

const typeLabels = {
  trade_show: 'Trade Show',
  conference: 'Conference',
  networking: 'Networking',
  popup: 'Popup'
};

const typeColors = {
  trade_show: 'bg-purple-100 text-purple-700',
  conference: 'bg-blue-100 text-blue-700',
  networking: 'bg-green-100 text-green-700',
  popup: 'bg-orange-100 text-orange-700'
};

export default function Events() {
  const [events, setEvents] = useState(mockEvents);
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    name: '',
    website: '',
    date: '',
    city: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSuggestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call - in production this would send to your backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Event suggestion submitted:', suggestForm);
    setSubmitting(false);
    setSubmitted(true);
    
    // Reset after showing success
    setTimeout(() => {
      setShowSuggestModal(false);
      setSubmitted(false);
      setSuggestForm({ name: '', website: '', date: '', city: '', notes: '' });
    }, 2000);
  };

  // Get unique cities
  const cities = [...new Set(mockEvents.map(e => e.city))];

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesCity = cityFilter === 'all' || event.city === cityFilter;
    return matchesType && matchesCity;
  });

  // Group by month
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const monthYear = new Date(event.date).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-charcoal-900">Events</h1>
        <p className="text-charcoal-600 mt-1">
          Upcoming trade shows, conferences, and networking events
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            className="input w-full sm:w-48"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Event Types</option>
            <option value="trade_show">Trade Shows</option>
            <option value="conference">Conferences</option>
            <option value="networking">Networking</option>
          </select>
          
          <select
            className="input w-full sm:w-48"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events List */}
      {Object.keys(groupedEvents).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear}>
              <h2 className="font-display text-lg text-charcoal-700 mb-4 sticky top-0 bg-cream-100 py-2 z-10">
                {monthYear}
              </h2>
              
              <div className="space-y-4">
                {monthEvents.map((event, index) => (
                  <div
                    key={event.id}
                    id={event.id}
                    className="card p-6 hover:-translate-y-0.5 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Date Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-split-50 rounded-2xl flex flex-col items-center justify-center border border-split-100">
                          <span className="text-sm font-medium text-split-600 uppercase">
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-2xl font-bold text-split-700">
                            {new Date(event.date).getDate()}
                          </span>
                          {event.endDate !== event.date && (
                            <span className="text-xs text-split-500">
                              - {new Date(event.endDate).getDate()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-display text-xl text-charcoal-900">
                            {event.name}
                          </h3>
                          <span className={`badge ${typeColors[event.type]} flex-shrink-0`}>
                            {typeLabels[event.type]}
                          </span>
                        </div>
                        
                        <p className="text-charcoal-600 mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-500">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {event.city}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Building className="w-4 h-4" />
                            {event.location}
                          </span>
                          {event.url && (
                            <a
                              href={event.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-split-600 hover:text-split-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Related Splits */}
                      <div className="flex-shrink-0 lg:text-right">
                        {event.relatedSplitsCount > 0 ? (
                          <Link
                            to={`/splits?event=${event.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-split-50 text-split-700 rounded-xl hover:bg-split-100 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            {event.relatedSplitsCount} split{event.relatedSplitsCount !== 1 ? 's' : ''}
                          </Link>
                        ) : (
                          <Link
                            to={`/splits/new?event=${event.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-charcoal-200 text-charcoal-600 rounded-xl hover:bg-charcoal-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Create split
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
          <p className="text-charcoal-600">No events found matching your filters</p>
        </div>
      )}

      {/* Add Event CTA */}
      <div className="card p-6 bg-charcoal-900 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg">Know of an event we're missing?</h3>
            <p className="text-charcoal-400 text-sm">Help the community by suggesting events</p>
          </div>
          <button 
            onClick={() => setShowSuggestModal(true)}
            className="btn-primary bg-white text-charcoal-900 hover:bg-charcoal-100"
          >
            Suggest Event
          </button>
        </div>
      </div>

      {/* Suggest Event Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !submitting && setShowSuggestModal(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-charcoal-100">
              <h3 className="text-xl font-semibold text-charcoal-900">Suggest an Event</h3>
              <button
                onClick={() => !submitting && setShowSuggestModal(false)}
                className="p-2 hover:bg-charcoal-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-charcoal-500" />
              </button>
            </div>
            
            {submitted ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-charcoal-900 mb-2">Thanks for the suggestion!</h4>
                <p className="text-charcoal-600">We'll review it and add it to the calendar if it's a good fit.</p>
              </div>
            ) : (
              <form onSubmit={handleSuggestSubmit}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={suggestForm.name}
                      onChange={(e) => setSuggestForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 focus:border-split-500 focus:ring-2 focus:ring-split-500/20 outline-none"
                      placeholder="e.g. Natural Products Expo East"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={suggestForm.website}
                      onChange={(e) => setSuggestForm(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 focus:border-split-500 focus:ring-2 focus:ring-split-500/20 outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={suggestForm.date}
                        onChange={(e) => setSuggestForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 focus:border-split-500 focus:ring-2 focus:ring-split-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={suggestForm.city}
                        onChange={(e) => setSuggestForm(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 focus:border-split-500 focus:ring-2 focus:ring-split-500/20 outline-none"
                        placeholder="e.g. Philadelphia, PA"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={suggestForm.notes}
                      onChange={(e) => setSuggestForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 focus:border-split-500 focus:ring-2 focus:ring-split-500/20 outline-none resize-none"
                      placeholder="Any other details about this event..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 p-4 bg-charcoal-50 border-t border-charcoal-100">
                  <button
                    type="button"
                    onClick={() => setShowSuggestModal(false)}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-charcoal-200 text-charcoal-700 font-medium hover:bg-charcoal-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !suggestForm.name}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-split-500 text-white font-medium hover:bg-split-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Suggestion'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}