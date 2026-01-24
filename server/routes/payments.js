const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { db } = require('../config/firebase');

// Initialize Stripe (will use env var)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Create Stripe Connect account for a company
router.post('/connect/create', async (req, res) => {
  try {
    const { companyId, email, businessName } = req.body;
    
    if (!companyId || !email) {
      return res.status(400).json({ error: 'companyId and email are required' });
    }
    
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.',
        demo: true 
      });
    }
    
    // Check if company already has a Stripe account
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = companyDoc.data();
    if (company.stripeConnectId) {
      return res.status(400).json({ 
        error: 'Company already has Stripe Connect account',
        accountId: company.stripeConnectId 
      });
    }
    
    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: {
        name: businessName || company.name,
        product_description: 'CPG brand participating in cost-sharing splits'
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });
    
    // Save to company
    await db.collection('companies').doc(companyId).update({
      stripeConnectId: account.id,
      stripeOnboarded: false,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ 
      accountId: account.id,
      message: 'Stripe Connect account created. Complete onboarding to receive payments.'
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(500).json({ error: error.message || 'Failed to create Stripe Connect account' });
  }
});

// Get Stripe Connect onboarding link
router.post('/connect/onboarding', async (req, res) => {
  try {
    const { companyId, returnUrl, refreshUrl } = req.body;
    
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      return res.status(503).json({ 
        error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.',
        demo: true 
      });
    }
    
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = companyDoc.data();
    if (!company.stripeConnectId) {
      return res.status(400).json({ error: 'No Stripe Connect account. Create one first.' });
    }
    
    const accountLink = await stripe.accountLinks.create({
      account: company.stripeConnectId,
      return_url: returnUrl || `${process.env.FRONTEND_URL}/settings?onboarding=complete`,
      refresh_url: refreshUrl || `${process.env.FRONTEND_URL}/settings?onboarding=refresh`,
      type: 'account_onboarding'
    });
    
    res.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating onboarding link:', error);
    res.status(500).json({ error: error.message || 'Failed to create onboarding link' });
  }
});

// Check Connect account status
router.get('/connect/status/:companyId', async (req, res) => {
  try {
    const companyDoc = await db.collection('companies').doc(req.params.companyId).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = companyDoc.data();
    if (!company.stripeConnectId) {
      return res.json({ 
        hasAccount: false,
        onboarded: false 
      });
    }
    
    const account = await stripe.accounts.retrieve(company.stripeConnectId);
    const onboarded = account.charges_enabled && account.payouts_enabled;
    
    // Update company if status changed
    if (onboarded !== company.stripeOnboarded) {
      await db.collection('companies').doc(req.params.companyId).update({
        stripeOnboarded: onboarded,
        updatedAt: new Date().toISOString()
      });
    }
    
    res.json({
      hasAccount: true,
      accountId: company.stripeConnectId,
      onboarded,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
  } catch (error) {
    console.error('Error checking Connect status:', error);
    res.status(500).json({ error: 'Failed to check account status' });
  }
});

// Create Stripe Checkout Session for split payment
router.post('/split/:splitId/pay', async (req, res) => {
  try {
    const { companyId } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }
    
    // Get split details
    const splitDoc = await db.collection('splits').doc(req.params.splitId).get();
    if (!splitDoc.exists) {
      return res.status(404).json({ error: 'Split not found' });
    }
    
    const split = splitDoc.data();
    
    // Verify company is a participant
    const participant = split.participants?.find(p => p.companyId === companyId);
    if (!participant) {
      return res.status(400).json({ error: 'Company is not a participant in this split' });
    }
    
    if (participant.paid) {
      return res.status(400).json({ error: 'Already paid for this split' });
    }
    
    // Get organizer's Stripe account for destination
    const organizerDoc = await db.collection('companies').doc(split.organizerId).get();
    const organizer = organizerDoc.data();
    
    if (!organizer?.stripeConnectId || !organizer?.stripeOnboarded) {
      return res.status(400).json({ 
        error: 'Organizer has not completed Stripe setup. Contact them to complete onboarding.' 
      });
    }
    
    // Calculate amount (cost per slot in cents)
    const amount = split.costPerSlot * 100;
    
    // Platform fee (e.g., 2.5%)
    const platformFee = Math.round(amount * 0.025);
    
    // Get frontend URL for redirects
    const frontendUrl = process.env.FRONTEND_URL || 'https://split-cpg.vercel.app';
    
    // Create Checkout Session with destination charge
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Split: ${split.title}`,
            description: `Your share of the ${split.type} split`
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: organizer.stripeConnectId
        },
        metadata: {
          splitId: req.params.splitId,
          companyId,
          splitTitle: split.title
        }
      },
      success_url: `${frontendUrl}/splits/${req.params.splitId}?payment=success`,
      cancel_url: `${frontendUrl}/splits/${req.params.splitId}?payment=cancelled`,
      metadata: {
        splitId: req.params.splitId,
        companyId
      }
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment session' });
  }
});

// Webhook handler for payment confirmations
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const { splitId, companyId } = paymentIntent.metadata;
      
      if (splitId && companyId) {
        // Mark participant as paid
        const splitDoc = await db.collection('splits').doc(splitId).get();
        if (splitDoc.exists) {
          const split = splitDoc.data();
          const updatedParticipants = split.participants.map(p =>
            p.companyId === companyId
              ? { ...p, paid: true, paidAt: new Date().toISOString() }
              : p
          );
          
          // Check if all participants have paid
          const allPaid = updatedParticipants.every(p => p.paid);
          
          await db.collection('splits').doc(splitId).update({
            participants: updatedParticipants,
            status: allPaid ? 'completed' : split.status,
            updatedAt: new Date().toISOString()
          });
        }
      }
      break;
      
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
});

// Create Stripe Express dashboard login link
router.post('/connect/dashboard', async (req, res) => {
  try {
    const { companyId } = req.body;
    
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      return res.status(503).json({ 
        error: 'Stripe is not configured',
        demo: true 
      });
    }
    
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = companyDoc.data();
    if (!company.stripeConnectId) {
      return res.status(400).json({ error: 'No Stripe Connect account' });
    }
    
    const loginLink = await stripe.accounts.createLoginLink(company.stripeConnectId);
    res.json({ url: loginLink.url });
  } catch (error) {
    console.error('Error creating dashboard link:', error);
    res.status(500).json({ error: error.message || 'Failed to create dashboard link' });
  }
});

// Get payment history for a company
router.get('/history/:companyId', async (req, res) => {
  try {
    // Get all splits where company participated and paid
    const splitsSnapshot = await db.collection('splits').get();
    
    const payments = [];
    splitsSnapshot.docs.forEach(doc => {
      const split = doc.data();
      const participant = split.participants?.find(
        p => p.companyId === req.params.companyId && p.paid
      );
      
      if (participant) {
        payments.push({
          splitId: doc.id,
          splitTitle: split.title,
          splitType: split.type,
          amount: split.costPerSlot,
          paidAt: participant.paidAt,
          status: split.status
        });
      }
    });
    
    // Sort by date descending
    payments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;