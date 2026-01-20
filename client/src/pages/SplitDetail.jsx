import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import {
  Camera,
  Home,
  Store,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react';

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

export default function SplitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [split, setSplit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchSplit = async () => {
      try {
        setLoading(true);
        const data = await api.getSplit(id);
        setSplit(data);
      } catch (err) {
        console.error('Error fetching split:', err);
        setError('Failed to load split details');
      } finally {
        setLoading(false);
      }
    };
    fetchSplit();
  }, [id]);

  const handleJoin = async () => {
    if (!company?.id) {
      alert('Please complete your company profile first');
      return;
    }
    
    try {
      setActionLoading(true);
      const result = await api.joinSplit(id, company.id);
      setSplit(prev => ({
        ...prev,
        filledSlots: result.filledSlots,
        status: result.status,
        participants: [
          ...(prev.participants || []),
          {
            companyId: company.id,
            company: { id: company.id, name: company.name, category: company.category },
            joinedAt: new Date().toISOString(),
            paid: false
          }
        ]
      }));
    } catch (err) {
      console.error('Error joining split:', err);
      alert('Failed to join split');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this split?')) return;
    
    try {
      setActionLoading(true);
      await api.leaveSplit(id, company.id);
      setSplit(prev => ({
        ...prev,
        filledSlots: prev.filledSlots - 1,
        status: 'open',
        participants: prev.participants?.filter(p => p.companyId !== company.id)
      }));
    } catch (err) {
      console.error('Error leaving split:', err);
      alert('Failed to leave split');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this split? This cannot be undone.')) return;
    
    try {
      setActionLoading(true);
      await api.deleteSplit(id);
      navigate('/splits');
    } catch (err) {
      console.error('Error deleting split:', err);
      alert('Failed to delete split');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this split?')) return;
    
    try {
      setActionLoading(true);
      await api.cancelSplit(id);
      navigate('/splits');
    } catch (err) {
      console.error('Error canceling split:', err);
      alert('Failed to cancel split');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-charcoal-500">Loading split details...</div>
      </div>
    );
  }

  if (error || !split) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Split not found'}</p>
          <Link to="/splits" className="btn-primary">Back to Splits</Link>
        </div>
      </div>
    );
  }

  const Icon = typeIcons[split.type] || Camera;
  const progress = (split.filledSlots / split.slots) * 100;
  const slotsAvailable = split.slots - split.filledSlots;
  
  const isOrganizer = split.organizerId === company?.id;
  const isParticipant = split.participants?.some(p => p.companyId === company?.id);
  const myParticipation = split.participants?.find(p => p.companyId === company?.id);
  const canJoin = !isParticipant && split.status === 'open' && slotsAvailable > 0;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate('/splits')}
        className="flex items-center gap-2 text-charcoal-600 hover:text-charcoal-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Splits
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-14 h-14 ${typeColors[split.type]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h1 className="font-display text-2xl text-charcoal-800">{split.title}</h1>
                <p className="text-charcoal-500 capitalize mt-1">{split.type} Split</p>
              </div>
              <span className={`badge ${split.status === 'open' ? 'badge-open' : split.status === 'full' ? 'badge-full' : 'badge-complete'}`}>
                {split.status}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-charcoal-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-charcoal-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-charcoal-800">${split.costPerSlot}</p>
                <p className="text-xs text-charcoal-500">per slot</p>
              </div>
              <div className="text-center p-3 bg-charcoal-50 rounded-xl">
                <Users className="w-5 h-5 text-charcoal-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-charcoal-800">{split.filledSlots}/{split.slots}</p>
                <p className="text-xs text-charcoal-500">spots filled</p>
              </div>
              {split.eventDate && (
                <div className="text-center p-3 bg-charcoal-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-charcoal-400 mx-auto mb-1" />
                  <p className="text-lg font-semibold text-charcoal-800">
                    {new Date(split.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-charcoal-500">event date</p>
                </div>
              )}
              {split.deadline && (
                <div className="text-center p-3 bg-charcoal-50 rounded-xl">
                  <Clock className="w-5 h-5 text-charcoal-400 mx-auto mb-1" />
                  <p className="text-lg font-semibold text-charcoal-800">
                    {new Date(split.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-charcoal-500">deadline</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="font-display text-lg text-charcoal-800 mb-4">About this Split</h2>
            <p className="text-charcoal-600 whitespace-pre-wrap">{split.description}</p>
            
            {split.location && (
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-charcoal-100 text-charcoal-600">
                <MapPin className="w-4 h-4 text-charcoal-400" />
                {split.location}
              </div>
            )}
          </div>

          {/* Vendor Details */}
          {(split.vendorName || split.vendorDetails) && (
            <div className="card p-6">
              <h2 className="font-display text-lg text-charcoal-800 mb-4">Vendor</h2>
              {split.vendorName && (
                <p className="font-medium text-charcoal-800 mb-2">{split.vendorName}</p>
              )}
              {split.vendorDetails && (
                <p className="text-charcoal-600 text-sm">{split.vendorDetails}</p>
              )}
            </div>
          )}

          {/* Participants */}
          <div className="card p-6">
            <h2 className="font-display text-lg text-charcoal-800 mb-4">
              Participants ({split.filledSlots}/{split.slots})
            </h2>
            
            {/* Progress Bar */}
            <div className="h-3 bg-charcoal-100 rounded-full mb-6">
              <div 
                className="h-3 bg-split-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-3">
              {split.participants?.map((participant, index) => (
                <div
                  key={participant.companyId}
                  className="flex items-center justify-between p-3 bg-charcoal-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-split-100 rounded-lg flex items-center justify-center">
                      <span className="text-split-600 font-semibold text-lg">
                        {participant.company?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-charcoal-800">
                        {participant.company?.name}
                      </p>
                      {participant.companyId === split.organizerId && (
                        <span className="text-xs text-split-600">Organizer</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.paid ? (
                      <span className="badge bg-green-100 text-green-700">
                        <Check className="w-3 h-3" />
                        Paid
                      </span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Empty Slots */}
              {Array.from({ length: slotsAvailable }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-3 border-2 border-dashed border-charcoal-200 rounded-xl"
                >
                  <div className="w-10 h-10 bg-charcoal-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-charcoal-400" />
                  </div>
                  <p className="text-charcoal-400">Open slot</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="card-elevated p-6 sticky top-8">
            <div className="text-center mb-6">
              <p className="text-sm text-charcoal-500 mb-1">Your cost</p>
              <p className="text-4xl font-bold text-split-600">${split.costPerSlot}</p>
              <p className="text-sm text-charcoal-500 mt-1">
                Total: ${split.totalCost} ÷ {split.slots} slots
              </p>
            </div>

            {/* Action Buttons */}
            {canJoin && (
              <button 
              onClick={handleDelete}
              disabled={actionLoading}
              className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
              >
               Delete Split
              </button>
            )}

            {isParticipant && !isOrganizer && !myParticipation?.paid && (
              <>
                <button
                  className="btn-primary w-full mb-3"
                  disabled={split.status !== 'full'}
                >
                  {split.status === 'full' ? 'Pay Now' : 'Payment opens when full'}
                </button>
                <button
                 
                onClick={handleCancel}
                disabled={actionLoading}
                className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  Leave Split
                </button>
              </>
            )}

            {isOrganizer && (
              <div className="space-y-3">
                <div className="p-3 bg-split-50 rounded-xl text-center">
                  <p className="text-sm text-split-700">You're the organizer</p>
                </div>
                {split.status === 'open' && (
                  <button className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50">
                    Cancel Split
                  </button>
                )}
              </div>
            )}

            {isParticipant && myParticipation?.paid && (
              <div className="p-3 bg-green-50 rounded-xl text-center">
                <Check className="w-5 h-5 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-700 font-medium">You're all set!</p>
                <p className="text-xs text-green-600">Payment confirmed</p>
              </div>
            )}

            {/* Info */}
            <div className="mt-6 p-4 border-t border-charcoal-100">
              <div className="flex items-start gap-2 text-xs text-charcoal-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Payment is collected via Stripe when the split is full. 
                  You won't be charged until all spots are filled.
                </p>
              </div>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="card p-6">
            <h3 className="font-display text-sm text-charcoal-500 mb-4">Organized by</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-split-100 rounded-xl flex items-center justify-center">
                <span className="text-split-600 font-semibold text-lg">
                  {split.organizer?.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium text-charcoal-800">{split.organizer?.name}</p>
                <p className="text-sm text-charcoal-500 capitalize">{split.organizer?.category}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
