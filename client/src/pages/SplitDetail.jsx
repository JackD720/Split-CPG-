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
  popup: Store,
  other: Calendar
};

const typeColors = {
  content: 'bg-blue-100 text-blue-600',
  housing: 'bg-purple-100 text-purple-600',
  popup: 'bg-green-100 text-green-600',
  other: 'bg-gray-100 text-gray-600'
};

// Helper component for company avatar with logo support
function CompanyAvatar({ company, size = 'md' }) {
  const logo = company?.logoUrl || company?.logo;
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-lg'
  };
  
  if (logo) {
    return (
      <img 
        src={logo} 
        alt={company?.name || 'Company'}
        className={`${sizeClasses[size]} rounded-lg object-cover`}
      />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} bg-split-100 rounded-lg flex items-center justify-center`}>
      <span className="text-split-600 font-semibold">
        {company?.name?.charAt(0) || '?'}
      </span>
    </div>
  );
}

export default function SplitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [split, setSplit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [paymentSuccess, setPaymentSuccess] = useState(false);

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

  // Handle return from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success' && company?.id) {
      // Confirm payment in backend
      const confirmPayment = async () => {
        try {
          const API_URL = 'https://split-backend-720273557833.us-central1.run.app';
          const response = await fetch(`${API_URL}/api/payments/split/${id}/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId: company.id })
          });
          
          if (response.ok) {
            setPaymentSuccess(true);
            // Update local state to show paid
            setSplit(prev => ({
              ...prev,
              participants: prev?.participants?.map(p => 
                p.companyId === company.id ? { ...p, paid: true, paidAt: new Date().toISOString() } : p
              )
            }));
          }
        } catch (err) {
          console.error('Error confirming payment:', err);
        }
        
        // Clear URL params
        window.history.replaceState({}, '', window.location.pathname);
      };
      
      confirmPayment();
    } else if (paymentStatus === 'cancelled') {
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [id, company?.id]);

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
            company: { 
              id: company.id, 
              name: company.name, 
              category: company.category,
              logoUrl: company.logoUrl || company.logo
            },
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

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await api.deleteSplit(id);
      navigate('/splits');
    } catch (err) {
      console.error('Error deleting split:', err);
      alert('Failed to delete split');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await api.cancelSplit(id, company.id);
      navigate('/splits');
    } catch (err) {
      console.error('Error canceling split:', err);
      alert('Failed to cancel split');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
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
      setShowLeaveModal(false);
    }
  };

  const [paymentLoading, setPaymentLoading] = useState(false);
  
  const handlePayment = async () => {
    if (!company?.id) {
      alert('Please complete your company profile first');
      return;
    }
    
    try {
      setPaymentLoading(true);
      const API_URL = 'https://split-backend-720273557833.us-central1.run.app';
      
      const response = await fetch(`${API_URL}/api/payments/split/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment session');
      }
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Confirmation Modal Component
  const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor = 'red', loading }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden animate-fade-in">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-charcoal-900 mb-2">{title}</h3>
            <p className="text-charcoal-600">{message}</p>
          </div>
          
          <div className="flex gap-3 p-4 bg-charcoal-50 border-t border-charcoal-100">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-charcoal-200 text-charcoal-700 font-medium hover:bg-charcoal-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 ${
                confirmColor === 'red' 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-split-500 text-white hover:bg-split-600'
              }`}
            >
              {loading ? 'Please wait...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    );
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
      {/* Payment Success Banner */}
      {paymentSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">Payment Successful!</p>
              <p className="text-sm text-green-700">Your payment has been confirmed. You're all set for this split!</p>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate('/splits')}
        className="flex items-center gap-2 text-charcoal-600 hover:text-charcoal-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Splits
      </button>

      {/* Cover Image */}
      {split.imageUrl && (
        <div className="rounded-2xl overflow-hidden mb-6 shadow-lg">
          <img 
            src={split.imageUrl} 
            alt={split.title}
            className="w-full h-64 object-cover"
            onError={(e) => e.target.parentElement.style.display = 'none'}
          />
        </div>
      )}

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
                    <CompanyAvatar company={participant.company} size="md" />
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
                onClick={handleJoin}
                disabled={actionLoading}
                className="btn-primary w-full"
              >
                Join this Split
              </button>
            )}

            {isParticipant && !isOrganizer && !myParticipation?.paid && (
              <>
                <button
                  onClick={handlePayment}
                  className="btn-primary w-full mb-3"
                  disabled={split.status !== 'full' || paymentLoading}
                >
                  {paymentLoading ? 'Redirecting to payment...' : split.status === 'full' ? 'Pay Now' : 'Payment opens when full'}
                </button>
                <button
                  onClick={() => setShowLeaveModal(true)}
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
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    disabled={actionLoading}
                    className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Delete Split
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
              <CompanyAvatar company={split.organizer} size="lg" />
              <div>
                <p className="font-medium text-charcoal-800">{split.organizer?.name}</p>
                <p className="text-sm text-charcoal-500 capitalize">{split.organizer?.category}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete this split?"
        message="This will permanently delete this split and remove all participants. This action cannot be undone."
        confirmText="Delete Split"
        confirmColor="red"
        loading={actionLoading}
      />

      {/* Leave Confirmation Modal */}
      <ConfirmModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
        title="Leave this split?"
        message="You'll lose your spot and someone else may take it. You can rejoin later if spots are still available."
        confirmText="Leave Split"
        confirmColor="red"
        loading={actionLoading}
      />
    </div>
  );
}