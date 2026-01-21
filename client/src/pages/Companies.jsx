import { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  ExternalLink,
  Building2,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';

const categories = [
  { value: 'all', label: 'All Categories' },
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

const categoryColors = {
  beverage: 'bg-blue-100 text-blue-700',
  snacks: 'bg-orange-100 text-orange-700',
  wellness: 'bg-green-100 text-green-700',
  beauty: 'bg-pink-100 text-pink-700',
  pet: 'bg-amber-100 text-amber-700',
  baby: 'bg-purple-100 text-purple-700',
  household: 'bg-slate-100 text-slate-700',
  supplements: 'bg-teal-100 text-teal-700',
  frozen: 'bg-cyan-100 text-cyan-700',
  other: 'bg-gray-100 text-gray-700'
};

// Helper component for company avatar with logo support
function CompanyAvatar({ company, size = 'md' }) {
  const logo = company?.logoUrl || company?.logo;
  const sizeClasses = {
    sm: 'w-10 h-10 text-base',
    md: 'w-14 h-14 text-xl',
    lg: 'w-16 h-16 text-2xl'
  };
  
  if (logo) {
    return (
      <img 
        src={logo} 
        alt={company?.name || 'Company'}
        className={`${sizeClasses[size]} rounded-xl object-cover`}
      />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} bg-split-100 rounded-xl flex items-center justify-center`}>
      <span className="text-split-600 font-bold">
        {company?.name?.charAt(0) || '?'}
      </span>
    </div>
  );
}

// Helper to ensure website URL has protocol
function formatWebsiteUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCompanies(
          categoryFilter !== 'all' ? categoryFilter : undefined
        );
        setCompanies(data);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, [categoryFilter]);

  // Filter companies by search (client-side)
  const filteredCompanies = companies.filter(company => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      company.name?.toLowerCase().includes(searchLower) ||
      company.description?.toLowerCase().includes(searchLower) ||
      company.location?.toLowerCase().includes(searchLower)
    );
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-split-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card p-12 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
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
                    <CompanyAvatar company={company} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-charcoal-900 truncate">{company.name}</h3>
                      <span className={`badge ${categoryColors[company.category] || categoryColors.other} mt-1`}>
                        {company.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {company.description && (
                    <p className="text-sm text-charcoal-600 mb-4 line-clamp-2">
                      {company.description}
                    </p>
                  )}
                  
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
                      {company.splitsCompleted || 0} split{company.splitsCompleted !== 1 ? 's' : ''} completed
                    </span>
                    
                    {company.website && (
                      <a
                        href={formatWebsiteUrl(company.website)}
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
              <p className="text-charcoal-600">
                {search ? 'No companies found matching your search' : 'No companies yet'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}