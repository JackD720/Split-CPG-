const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get upcoming events
router.get('/', async (req, res) => {
  try {
    const { type, location, upcoming } = req.query;
    
    let query = db.collection('events').orderBy('date', 'asc');
    
    // Only show future events by default
    if (upcoming !== 'false') {
      const today = new Date().toISOString().split('T')[0];
      query = query.where('date', '>=', today);
    }
    
    if (type && type !== 'all') {
      query = query.where('type', '==', type);
    }
    
    const snapshot = await query.limit(50).get();
    let events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter by location client-side
    if (location) {
      const locationLower = location.toLowerCase();
      events = events.filter(e => 
        e.location?.toLowerCase().includes(locationLower) ||
        e.city?.toLowerCase().includes(locationLower)
      );
    }
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('events').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get related splits for this event
    const splitsSnapshot = await db.collection('splits')
      .where('eventId', '==', req.params.id)
      .get();
    
    const relatedSplits = splitsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ 
      id: doc.id, 
      ...doc.data(),
      relatedSplits 
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event (manual entry or from integration)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      endDate,
      location,
      city,
      type,
      url,
      source,
      sourceId,
      imageUrl
    } = req.body;
    
    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }
    
    // Check for duplicate (same source and sourceId)
    if (source && sourceId) {
      const existing = await db.collection('events')
        .where('source', '==', source)
        .where('sourceId', '==', sourceId)
        .get();
      
      if (!existing.empty) {
        return res.status(409).json({ 
          error: 'Event already exists',
          existingId: existing.docs[0].id 
        });
      }
    }
    
    const eventData = {
      name,
      description: description || '',
      date,
      endDate: endDate || date,
      location: location || '',
      city: city || '',
      type: type || 'trade_show', // trade_show, conference, popup, networking
      url: url || null,
      source: source || 'manual', // manual, luma, eventbrite
      sourceId: sourceId || null,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('events').add(eventData);
    res.status(201).json({ id: docRef.id, ...eventData });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Sync events from Luma (webhook or manual trigger)
router.post('/sync/luma', async (req, res) => {
  try {
    // This would integrate with Luma API
    // For now, return placeholder
    res.json({ 
      message: 'Luma sync endpoint ready',
      note: 'Add LUMA_API_KEY to environment for full integration'
    });
  } catch (error) {
    console.error('Error syncing Luma events:', error);
    res.status(500).json({ error: 'Failed to sync events' });
  }
});

// Seed some sample events for demo
router.post('/seed', async (req, res) => {
  try {
    const sampleEvents = [
      {
        name: 'Expo West 2025',
        description: 'Natural & organic products expo - the biggest CPG trade show of the year',
        date: '2025-03-04',
        endDate: '2025-03-08',
        location: 'Anaheim Convention Center',
        city: 'Anaheim, CA',
        type: 'trade_show',
        url: 'https://www.expowest.com',
        source: 'manual',
        imageUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        name: 'Fancy Food Show NYC',
        description: 'Specialty food industry trade show',
        date: '2025-06-29',
        endDate: '2025-07-01',
        location: 'Javits Center',
        city: 'New York, NY',
        type: 'trade_show',
        url: 'https://www.specialtyfood.com',
        source: 'manual',
        imageUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        name: 'CPG Founders Meetup',
        description: 'Casual networking for emerging CPG brands',
        date: '2025-02-15',
        endDate: '2025-02-15',
        location: 'WeWork Soho',
        city: 'New York, NY',
        type: 'networking',
        url: null,
        source: 'manual',
        imageUrl: null,
        createdAt: new Date().toISOString()
      },
      {
        name: 'NOSH Live Winter',
        description: 'Conference for better-for-you food & beverage brands',
        date: '2025-01-27',
        endDate: '2025-01-28',
        location: 'The Ritz-Carlton',
        city: 'Marina del Rey, CA',
        type: 'conference',
        url: 'https://www.noshlive.com',
        source: 'manual',
        imageUrl: null,
        createdAt: new Date().toISOString()
      }
    ];
    
    const results = [];
    for (const event of sampleEvents) {
      // Check if already exists
      const existing = await db.collection('events')
        .where('name', '==', event.name)
        .where('date', '==', event.date)
        .get();
      
      if (existing.empty) {
        const docRef = await db.collection('events').add(event);
        results.push({ id: docRef.id, ...event });
      }
    }
    
    res.json({ 
      message: `Seeded ${results.length} events`,
      events: results 
    });
  } catch (error) {
    console.error('Error seeding events:', error);
    res.status(500).json({ error: 'Failed to seed events' });
  }
});

module.exports = router;
