const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Split types
const SPLIT_TYPES = ['content', 'housing', 'popup', 'other'];

// Helper to normalize company data (ensure logoUrl is present)
const normalizeCompany = (data) => {
  if (!data) return null;
  return {
    ...data,
    logoUrl: data.logoUrl || data.logo || null
  };
};

// Get all splits (with filters)
router.get('/', async (req, res) => {
  try {
    const { type, status, location, companyId } = req.query;
    let query = db.collection('splits').orderBy('createdAt', 'desc');
    
    if (type && type !== 'all') {
      query = query.where('type', '==', type);
    }
    
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.limit(100).get();
    let splits = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter by company participation if requested
    if (companyId) {
      splits = splits.filter(s => 
        s.organizerId === companyId || 
        s.participants?.some(p => p.companyId === companyId)
      );
    }
    
    // Filter by location (client-side)
    if (location) {
      const locationLower = location.toLowerCase();
      splits = splits.filter(s => 
        s.location?.toLowerCase().includes(locationLower)
      );
    }
    
    res.json(splits);
  } catch (error) {
    console.error('Error fetching splits:', error);
    res.status(500).json({ error: 'Failed to fetch splits' });
  }
});

// Get single split with full details
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('splits').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Split not found' });
    }
    
    const splitData = { id: doc.id, ...doc.data() };
    
    // Fetch organizer details
    if (splitData.organizerId) {
      const orgDoc = await db.collection('companies').doc(splitData.organizerId).get();
      if (orgDoc.exists) {
        splitData.organizer = normalizeCompany({ id: orgDoc.id, ...orgDoc.data() });
      }
    }
    
    // Fetch participant company details
    if (splitData.participants?.length > 0) {
      const participantIds = splitData.participants.map(p => p.companyId);
      const uniqueIds = [...new Set(participantIds)];
      
      const companyDocs = await Promise.all(
        uniqueIds.map(id => db.collection('companies').doc(id).get())
      );
      
      const companyMap = {};
      companyDocs.forEach(doc => {
        if (doc.exists) {
          companyMap[doc.id] = normalizeCompany({ id: doc.id, ...doc.data() });
        }
      });
      
      splitData.participants = splitData.participants.map(p => ({
        ...p,
        company: companyMap[p.companyId] || null
      }));
    }
    
    res.json(splitData);
  } catch (error) {
    console.error('Error fetching split:', error);
    res.status(500).json({ error: 'Failed to fetch split' });
  }
});

// Create a new split
router.post('/', async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      totalCost,
      slots,
      deadline,
      location,
      eventDate,
      organizerId,
      vendorName,
      vendorDetails
    } = req.body;
    
    // Validation
    if (!title || !type || !totalCost || !slots || !organizerId) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, type, totalCost, slots, organizerId' 
      });
    }
    
    if (!SPLIT_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid split type' });
    }
    
    const costPerSlot = Math.ceil(totalCost / slots);
    
    const splitData = {
      title,
      type,
      description: description || '',
      totalCost: Number(totalCost),
      costPerSlot,
      slots: Number(slots),
      filledSlots: 1, // Organizer takes first slot
      deadline: deadline || null,
      location: location || '',
      eventDate: eventDate || null,
      organizerId,
      vendorName: vendorName || null,
      vendorDetails: vendorDetails || null,
      participants: [{
        companyId: organizerId,
        joinedAt: new Date().toISOString(),
        paid: false,
        paymentIntentId: null
      }],
      status: 'open', // open, full, completed, cancelled
      stripeProductId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('splits').add(splitData);
    res.status(201).json({ id: docRef.id, ...splitData });
  } catch (error) {
    console.error('Error creating split:', error);
    res.status(500).json({ error: 'Failed to create split' });
  }
});

// Join a split
router.post('/:id/join', async (req, res) => {
  try {
    const { companyId } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }
    
    const splitRef = db.collection('splits').doc(req.params.id);
    const doc = await splitRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Split not found' });
    }
    
    const split = doc.data();
    
    // Check if split is still open
    if (split.status !== 'open') {
      return res.status(400).json({ error: 'Split is no longer accepting participants' });
    }
    
    // Check if already joined
    if (split.participants?.some(p => p.companyId === companyId)) {
      return res.status(400).json({ error: 'Already joined this split' });
    }
    
    // Check if slots available
    if (split.filledSlots >= split.slots) {
      return res.status(400).json({ error: 'No slots available' });
    }
    
    // Add participant
    const newParticipant = {
      companyId,
      joinedAt: new Date().toISOString(),
      paid: false,
      paymentIntentId: null
    };
    
    const updatedParticipants = [...(split.participants || []), newParticipant];
    const newFilledSlots = split.filledSlots + 1;
    const newStatus = newFilledSlots >= split.slots ? 'full' : 'open';
    
    await splitRef.update({
      participants: updatedParticipants,
      filledSlots: newFilledSlots,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      filledSlots: newFilledSlots,
      status: newStatus,
      message: newStatus === 'full' ? 'Split is now full! Payment collection will begin.' : 'Successfully joined split'
    });
  } catch (error) {
    console.error('Error joining split:', error);
    res.status(500).json({ error: 'Failed to join split' });
  }
});

// Leave a split
router.post('/:id/leave', async (req, res) => {
  try {
    const { companyId } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }
    
    const splitRef = db.collection('splits').doc(req.params.id);
    const doc = await splitRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Split not found' });
    }
    
    const split = doc.data();
    
    // Can't leave if you're the organizer
    if (split.organizerId === companyId) {
      return res.status(400).json({ error: 'Organizer cannot leave. Cancel the split instead.' });
    }
    
    // Check if participant
    if (!split.participants?.some(p => p.companyId === companyId)) {
      return res.status(400).json({ error: 'Not a participant in this split' });
    }
    
    // Can't leave if already paid
    const participant = split.participants.find(p => p.companyId === companyId);
    if (participant.paid) {
      return res.status(400).json({ error: 'Cannot leave after payment. Contact organizer for refund.' });
    }
    
    const updatedParticipants = split.participants.filter(p => p.companyId !== companyId);
    
    await splitRef.update({
      participants: updatedParticipants,
      filledSlots: split.filledSlots - 1,
      status: 'open',
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'Left split successfully' });
  } catch (error) {
    console.error('Error leaving split:', error);
    res.status(500).json({ error: 'Failed to leave split' });
  }
});

// Cancel a split (organizer only)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { companyId } = req.body;
    
    const splitRef = db.collection('splits').doc(req.params.id);
    const doc = await splitRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Split not found' });
    }
    
    const split = doc.data();
    
    if (split.organizerId !== companyId) {
      return res.status(403).json({ error: 'Only organizer can cancel' });
    }
    
    // Check if any payments have been made
    const hasPaidParticipants = split.participants?.some(p => p.paid);
    if (hasPaidParticipants) {
      return res.status(400).json({ 
        error: 'Cannot cancel - some participants have paid. Process refunds first.' 
      });
    }
    
    await splitRef.update({
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'Split cancelled' });
  } catch (error) {
    console.error('Error cancelling split:', error);
    res.status(500).json({ error: 'Failed to cancel split' });
  }
});

// Delete a split
router.delete('/:id', async (req, res) => {
  try {
    const splitRef = db.collection('splits').doc(req.params.id);
    const doc = await splitRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Split not found' });
    }
    
    await splitRef.delete();
    res.json({ success: true, message: 'Split deleted' });
  } catch (error) {
    console.error('Error deleting split:', error);
    res.status(500).json({ error: 'Failed to delete split' });
  }
});

module.exports = router;