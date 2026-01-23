import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Camera,
  Home,
  Store,
  ArrowRight,
  Plus,
  Clock
} from 'lucide-react';

const typeIcons = {
  content: Camera,
  housing: Home,
  popup: Store,
  other: Calendar
};

const typeColors = {
  content: 'bg-blue-100 text-blue-600',
  housing: 'bg-purple-100 text-purple-600',
  popup: 'bg-green-100 text-green-600',
  other: 'bg-gray-100 text-gray-600'
};

export default function Dashboard() {
  const { company } = useAuth();
  const [mySplits, setMySplits] = useState([]);
  const [openSplits, setOpenSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeSplits: 0,
    savedThisMonth: 0,
    connections: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    const fetchSplits = async () => {
      try {
        const allSplits = await api.getSplits();
        
        // Filter splits where user is organizer or participant
        const mine = allSplits.filter(s => 
          s.organizerId === company?.id || 
          s.participants?.some(p => p.companyId === company?.id)
        );
        
        // Open splits user can join
        const open = allSplits.filter(s => 
          s.status === 'open' && 
          s.organizerId !== company?.id &&
          !s.participants?.some(p => p.companyId === company?.id)
        );
        
        setMySplits(mine);
        setOpenSplits(open);
        
        // Calculate stats
        const activeSplits = mine.filter(s => s.status === 'open' || s.status === 'full').length;
        
        // Savings = what you would have paid alone (totalCost) minus what you actually pay (costPerSlot)
        const savedThisMonth = mine.reduce((total, s) => {
          if (s.totalCost && s.costPerSlot) {
            // You saved the difference between total cost and your share
            return total + (s.totalCost - s.costPerSlot);
          }
          return total;
        }, 0);
        const connections = new Set(
          mine.flatMap(s => s.participants?.map(p => p.companyId) || [])
        ).size;
        const upcomingEvents = mine.filter(s => s.eventDate && new Date(s.eventDate) > new Date()).length;
        
        setStats({
          activeSplits,
          savedThisMonth,
          connections,
          upcomingEvents
        });
      } catch (err) {
        console.error('Error fetching splits:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (company?.id) {
      fetchSplits();
    } else {
      setLoading(false);
    }
  }, [company?.id]);

  const SplitCard = ({ split, showOrganizer = false }) => {
    const Icon = typeIcons[split.type] || Calendar;
    const colorClass = typeColors[split.type] || typeColors.other;
    const filledSlots = split.filledSlots || split.participants?.length || 1;
    const totalSlots = split.slots || 1;
    const percentFilled = (filledSlots / totalSlots) * 100;
    
    // Participant avatars component
    const ParticipantAvatars = ({ participants, max = 3 }) => {
      if (!participants || participants.length === 0) return null;
      
      const shown = participants.slice(0, max);
      const remaining = participants.length - max;
      
      return (
        <div className="flex -space-x-2">
          {shown.map((p, i) => (
            <div 
              key={p.companyId || i}
              className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden"
              title={p.companyName || 'Participant'}
            >
              {p.companyLogo ? (
                <img 
                  src={p.companyLogo} 
                  alt={p.companyName || ''} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-gray-600">
                  {p.companyName?.charAt(0) || '?'}
                </span>
              )}
            </div>
          ))}
          {remaining > 0 && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-800 flex items-center justify-center">
              <span className="text-xs font-medium text-white">+{remaining}</span>
            </div>
          )}
        </div>
      );
    };
    
    return (
      <Link 
        to={`/splits/${split.id}`}
        className="block bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
      >
        {/* Cover Image */}
        {split.imageUrl && (
          <div className="h-32 overflow-hidden">
            <img 
              src={split.imageUrl} 
              alt={split.title}
              className="w-full h-full object-cover"
              onError={(e) => e.target.parentElement.style.display = 'none'}
            />
          </div>
        )}
        
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{split.title}</h3>
                <p className="text-sm text-gray-500 capitalize">{split.type} Split</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              split.status === 'open' ? 'bg-green-100 text-green-700' :
              split.status === 'full' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {split.status?.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{filledSlots} of {totalSlots} spots</span>
                <span className="font-medium text-orange-600">
                  ${split.costPerSlot || Math.round(split.totalCost / totalSlots)}/spot
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${percentFilled}%` }}
                />
              </div>
            </div>
            
            {/* Participant Avatars & Deadline Row */}
            <div className="flex items-center justify-between">
              <ParticipantAvatars participants={split.participants} max={3} />
              
              {split.deadline && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(split.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {showOrganizer && (split.organizerName || split.organizer?.name) && (
              <p className="text-sm text-gray-500">by {split.organizerName || split.organizer?.name}</p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {company?.name || 'there'}
        </h1>
        <p className="text-gray-600">Here's what's happening with your splits</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeSplits}</p>
          <p className="text-sm text-gray-500">Active Splits</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.savedThisMonth}</p>
          <p className="text-sm text-gray-500">Saved This Month</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.connections}</p>
          <p className="text-sm text-gray-500">Connections</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
          <p className="text-sm text-gray-500">Upcoming Events</p>
        </div>
      </div>

      {/* My Splits Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Splits</h2>
          <Link 
            to="/splits" 
            className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {mySplits.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySplits.slice(0, 3).map(split => (
              <SplitCard key={split.id} split={split} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-4">You haven't joined any splits yet</p>
            <Link
              to="/splits/new"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Split
            </Link>
          </div>
        )}
      </div>

      {/* Open Splits Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Open Splits</h2>
          <Link 
            to="/splits" 
            className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
          >
            Browse All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {openSplits.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openSplits.slice(0, 3).map(split => (
              <SplitCard key={split.id} split={split} showOrganizer />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No open splits available right now</p>
          </div>
        )}
      </div>
    </div>
  );
}