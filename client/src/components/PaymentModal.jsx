import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../config/stripe';
import { CreditCard, Lock, AlertCircle, Check } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Card element styling
const cardStyle = {
  style: {
    base: {
      color: '#1a1a1a',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#888888'
      }
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626'
    }
  }
};

function CheckoutForm({ amount, splitTitle, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In production, create payment intent on your backend
      // const response = await fetch('/api/payments/split/{splitId}/pay', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ companyId: company.id })
      // });
      // const { clientSecret } = await response.json();

      // For demo, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSucceeded(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
      
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (succeeded) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-display text-xl text-charcoal-900 mb-2">Payment Successful!</h3>
        <p className="text-charcoal-600">You're all set for this split.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="text-center p-4 bg-split-50 rounded-xl">
        <p className="text-sm text-split-600 mb-1">Amount due</p>
        <p className="text-3xl font-bold text-split-700">${amount}</p>
        <p className="text-sm text-charcoal-500 mt-1">{splitTitle}</p>
      </div>

      {/* Card Input */}
      <div>
        <label className="label">Card Details</label>
        <div className="p-4 border border-charcoal-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-split-500/20 focus-within:border-split-500 transition-all">
          <CardElement options={cardStyle} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-charcoal-500">
        <Lock className="w-4 h-4" />
        <span>Secured by Stripe. Your payment info is encrypted.</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn-primary flex-1"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay ${amount}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Wrapper component that provides Stripe context
export default function PaymentModal({ isOpen, onClose, amount, splitTitle, onSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-charcoal-400 hover:text-charcoal-600"
        >
          ✕
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-split-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-split-600" />
          </div>
          <div>
            <h2 className="font-display text-xl text-charcoal-900">Complete Payment</h2>
            <p className="text-sm text-charcoal-500">Secure checkout via Stripe</p>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            amount={amount}
            splitTitle={splitTitle}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        </Elements>
      </div>
    </div>
  );
}
