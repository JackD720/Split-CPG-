import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft,
  Camera,
  Home,
  Store,
  Users
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

const typeIcons = {
  content: Camera,
  housing: Home,
  popup: Store
};

// Company Avatar component
function CompanyAvatar({ company, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  
  const logoUrl = company?.logoUrl || company?.logo;
  
  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
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

// Message bubble component
function MessageBubble({ message, isOwn }) {
  const time = message.timestamp?.toDate?.() 
    ? message.timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <CompanyAvatar company={{ name: message.senderName, logoUrl: message.senderLogo }} size="sm" />
      )}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <p className="text-xs text-charcoal-500 mb-1 ml-1">{message.senderName}</p>
        )}
        <div className={`rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-split-500 text-white rounded-br-md' 
            : 'bg-charcoal-100 text-charcoal-800 rounded-bl-md'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
        <p className={`text-xs text-charcoal-400 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}

// Chat view for a specific split
function SplitChat({ split, onBack }) {
  const { company } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!split?.id) return;

    const messagesRef = collection(db, 'splits', split.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [split?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'splits', split.id, 'messages');
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

  const Icon = typeIcons[split?.type] || Camera;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-charcoal-100">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-charcoal-100 rounded-lg transition-colors lg:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-split-100 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-split-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-charcoal-900 truncate">{split?.title}</h2>
          <p className="text-sm text-charcoal-500">
            {split?.participants?.length || 0} participants
          </p>
        </div>
        <Link 
          to={`/splits/${split?.id}`}
          className="text-sm text-split-600 hover:text-split-700"
        >
          View Split
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-charcoal-400">
            <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isOwn={msg.senderId === company?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="pt-4 border-t border-charcoal-100">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="input flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-primary px-4"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

// Main Messages page
export default function Messages() {
  const { company } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSplit, setSelectedSplit] = useState(null);

  const activeSplitId = searchParams.get('split');

  // Fetch all splits the user is a participant in
  useEffect(() => {
    if (!company?.id) return;

    const fetchConversations = async () => {
      try {
        // Get all splits where user is a participant
        const splitsRef = collection(db, 'splits');
        const snapshot = await getDocs(splitsRef);
        
        const userSplits = [];
        
        for (const doc of snapshot.docs) {
          const split = { id: doc.id, ...doc.data() };
          const isParticipant = split.participants?.some(p => p.companyId === company.id);
          
          if (isParticipant) {
            // Get last message for this split
            const messagesRef = collection(db, 'splits', split.id, 'messages');
            const lastMsgQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
            const lastMsgSnapshot = await getDocs(lastMsgQuery);
            
            const lastMessage = lastMsgSnapshot.docs[0]?.data() || null;
            
            userSplits.push({
              ...split,
              lastMessage,
              lastMessageTime: lastMessage?.timestamp?.toDate?.() || null
            });
          }
        }

        // Sort by last message time (most recent first)
        userSplits.sort((a, b) => {
          if (!a.lastMessageTime && !b.lastMessageTime) return 0;
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return b.lastMessageTime - a.lastMessageTime;
        });

        setConversations(userSplits);

        // If there's an active split ID in URL, select it
        if (activeSplitId) {
          const activeSplit = userSplits.find(s => s.id === activeSplitId);
          if (activeSplit) setSelectedSplit(activeSplit);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [company?.id, activeSplitId]);

  const handleSelectSplit = (split) => {
    setSelectedSplit(split);
    setSearchParams({ split: split.id });
  };

  const handleBack = () => {
    setSelectedSplit(null);
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-charcoal-200 rounded w-48" />
          <div className="h-24 bg-charcoal-100 rounded" />
          <div className="h-24 bg-charcoal-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-charcoal-900">Messages</h1>
        <p className="text-charcoal-500 mt-1">Chat with your split participants</p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex h-[calc(100vh-14rem)]">
          {/* Conversation List */}
          <div className={`w-full lg:w-80 border-r border-charcoal-100 ${
            selectedSplit ? 'hidden lg:block' : ''
          }`}>
            <div className="p-4 border-b border-charcoal-100">
              <h2 className="font-semibold text-charcoal-900">Conversations</h2>
            </div>
            
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-charcoal-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Join a split to start chatting!</p>
              </div>
            ) : (
              <div className="overflow-y-auto h-full">
                {conversations.map((split) => {
                  const Icon = typeIcons[split.type] || Camera;
                  const isActive = selectedSplit?.id === split.id;
                  
                  return (
                    <button
                      key={split.id}
                      onClick={() => handleSelectSplit(split)}
                      className={`w-full p-4 text-left hover:bg-charcoal-50 transition-colors border-b border-charcoal-50 ${
                        isActive ? 'bg-split-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-split-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-split-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-charcoal-900 truncate">
                            {split.title}
                          </p>
                          {split.lastMessage ? (
                            <p className="text-sm text-charcoal-500 truncate">
                              {split.lastMessage.senderName}: {split.lastMessage.text}
                            </p>
                          ) : (
                            <p className="text-sm text-charcoal-400 italic">
                              No messages yet
                            </p>
                          )}
                        </div>
                        {split.lastMessageTime && (
                          <span className="text-xs text-charcoal-400 flex-shrink-0">
                            {split.lastMessageTime.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className={`flex-1 p-4 ${!selectedSplit ? 'hidden lg:flex' : ''}`}>
            {selectedSplit ? (
              <SplitChat split={selectedSplit} onBack={handleBack} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-charcoal-400">
                <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Select a conversation</p>
                <p className="text-sm">Choose a split from the list to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}