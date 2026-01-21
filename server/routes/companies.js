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
    const companies = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Normalize logo field - return as logoUrl for frontend consistency
        logoUrl: data.logoUrl || data.logo || null
      };
    });
    
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
    const data = doc.data();
    res.json({ 
      id: doc.id, 
      ...data,
      // Normalize logo field
      logoUrl: data.logoUrl || data.logo || null
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

// Create company profile
router.post('/', async (req, res) => {
  try {
    const { name, logo, logoUrl, category, description, location, website, userId } = req.body;
    
    if (!name || !userId) {
      return res.status(400).json({ error: 'Name and userId are required' });
    }
    
    // Accept both logo and logoUrl, prefer logoUrl
    const finalLogoUrl = logoUrl || logo || null;
    
    const companyData = {
      name,
      logoUrl: finalLogoUrl,
      logo: finalLogoUrl, // Keep for backwards compatibility
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
    
    // Use userId as document ID so we can easily look up by user
    await db.collection('companies').doc(userId).set(companyData);
    res.status(201).json({ id: userId, ...companyData });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Update company
router.put('/:id', async (req, res) => {
  try {
    const { name, logo, logoUrl, category, description, location, website } = req.body;
    
    // Accept both logo and logoUrl
    const finalLogoUrl = logoUrl !== undefined ? logoUrl : logo;
    
    const updateData = {
      ...(name && { name }),
      ...(finalLogoUrl !== undefined && { logoUrl: finalLogoUrl, logo: finalLogoUrl }),
      ...(category && { category }),
      ...(description !== undefined && { description }),
      ...(location !== undefined && { location }),
      ...(website !== undefined && { website }),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('companies').doc(req.params.id).update(updateData);
    
    // Fetch and return updated document
    const doc = await db.collection('companies').doc(req.params.id).get();
    res.json({ id: req.params.id, ...doc.data() });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

module.exports = router;