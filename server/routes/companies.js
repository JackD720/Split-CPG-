const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Get all companies (for discovery)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = db.collection('companies');
    
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.limit(50).get();
    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Client-side search filter if provided
    let filtered = companies;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = companies.filter(c => 
        c.name?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower)
      );
    }
    
    res.json(filtered);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get single company
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('companies').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Create company profile
router.post('/', async (req, res) => {
  try {
    const { name, logo, category, description, location, website, userId } = req.body;
    
    if (!name || !userId) {
      return res.status(400).json({ error: 'Name and userId are required' });
    }
    
    const companyData = {
      name,
      logo: logo || null,
      category: category || 'other',
      description: description || '',
      location: location || '',
      website: website || '',
      userId,
      stripeConnectId: null,
      stripeOnboarded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await db.collection('companies').add(companyData);
    res.status(201).json({ id: docRef.id, ...companyData });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Update company
router.put('/:id', async (req, res) => {
  try {
    const { name, logo, category, description, location, website } = req.body;
    
    const updateData = {
      ...(name && { name }),
      ...(logo !== undefined && { logo }),
      ...(category && { category }),
      ...(description !== undefined && { description }),
      ...(location !== undefined && { location }),
      ...(website !== undefined && { website }),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('companies').doc(req.params.id).update(updateData);
    res.json({ id: req.params.id, ...updateData });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

module.exports = router;
