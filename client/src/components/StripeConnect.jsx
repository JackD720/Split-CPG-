import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, ExternalLink, Check, AlertCircle, Loader } from 'lucide-react';

const API_URL = 'https://split-backend-720273557833.us-central1.run.app';

// Helper to safely parse JSON response
const safeJsonParse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export default function StripeConnect() {
  const { company, updateCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const stripeStatus = {
    hasAccount: company?.stripeConnectId,
    onboarded: company?.stripeOnboarded
  };

  // Check Stripe status on mount and when returning from onboarding
  useEffect(() => {
    const checkStripeStatus = async () => {
      if (!company?.id) return;
      
      // Check if we're returning from onboarding
      const urlParams = new URLSearchParams(window.location.search);
      const onboardingStatus = urlParams.get('onboarding');
      
      // Check status if we have an account but not onboarded, or returning from onboarding
      if ((company.stripeConnectId && !company.stripeOnboarded) || onboardingStatus === 'complete') {
        setCheckingStatus(true);
        try {
          const response = await fetch(`${API_URL}/api/payments/connect/status/${company.id}`);
          const data = await safeJsonParse(response);
          
          if (data?.onboarded && !company.stripeOnboarded) {
            // Update local state
            await updateCompany({ stripeOnboarded: true });
          }
          
          // Clear the URL param
          if (onboardingStatus) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (err) {
          console.error('Error checking Stripe status:', err);
        } finally {
          setCheckingStatus(false);
        }
      }
    };
    
    checkStripeStatus();
  }, [company?.id, company?.stripeConnectId, company?.stripeOnboarded]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create Connect account
      const createResponse = await fetch(`${API_URL}/api/payments/connect/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          email: company.email || 'test@example.com',
          businessName: company.name
        })
      });

      const createData = await safeJsonParse(createResponse);

      if (!createResponse.ok) {
        throw new Error(createData?.error || 'Failed to create account');
      }

      if (!createData?.accountId) {
        throw new Error('No account ID returned from server');
      }

      const { accountId } = createData;

      // Get onboarding link
      const linkResponse = await fetch(`${API_URL}/api/payments/connect/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          returnUrl: `${window.location.origin}/settings?onboarding=complete`,
          refreshUrl: `${window.location.origin}/settings?onboarding=refresh`
        })
      });

      const linkData = await safeJsonParse(linkResponse);

      if (!linkResponse.ok || !linkData?.url) {
        throw new Error('Failed to get onboarding link');
      }

      // Update company with Stripe account ID
      await updateCompany({ stripeConnectId: accountId });

      // Redirect to Stripe onboarding
      window.location.href = linkData.url;

    } catch (err) {
      console.error('Stripe Connect error:', err);
      setError(err.message || 'Failed to connect Stripe. Please try again.');
      
      // For demo without backend, simulate the flow
      if (err.message?.includes('fetch') || err.message?.includes('No account')) {
        await updateCompany({ stripeConnectId: 'demo_account', stripeOnboarded: false });
        setError(null);
        alert('Demo mode: In production, this would redirect to Stripe onboarding. Account marked as created.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      // In production, this would create a login link to Stripe Express dashboard
      const response = await fetch(`${API_URL}/api/payments/connect/dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      });

      const data = await safeJsonParse(response);

      if (response.ok && data?.url) {
        window.open(data.url, '_blank');
      } else {
        // Demo fallback
        window.open('https://dashboard.stripe.com', '_blank');
      }
    } catch (err) {
      window.open('https://dashboard.stripe.com', '_blank');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const linkResponse = await fetch(`${API_URL}/api/payments/connect/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          returnUrl: `${window.location.origin}/settings?onboarding=complete`,
          refreshUrl: `${window.location.origin}/settings?onboarding=refresh`
        })
      });

      const data = await safeJsonParse(linkResponse);

      if (linkResponse.ok && data?.url) {
        window.location.href = data.url;
      } else {
        // Demo mode
        await updateCompany({ stripeOnboarded: true });
        alert('Demo mode: Marked as onboarded. In production, this redirects to Stripe.');
      }
    } catch (err) {
      // Demo fallback
      await updateCompany({ stripeOnboarded: true });
      alert('Demo mode: Marked as onboarded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="font-display text-xl text-charcoal-900">Stripe Connect</h2>
          <p className="text-charcoal-600 text-sm mt-1">
            Connect your Stripe account to receive payments from splits you organize
          </p>
        </div>
      </div>

      {/* Status Display */}
      {!stripeStatus.hasAccount ? (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Connect Required</p>
              <p className="text-sm text-amber-700 mt-1">
                You need to connect a Stripe account before you can receive payments from splits you organize.
              </p>
            </div>
          </div>
        </div>
      ) : stripeStatus.onboarded ? (
        <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-6">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Connected & Ready</p>
              <p className="text-sm text-green-700 mt-1">
                Your Stripe account is connected and ready to receive payments.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Onboarding Incomplete</p>
              <p className="text-sm text-blue-700 mt-1">
                Complete your Stripe onboarding to start receiving payments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Checking status indicator */}
      {checkingStatus && (
        <div className="p-4 bg-charcoal-50 rounded-xl border border-charcoal-200 mb-6">
          <div className="flex items-center gap-3">
            <Loader className="w-5 h-5 text-charcoal-600 animate-spin" />
            <p className="text-sm text-charcoal-700">Checking Stripe account status...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={
          !stripeStatus.hasAccount 
            ? handleConnect 
            : stripeStatus.onboarded 
              ? handleManage 
              : completeOnboarding
        }
        disabled={loading || checkingStatus}
        className={stripeStatus.onboarded ? 'btn-secondary' : 'btn-primary'}
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Please wait...
          </>
        ) : !stripeStatus.hasAccount ? (
          'Connect Stripe Account'
        ) : stripeStatus.onboarded ? (
          <>
            Manage Stripe Account
            <ExternalLink className="w-4 h-4" />
          </>
        ) : (
          'Complete Onboarding'
        )}
      </button>

      {/* Check Status Button - show when onboarding incomplete */}
      {stripeStatus.hasAccount && !stripeStatus.onboarded && (
        <button
          onClick={async () => {
            setCheckingStatus(true);
            setError(null);
            try {
              const response = await fetch(`${API_URL}/api/payments/connect/status/${company.id}`);
              const data = await safeJsonParse(response);
              
              console.log('Stripe status response:', data);
              
              if (data?.onboarded) {
                await updateCompany({ stripeOnboarded: true });
              } else {
                setError(`Stripe onboarding is still incomplete. Charges enabled: ${data?.chargesEnabled}, Payouts enabled: ${data?.payoutsEnabled}`);
              }
            } catch (err) {
              console.error('Error checking status:', err);
              setError('Failed to check status. Please try again.');
            } finally {
              setCheckingStatus(false);
            }
          }}
          disabled={loading || checkingStatus}
          className="btn-secondary mt-3 w-full"
        >
          {checkingStatus ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            'I\'ve Completed Onboarding - Check Status'
          )}
        </button>
      )}

      {/* Fallback: Manual refresh button if something is wrong */}
      {!stripeStatus.onboarded && (
        <button
          onClick={async () => {
            setCheckingStatus(true);
            setError(null);
            try {
              const response = await fetch(`${API_URL}/api/payments/connect/status/${company.id}`);
              const data = await safeJsonParse(response);
              
              console.log('Stripe status check:', data);
              
              if (data?.onboarded) {
                await updateCompany({ stripeOnboarded: true });
                alert('Success! Your Stripe account is now connected.');
              } else if (data?.hasAccount) {
                setError(`Still incomplete. Charges: ${data?.chargesEnabled ? 'Yes' : 'No'}, Payouts: ${data?.payoutsEnabled ? 'Yes' : 'No'}`);
              } else {
                setError('No Stripe account found. Please click "Connect Stripe Account" first.');
              }
            } catch (err) {
              console.error('Error:', err);
              setError('Failed to check. See console for details.');
            } finally {
              setCheckingStatus(false);
            }
          }}
          disabled={checkingStatus}
          className="text-sm text-charcoal-500 hover:text-charcoal-700 mt-4 underline"
        >
          {checkingStatus ? 'Checking...' : 'Refresh Stripe Status'}
        </button>
      )}

      {/* How it works */}
      <div className="mt-8 pt-6 border-t border-charcoal-100">
        <h3 className="font-medium text-charcoal-900 mb-4">How Payments Work</h3>
        
        <div className="space-y-4 text-sm text-charcoal-600">
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-split-100 rounded-full flex items-center justify-center flex-shrink-0 text-split-600 font-medium text-xs">
              1
            </div>
            <p>When you organize a split, participants pay through Stripe when the split is full.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-split-100 rounded-full flex items-center justify-center flex-shrink-0 text-split-600 font-medium text-xs">
              2
            </div>
            <p>Funds are automatically transferred to your connected Stripe account.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-split-100 rounded-full flex items-center justify-center flex-shrink-0 text-split-600 font-medium text-xs">
              3
            </div>
            <p>Split takes a small 2.5% platform fee to keep the lights on.</p>
          </div>
        </div>
      </div>
    </div>
  );
}