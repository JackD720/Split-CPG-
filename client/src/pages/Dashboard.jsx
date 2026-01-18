import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowRight,
  Camera,
  Home,
  Store,
  Plus,
  Clock
} from 'lucide-react';

// Mock data for demo
const mockMySplits = [
  {
    id: '1',
    title: 'Expo West Photography',
    type: 'content',
    status: 'open',
    slots: 4,
    filledSlots: 2,
    costPerSlot: 300,
    deadline: '2025-02-15',
    isOrganizer: true
  },
  {
    id: '2',
    title: 'SF Pop-up Booth Share',
    type: 'popup',
    status: 'full',
    slots: 3,
    filledSlots: 3,
    costPerSlot: 500,
    deadline: '2025-03-01',
    isOrganizer: false
  }
];

const mockOpenSplits = [
  {
    id: '3',
    title: 'NYC Trade Show Airbnb',
    type: 'housing',
    slots: 4,
    filledSlots: 1,
    costPerSlot: 200,
    location: 'New York, NY',
    organizerName: 'Healthy Snacks Co'
  },
  {
    id: '4',
    title: 'Product Shoot Day',
    type: 'content',
    slots: 5,
    filledSlots: 3,
    costPerSlot: 250,
    location: 'Los Angeles, CA',
    organizerName: 'Wellness Brand'
  },
  {
    id: '5',
    title: 'Fancy Food Show Booth',
    type: 'popup',
    slots: 2,
    filledSlots: 1,
    costPerSlot: 750,
    location: 'New York, NY',
    organizerName: 'Artisan Foods'
  }
];

const mockUpcomingEvents = [
  {
    id: '1',
    name: 'NOSH Live Winter',
    date: '2025-01-27',
    city: 'Marina del Rey, CA',
    type: 'conference'
  },
  {
    id: '2',
    name: 'CPG Founders Meetup',
    date: '2025-02-15',
    city: 'New York, NY',
    type: 'networking'
  }
];

const typeIcons = {
  content: Camera,
  housing: Home,
  popup: Store
};

const typeColors = {
  content: 'bg-blue-100 text-blue-600',
  housing: 'bg-purple-100 text-purple-600',
  popup: 'bg-green-100 text-green-600'
};

function StatCard({ icon: Icon, label, value, subtext, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-charcoal-900">{value}</p>
      <p className="text-sm text-charcoal-500">{label}</p>
      {subtext && <p className="text-xs text-charcoal-400 mt-1">{subtext}</p>}
    </div>
  );
}

function SplitCard({ split, showOrganizer = false }) {
  const Icon = typeIcons[split.type] || Camera;
  const progress = (split.filledSlots / split.slots) * 100;
  
  return (
    <Link to={`/splits/${split.id}`} className="card p-5 block hover:-translate-y-0.5 transition-transform">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 ${typeColors[split.type]} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-charcoal-900 truncate">{split.title}</h3>
          <p className="text-sm text-charcoal-500 capitalize">{split.type} Split</p>
        </div>
        <span className={`badge ${split.status === 'open' ? 'badge-open' : 'badge-full'}`}>
          {split.status}
        </span>
      </div>
      
      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-charcoal-500">{split.filledSlots} of {split.slots} spots</span>
          <span className="font-medium text-split-600">${split.costPerSlot}/spot</span>
        </div>
        <div className="h-2 bg-charcoal-100 rounded-full">
          <div 
            className="h-2 bg-split-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {showOrganizer && split.organizerName && (
        <p className="text-xs text-charcoal-400">
          Organized by {split.organizerName}
        </p>
      )}
      
      {split.deadline && (
        <p className="text-xs text-charcoal-400 flex items-center gap-1 mt-2">
          <Clock className="w-3 h-3" />
          Deadline: {new Date(split.deadline).toLocaleDateString()}
        </p>
      )}
    </Link>
  );
}

export default function Dashboard() {
  const { user, company } = useAuth();
  const [mySplits, setMySplits] = useState(mockMySplits);
  const [openSplits, setOpenSplits] = useState(mockOpenSplits);
  const [events, setEvents] = useState(mockUpcomingEvents);

  // Calculate stats
  const activeSplits = mySplits.length;
  const totalSaved = mySplits.reduce((acc, s) => acc + s.costPerSlot, 0);
  const totalConnections = 8; // Mock

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="font-display text-3xl text-charcoal-900">
          Welcome back{company?.name ? `, ${company.name}` : ''}
        </h1>
        <p className="text-charcoal-600 mt-1">
          Here's what's happening with your splits
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Active Splits"
          value={activeSplits}
          color="bg-split-100 text-split-600"
        />
        <StatCard
          icon={DollarSign}
          label="Saved This Month"
          value={`$${totalSaved}`}
          subtext="Across all splits"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={Users}
          label="Connections"
          value={totalConnections}
          subtext="Brands you've split with"
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Events"
          value={events.length}
          color="bg-blue-100 text-blue-600"
        />
      </div>

      {/* My Splits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-charcoal-900">My Splits</h2>
          <Link to="/splits" className="btn-ghost text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {mySplits.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {mySplits.map(split => (
              <SplitCard key={split.id} split={split} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-charcoal-600 mb-4">You haven't joined any splits yet</p>
            <Link to="/splits/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Create Your First Split
            </Link>
          </div>
        )}
      </div>

      {/* Open Splits to Join */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-charcoal-900">Open Splits</h2>
          <Link to="/splits?status=open" className="btn-ghost text-sm">
            Browse All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {openSplits.slice(0, 3).map(split => (
            <SplitCard key={split.id} split={split} showOrganizer />
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-charcoal-900">Upcoming Events</h2>
          <Link to="/events" className="btn-ghost text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {events.map(event => (
            <Link
              key={event.id}
              to={`/events#${event.id}`}
              className="card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
            >
              <div className="w-14 h-14 bg-split-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs text-split-600 font-medium uppercase">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-lg font-bold text-split-700">
                  {new Date(event.date).getDate()}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-charcoal-900">{event.name}</h3>
                <p className="text-sm text-charcoal-500">{event.city}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
