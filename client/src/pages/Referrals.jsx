import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Gift, 
  Copy, 
  Check, 
  Users, 
  DollarSign,
  Share2,
  Twitter,
  Linkedin,
  Mail,
  TrendingUp
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

export default function Referrals() {
  const { company } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({
    clicks: 0,
    signups: 0,
    earnings: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referredCompanies, setReferredCompanies] = useState([]);

  // Generate or fetch referral code
  useEffect(() => {
    if (!company?.id) return;

    const fetchOrCreateReferralCode = async () => {
      try {
        const referralRef = doc(db, 'referrals', company.id);
        const referralSnap = await getDoc(referralRef);

        if (referralSnap.exists()) {
          const data = referralSnap.data();
          setReferralCode(data.code);
          setReferralStats({
            clicks: data.clicks || 0,
            signups: data.signups || 0,
            earnings: data.earnings || 0
          });
        } else {
          // Generate a unique referral code
          const code = generateReferralCode(company.name);
          await setDoc(referralRef, {
            code,
            companyId: company.id,
            companyName: company.name,
            clicks: 0,
            signups: 0,
            earnings: 0,
            createdAt: new Date().toISOString()
          });
          setReferralCode(code);
        }

        // Fetch referred companies
        const referredQuery = query(
          collection(db, 'companies'),
          where('referredBy', '==', company.id)
        );
        const referredSnap = await getDocs(referredQuery);
        const referred = referredSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReferredCompanies(referred);

      } catch (error) {
        console.error('Error with referral code:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateReferralCode();
  }, [company?.id, company?.name]);

  const generateReferralCode = (companyName) => {
    const prefix = companyName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 4);
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
  };

  const referralUrl = `${window.location.origin}/?ref=${referralCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Track click
      const referralRef = doc(db, 'referrals', company.id);
      await updateDoc(referralRef, {
        clicks: increment(1)
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareTwitter = () => {
    const text = `I'm using Split to share costs with other CPG brands - photo shoots, events, housing, and more. Join with my referral link and we both benefit! 🎁`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Join Split - Cost sharing for CPG brands`);
    const body = encodeURIComponent(`Hey!\n\nI've been using Split to share costs with other CPG brands - things like photo shoots, trade show booths, event housing, and more.\n\nIt's been a great way to save money while getting professional resources.\n\nSign up with my referral link: ${referralUrl}\n\nLet me know if you have questions!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-charcoal-200 rounded w-48" />
          <div className="h-32 bg-charcoal-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-split-400 to-split-600 rounded-2xl flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-charcoal-900">Referrals</h1>
            <p className="text-charcoal-500">Invite brands and earn rewards</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal-900">{referralStats.clicks}</p>
              <p className="text-sm text-charcoal-500">Link Clicks</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal-900">{referralStats.signups}</p>
              <p className="text-sm text-charcoal-500">Sign Ups</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-split-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-split-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal-900">${referralStats.earnings}</p>
              <p className="text-sm text-charcoal-500">Earnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="card p-6 mb-8">
        <h2 className="font-display text-xl text-charcoal-900 mb-4">Your Referral Link</h2>
        
        <div className="bg-split-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-split-600 font-medium">Your Code:</span>
            <span className="font-mono text-lg font-bold text-split-700">{referralCode}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="input text-sm flex-1 bg-white"
            />
            <button
              onClick={copyLink}
              className={`btn-primary px-4 ${copied ? 'bg-green-500' : ''}`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={shareTwitter}
            className="btn-secondary flex-1 min-w-[120px]"
          >
            <Twitter className="w-4 h-4" />
            Twitter
          </button>
          <button
            onClick={shareLinkedIn}
            className="btn-secondary flex-1 min-w-[120px]"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </button>
          <button
            onClick={shareEmail}
            className="btn-secondary flex-1 min-w-[120px]"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="card p-6 mb-8">
        <h2 className="font-display text-xl text-charcoal-900 mb-4">How It Works</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-split-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-split-600 font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-medium text-charcoal-800">Share your link</p>
              <p className="text-sm text-charcoal-500">Send your unique referral link to other CPG brands</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-split-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-split-600 font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-medium text-charcoal-800">They sign up</p>
              <p className="text-sm text-charcoal-500">When they create an account using your link, they're connected to you</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-split-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-split-600 font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-medium text-charcoal-800">You both benefit</p>
              <p className="text-sm text-charcoal-500">When they complete their first paid split, you both get a bonus!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referred Companies */}
      {referredCompanies.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display text-xl text-charcoal-900 mb-4">
            Your Referrals ({referredCompanies.length})
          </h2>
          
          <div className="space-y-3">
            {referredCompanies.map((referred) => (
              <div 
                key={referred.id}
                className="flex items-center justify-between p-3 bg-charcoal-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {referred.logoUrl || referred.logo ? (
                    <img 
                      src={referred.logoUrl || referred.logo}
                      alt={referred.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-split-100 rounded-lg flex items-center justify-center">
                      <span className="text-split-600 font-semibold">
                        {referred.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-charcoal-800">{referred.name}</p>
                    <p className="text-sm text-charcoal-500 capitalize">{referred.category}</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Joined
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
