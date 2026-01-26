import { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  MessageCircle,
  Send,
  Share2,
  Copy,
  Mail,
  Link as LinkIcon,
  Twitter,
  Linkedin
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

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

// Share Split Card component
function ShareSplitCard({ split }) {
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const shareUrl = `${window.location.origin}/splits/${split.id}`;
  const shareText = `Join "${split.title}" on Split - Cost sharing for CPG brands. ${split.slotsAvailable || (split.slots - split.filledSlots)} spots left at $${split.costPerSlot}/spot.`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Join my split: ${split.title}`);
    const body = encodeURIComponent(`Hey!\n\nI'm organizing a cost-sharing split and thought you might be interested.\n\n${shareText}\n\nJoin here: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setInviteSending(true);
    // For now, just open email client with pre-filled invite
    // Later we can add a proper invite system with tracking
    const subject = encodeURIComponent(`You're invited to join: ${split.title}`);
    const body = encodeURIComponent(`Hi!\n\nYou've been invited to join a cost-sharing split on Split.\n\n${shareText}\n\nJoin here: ${shareUrl}\n\nSee you there!`);
    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
    
    setInviteSending(false);
    setInviteSent(true);
    setInviteEmail('');
    setTimeout(() => setInviteSent(false), 3000);
  };

  // Only show share if split is open
  if (split.status !== 'open') return null;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-split-600" />
        <h3 className="font-display text-sm text-charcoal-800">Share this Split</h3>
      </div>

      {/* Copy Link */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="input text-sm flex-1 bg-charcoal-50"
        />
        <button
          onClick={copyLink}
          className={`btn-secondary px-3 ${copied ? 'bg-green-50 border-green-200 text-green-600' : ''}`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Social Share Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={shareTwitter}
          className="flex-1 btn-secondary py-2 text-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
        >
          <Twitter className="w-4 h-4" />
        </button>
        <button
          onClick={shareLinkedIn}
          className="flex-1 btn-secondary py-2 text-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
        >
          <Linkedin className="w-4 h-4" />
        </button>
        <button
          onClick={shareEmail}
          className="flex-1 btn-secondary py-2 text-sm hover:bg-split-50 hover:border-split-200 hover:text-split-600"
        >
          <Mail className="w-4 h-4" />
        </button>
      </div>

      {/* Invite by Email */}
      <div className="border-t border-charcoal-100 pt-4">
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="text-sm text-split-600 hover:text-split-700 flex items-center gap-1"
        >
          <Mail className="w-4 h-4" />
          {showInvite ? 'Hide invite form' : 'Invite someone directly'}
        </button>

        {showInvite && (
          <form onSubmit={sendInvite} className="mt-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="input text-sm flex-1"
                disabled={inviteSending}
              />
              <button
                type="submit"
                disabled={!inviteEmail.trim() || inviteSending}
                className="btn-primary px-4 text-sm"
              >
                {inviteSending ? '...' : 'Send'}
              </button>
            </div>
            {inviteSent && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Opening email client with invite...
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

// Chat component for split detail page
function SplitChat({ splitId, company }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!splitId) return;

    const messagesRef = collection(db, 'splits', splitId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Reverse to show oldest first
      setMessages(msgs);
      if (expanded) {
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => unsubscribe();
  }, [splitId, expanded]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'splits', splitId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: company.id,
        senderName: company.name,
        senderLogo: company.logoUrl || company.logo || null,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="card p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-split-600" />
          <h2 className="font-display text-lg text-charcoal-800">Chat</h2>
          {messages.length > 0 && (
            <span className="bg-split-100 text-split-600 text-xs px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <span className="text-charcoal-400 text-sm">
          {expanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {expanded && (
        <div className="mt-4">
          {/* Messages */}
          <div className="h-64 overflow-y-auto border border-charcoal-100 rounded-lg p-3 space-y-3 bg-charcoal-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-charcoal-400">
                <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === company?.id;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="w-8 h-8 bg-split-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {msg.senderLogo ? (
                          <img src={msg.senderLogo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <span className="text-split-600 text-xs font-semibold">
                            {msg.senderName?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {!isOwn && (
                        <p className="text-xs text-charcoal-500 mb-0.5 ml-1">{msg.senderName}</p>
                      )}
                      <div className={`rounded-xl px-3 py-2 ${
                        isOwn 
                          ? 'bg-split-500 text-white rounded-br-sm' 
                          : 'bg-white text-charcoal-800 rounded-bl-sm border border-charcoal-100'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      <p className={`text-xs text-charcoal-400 mt-0.5 ${isOwn ? 'text-right' : ''}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input flex-1 text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-primary px-3 py-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Link to full messages */}
          <Link 
            to={`/messages?split=${splitId}`}
            className="block text-center text-sm text-split-600 hover:text-split-700 mt-3"
          >
            Open in full view →
          </Link>
        </div>
      )}
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
              {split.participants?.map((participant, index) => {
                const isOrganizerParticipant = participant.companyId === split.organizerId;
                return (
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
                        {isOrganizerParticipant && (
                          <span className="text-xs text-split-600">Organizer</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOrganizerParticipant ? (
                        <span className="badge bg-purple-100 text-purple-700">
                          Host
                        </span>
                      ) : participant.paid ? (
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
                );
              })}
              
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

          {/* Chat Section - Only show for participants */}
          {isParticipant && (
            <SplitChat splitId={split.id} company={company} />
          )}
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

          {/* Share Card */}
          <ShareSplitCard split={split} />
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