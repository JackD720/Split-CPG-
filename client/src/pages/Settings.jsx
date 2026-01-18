import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StripeConnect from '../components/StripeConnect';
import { 
  Building2, 
  CreditCard, 
  User,
  Check,
  Save
} from 'lucide-react';

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

export default function Settings() {
  const { user, company, updateCompany } = useAuth();
  const [activeTab, setActiveTab] = useState('company');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || '',
    category: company?.category || '',
    description: company?.description || '',
    location: company?.location || '',
    website: company?.website || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await updateCompany(formData);
      setSaved(true);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'account', label: 'Account', icon: User }
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="font-display text-3xl text-charcoal-900 mb-8">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-split-500 text-white'
                : 'bg-white text-charcoal-600 hover:bg-charcoal-50 border border-charcoal-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company Settings */}
      {activeTab === 'company' && (
        <div className="card p-6">
          <h2 className="font-display text-xl text-charcoal-900 mb-6">Company Profile</h2>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="label">Company Name</label>
              <input
                type="text"
                name="name"
                className="input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Category</label>
              <select
                name="category"
                className="input"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                className="input min-h-[100px] resize-none"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

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

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  'Saving...'
                ) : saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              
              {saved && (
                <span className="text-sm text-green-600">Changes saved successfully</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Payments Settings */}
      {activeTab === 'payments' && <StripeConnect />}

      {/* Account Settings */}
      {activeTab === 'account' && (
        <div className="card p-6">
          <h2 className="font-display text-xl text-charcoal-900 mb-6">Account</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                className="input bg-charcoal-50"
                value={user?.name || ''}
                disabled
              />
            </div>
            
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input bg-charcoal-50"
                value={user?.email || ''}
                disabled
              />
            </div>
            
            <p className="text-xs text-charcoal-500 pt-4">
              Account settings are managed through Firebase Authentication.
            </p>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-charcoal-100">
            <h3 className="font-medium text-red-600 mb-4">Danger Zone</h3>
            <button className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm">
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
