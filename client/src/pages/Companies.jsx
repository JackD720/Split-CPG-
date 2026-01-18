import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ExternalLink,
  Filter,
  Building2
} from 'lucide-react';

// Mock companies data
const mockCompanies = [
  {
    id: '1',
    name: 'BYTE\'M Brownies',
    category: 'snacks',
    description: 'Better-for-you brownie bites made with clean ingredients',
    location: 'New York, NY',
    website: 'https://bytembrownies.com',
    splitsCompleted: 3
  },
  {
    id: '2',
    name: 'Healthy Snacks Co',
    category: 'snacks',
    description: 'Plant-based snacks for active lifestyles',
    location: 'Los Angeles, CA',
    website: 'https://healthysnacks.co',
    splitsCompleted: 5
  },
  {
    id: '3',
    name: 'Refresh Beverages',
    category: 'beverage',
    description: 'Functional beverages with adaptogens and nootropics',
    location: 'Austin, TX',
    website: 'https://refreshbev.com',
    splitsCompleted: 2
  },
  {
    id: '4',
    name: 'Glow Beauty',
    category: 'beauty',
    description: 'Clean beauty products for everyday radiance',
    location: 'Miami, FL',
    website: 'https://glowbeauty.com',
    splitsCompleted: 4
  },
  {
    id: '5',
    name: 'Pure Wellness',
    category: 'wellness',
    description: 'Supplements and wellness products backed by science',
    location: 'San Francisco, CA',
    website: 'https://purewellness.com',
    splitsCompleted: 1
  },
  {
    id: '6',
    name: 'Happy Paws',
    category: 'pet',
    description: 'Premium pet food and treats made with love',
    location: 'Denver, CO',
    website: 'https://happypaws.com',
    splitsCompleted: 2
  },
  {
    id: '7',
    name: 'Little Ones',
    category: 'baby',
    description: 'Organic baby food and snacks for growing minds',
    location: 'Portland, OR',
    website: 'https://littleones.com',
    splitsCompleted: 3
  },
  {
    id: '8',
    name: 'Artisan Foods',
    category: 'snacks',
    description: 'Small-batch gourmet snacks with global flavors',
    location: 'Chicago, IL',
    website: 'https://artisanfoods.com',
    splitsCompleted: 6
  }
];

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'beverage', label: 'Beverage' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'pet', label: 'Pet' },
  { value: 'baby', label: 'Baby & Kids' },
  { value: 'household', label: 'Household' },
  { value: 'supplements', label: 'Supplements' }
];

const categoryColors = {
  beverage: 'bg-blue-100 text-blue-700',
  snacks: 'bg-orange-100 text-orange-700',
  wellness: 'bg-green-100 text-green-700',
  beauty: 'bg-pink-100 text-pink-700',
  pet: 'bg-amber-100 text-amber-700',
  baby: 'bg-purple-100 text-purple-700',
  household: 'bg-slate-100 text-slate-700',
  supplements: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-700'
};

export default function Companies() {
  const [companies, setCompanies] = useState(mockCompanies);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !search || 
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.description?.toLowerCase().includes(search.toLowerCase()) ||
      company.location?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || company.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-charcoal-900">Companies</h1>
        <p className="text-charcoal-600 mt-1">
          Discover CPG brands to collaborate with
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* Category Filter */}
          <select
            className="input w-full sm:w-48"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-charcoal-500">
        {filteredCompanies.length} compan{filteredCompanies.length !== 1 ? 'ies' : 'y'} found
      </p>

      {/* Companies Grid */}
      {filteredCompanies.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company, index) => (
            <div
              key={company.id}
              className="card p-6 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-split-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-split-600 font-bold text-xl">
                    {company.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-charcoal-900 truncate">{company.name}</h3>
                  <span className={`badge ${categoryColors[company.category] || categoryColors.other} mt-1`}>
                    {company.category}
                  </span>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm text-charcoal-600 mb-4 line-clamp-2">
                {company.description}
              </p>
              
              {/* Location */}
              {company.location && (
                <div className="flex items-center gap-1.5 text-sm text-charcoal-500 mb-4">
                  <MapPin className="w-4 h-4" />
                  {company.location}
                </div>
              )}
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-charcoal-100">
                <span className="text-xs text-charcoal-500">
                  {company.splitsCompleted} split{company.splitsCompleted !== 1 ? 's' : ''} completed
                </span>
                
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-split-600 hover:text-split-700 text-sm flex items-center gap-1"
                  >
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Building2 className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
          <p className="text-charcoal-600">No companies found matching your search</p>
        </div>
      )}
    </div>
  );
}
