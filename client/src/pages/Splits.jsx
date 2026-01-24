import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  Camera,
  Home,
  Store,
  Filter,
  Plus,
  Search,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';

const typeIcons = {
  content: Camera,
  housing: Home,
  popup: Store
};

const typeColors = {
  content: 'bg-blue-100 text-blue-600 border-blue-200',
  housing: 'bg-purple-100 text-purple-600 border-purple-200',
  popup: 'bg-green-100 text-green-600 border-green-200'
};

const filterOptions = {
  type: [
    { value: 'all', label: 'All Types' },
    { value: 'content', label: 'Content' },
    { value: 'housing', label: 'Housing' },
    { value: 'popup', label: 'Popup' }
  ],
  status: [
    { value: 'all', label: 'All Status' },
    { value: 'open', label: 'Open' },
    { value: 'full', label: 'Full' }
  ]
};

// Participant avatar component
function ParticipantAvatars({ participants, max = 4 }) {
  if (!participants || participants.length === 0) return null;
  
  const shown = participants.slice(0, max);
  const remaining = participants.length - max;
  
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((p, i) => (
          <div 
            key={p.companyId || i}
            className="w-8 h-8 rounded-full border-2 border-white bg-charcoal-100 flex items-center justify-center overflow-hidden"
            title={p.companyName || 'Participant'}
          >
            {p.companyLogo ? (
              <img 
                src={p.companyLogo} 
                alt={p.companyName || ''} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-charcoal-600">
                {p.companyName?.charAt(0) || '?'}
              </span>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-charcoal-800 flex items-center justify-center">
            <span className="text-xs font-medium text-white">+{remaining}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Splits() {
  const { company } = useAuth();
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchSplits = async () => {
      try {
        setLoading(true);
        const data = await api.getSplits();
        setSplits(data);
      } catch (err) {
        console.error('Error fetching splits:', err);
        setError('Failed to load splits');
      } finally {
        setLoading(false);
      }
    };
    fetchSplits();
  }, []);

  // Filter splits
  const filteredSplits = splits.filter(split => {
    const matchesSearch = !search || 
      split.title?.toLowerCase().includes(search.toLowerCase()) ||
      split.location?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || split.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || split.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const updateFilter = (key, value) => {
    if (key === 'type') setTypeFilter(value);
    if (key === 'status') setStatusFilter(value);
    
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-charcoal-500">Loading splits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-charcoal-800">Splits</h1>
          <p className="text-charcoal-500 mt-1">Browse and join cost-sharing opportunities</p>
        </div>
        <Link to="/splits/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Split
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search splits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* Type Filter */}
        <select
          className="input w-full sm:w-48"
          value={typeFilter}
          onChange={(e) => updateFilter('type', e.target.value)}
        >
          {filterOptions.type.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          className="input w-full sm:w-48"
          value={statusFilter}
          onChange={(e) => updateFilter('status', e.target.value)}
        >
          {filterOptions.status.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-charcoal-500">
        Showing {filteredSplits.length} split{filteredSplits.length !== 1 ? 's' : ''}
      </p>

      {/* Splits Grid */}
      {filteredSplits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSplits.map((split, index) => {
            const Icon = typeIcons[split.type] || Camera;
            const progress = (split.filledSlots / split.slots) * 100;
            
            return (
              <Link
                key={split.id}
                to={`/splits/${split.id}`}
                className="card block hover:translate-y-[-2px] transition-all duration-300 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Cover Image */}
                {split.imageUrl && (
                  <div className="h-36 overflow-hidden">
                    <img 
                      src={split.imageUrl} 
                      alt={split.title}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.parentElement.style.display = 'none'}
                    />
                  </div>
                )}
                
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 ${typeColors[split.type]} rounded-xl flex items-center justify-center flex-shrink-0 border`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-charcoal-800 truncate">{split.title}</h3>
                      <p className="text-sm text-charcoal-500 capitalize">{split.type} Split</p>
                    </div>
                    {(() => {
                      // Check if all NON-ORGANIZER participants have paid
                      const nonOrganizerParticipants = split.participants?.filter(p => p.companyId !== split.organizerId) || [];
                      const allPaid = nonOrganizerParticipants.length > 0 && 
                        nonOrganizerParticipants.every(p => p.paid) && 
                        split.filledSlots === split.slots;
                      if (allPaid || split.status === 'completed') {
                        return <span className="badge bg-green-100 text-green-700 border-green-200">Paid</span>;
                      } else if (split.status === 'full') {
                        return <span className="badge badge-full">Full</span>;
                      } else {
                        return <span className="badge badge-open">Open</span>;
                      }
                    })()}
                  </div>

                  {/* Description */}
                  {split.description && (
                    <p className="text-sm text-charcoal-600 mb-4 line-clamp-2">
                      {split.description}
                    </p>
                  )}

                  {/* Location & Deadline */}
                  {(split.location || split.deadline) && (
                    <div className="flex items-center gap-4 text-xs text-charcoal-500 mb-4">
                      {split.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {split.location}
                        </span>
                      )}
                      {split.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(split.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    {(() => {
                      const nonOrganizerParticipants = split.participants?.filter(p => p.companyId !== split.organizerId) || [];
                      const allPaid = nonOrganizerParticipants.length > 0 && 
                        nonOrganizerParticipants.every(p => p.paid) && 
                        split.filledSlots === split.slots;
                      const isCompleted = allPaid || split.status === 'completed';
                      return (
                        <>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-charcoal-600">{split.filledSlots} of {split.slots} spots</span>
                            <span className={isCompleted ? "text-green-600 font-medium" : "text-charcoal-500"}>
                              {isCompleted ? '✓ Locked in' : `${split.slots - split.filledSlots} left`}
                            </span>
                          </div>
                          <div className="h-2 bg-charcoal-100 rounded-full">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-split-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Cost & Participants */}
                  <div className="flex items-center justify-between pt-4 border-t border-charcoal-100">
                    <div>
                      <p className="text-xs text-charcoal-500">Your cost</p>
                      <p className="text-xl font-semibold text-split-600">${split.costPerSlot}</p>
                    </div>
                    
                    {/* Participant Avatars */}
                    <ParticipantAvatars participants={split.participants} max={4} />
                  </div>

                  {/* Organizer */}
                  <div className="mt-3">
                    <p className="text-xs text-charcoal-400">
                      by {split.organizerName || split.organizer?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-charcoal-500 mb-4">No splits found matching your criteria</p>
          <Link to="/splits/new" className="btn-primary inline-flex">
            Create a Split
          </Link>
        </div>
      )}
    </div>
  );
}