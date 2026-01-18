import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Scissors, ArrowRight, Building2, Upload } from 'lucide-react';

const categories = [
  { value: 'beverage', label: 'Beverage' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'pet', label: 'Pet' },
  { value: 'baby', label: 'Baby & Kids' },
  { value: 'household', label: 'Household' },
  { value: 'supplements', label: 'Supplements' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'other', label: 'Other' }
];

export default function Onboarding() {
  const { user, setCurrentCompany } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    location: '',
    website: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;

    setLoading(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user.id
        })
      });

      if (!response.ok) throw new Error('Failed to create company');
      
      const company = await response.json();
      setCurrentCompany(company);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating company:', error);
      // For demo, create locally
      const demoCompany = {
        id: `company_${Date.now()}`,
        ...formData,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      setCurrentCompany(demoCompany);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-split-200 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-forest-200 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-split-500 rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl text-charcoal-900">Split</span>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-forest-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-forest-600" />
            </div>
            <h1 className="font-display text-2xl text-charcoal-900">Set up your brand</h1>
            <p className="text-charcoal-600 mt-1">
              Tell us about your company so others can find you
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="label">Company Name *</label>
              <input
                type="text"
                name="name"
                className="input"
                placeholder="e.g. BYTE'M Brownies"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="label">Category *</label>
              <select
                name="category"
                className="input"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="label">Short Description</label>
              <textarea
                name="description"
                className="input min-h-[100px] resize-none"
                placeholder="What does your brand do? (2-3 sentences)"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            {/* Location */}
            <div>
              <label className="label">Location</label>
              <input
                type="text"
                name="location"
                className="input"
                placeholder="e.g. New York, NY"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            {/* Website */}
            <div>
              <label className="label">Website</label>
              <input
                type="url"
                name="website"
                className="input"
                placeholder="https://yourbrand.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            {/* Logo Upload Placeholder */}
            <div>
              <label className="label">Logo (optional)</label>
              <div className="border-2 border-dashed border-charcoal-200 rounded-xl p-6 text-center hover:border-split-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-charcoal-400 mx-auto mb-2" />
                <p className="text-sm text-charcoal-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-charcoal-400 mt-1">
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.category}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Creating...' : 'Complete Setup'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-charcoal-500 mt-6">
          You can update this information anytime in Settings
        </p>
      </div>
    </div>
  );
}
