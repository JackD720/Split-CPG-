const API_URL = 'https://split-backend-720273557833.us-central1.run.app';

export const api = {
  getSplits: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    const res = await fetch(API_URL + '/api/splits?' + searchParams);
    if (!res.ok) throw new Error('Failed to fetch splits');
    return res.json();
  },
  
  getSplit: async (id) => {
    const res = await fetch(API_URL + '/api/splits/' + id);
    if (!res.ok) throw new Error('Failed to fetch split');
    return res.json();
  },
  
  createSplit: async (data) => {
    const res = await fetch(API_URL + '/api/splits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create split');
    return res.json();
  },
  
  joinSplit: async (id, companyId) => {
    const res = await fetch(API_URL + '/api/splits/' + id + '/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    });
    if (!res.ok) throw new Error('Failed to join split');
    return res.json();
  },
  
  leaveSplit: async (id, companyId) => {
    const res = await fetch(API_URL + '/api/splits/' + id + '/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    });
    if (!res.ok) throw new Error('Failed to leave split');
    return res.json();
  },

  cancelSplit: async (id) => {
    const res = await fetch(API_URL + '/api/splits/' + id + '/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to cancel split');
    return res.json();
  },

  deleteSplit: async (id) => {
    const res = await fetch(API_URL + '/api/splits/' + id, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete split');
    return res.json();
  },

  getCompanies: async (category) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    const res = await fetch(API_URL + '/api/companies?' + params);
    if (!res.ok) throw new Error('Failed to fetch companies');
    return res.json();
  },
  
  getCompany: async (id) => {
    const res = await fetch(API_URL + '/api/companies/' + id);
    if (!res.ok) throw new Error('Failed to fetch company');
    return res.json();
  },
};