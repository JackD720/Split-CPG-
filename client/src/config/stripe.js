// Stripe publishable key - safe to expose in frontend
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SqnCuA2YagsgMmWvVPm32JqxcpPR2EudnjCCPdEnD2Wpf2qussFEvkuFwJp5mS3AmrvkBtNYJEIZlhghoGMTCWd00ZFfhwG8c';

// For production, set VITE_STRIPE_PUBLISHABLE_KEY in your environment
// For testing, use pk_test_... keys instead
