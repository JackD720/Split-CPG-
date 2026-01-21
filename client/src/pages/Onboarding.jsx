import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Scissors, ArrowRight, Building2, Upload, X, Image } from 'lucide-react';

const API_URL = 'https://split-backend-720273557833.us-central1.run.app';

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
  const { user, company, hasCompany, setCurrentCompany } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    location: '',
    website: '',
    logoUrl: ''
  });

  // Redirect if user already has a company
  useEffect(() => {
    if (hasCompany && company) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasCompany, company, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, etc.)');
      return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }
    
    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle click on upload area
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  // Remove selected logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload logo to Firebase Storage
  const uploadLogo = async () => {
    if (!logoFile || !user) return null;
    
    setUploadingLogo(true);
    try {
      // Create a unique filename
      const fileExtension = logoFile.name.split('.').pop();
      const fileName = `logos/${user.id}/logo_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      // Upload the file
      await uploadBytes(storageRef, logoFile);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      console.log('Logo uploaded successfully:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      // Don't block form submission if logo upload fails
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;

    setLoading(true);
    try {
      // Upload logo first if selected
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      // Use the correct backend API URL
      const response = await fetch(`${API_URL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          logoUrl,
          userId: user.id
        })
      });

      if (!response.ok) throw new Error('Failed to create company');
      
      const company = await response.json();
      await setCurrentCompany(company);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating company:', error);
      // Save directly to Firestore as fallback
      let logoUrl = formData.logoUrl;
      if (logoFile && !logoUrl) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }
      
      const companyData = {
        ...formData,
        logoUrl,
        userId: user.id,
        createdAt: new Date().toISOString()
      };
      await setCurrentCompany(companyData);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Don't render form if user already has company (will redirect)
  if (hasCompany && company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-charcoal-500">Redirecting...</div>
      </div>
    );
  }

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

            {/* Logo Upload */}
            <div>
              <label className="label">Logo (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {logoPreview ? (
                // Show preview when logo is selected
                <div className="relative border-2 border-split-400 rounded-xl p-4 bg-split-50">
                  <div className="flex items-center gap-4">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-16 h-16 object-contain rounded-lg bg-white"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal-800 truncate">
                        {logoFile?.name}
                      </p>
                      <p className="text-xs text-charcoal-500">
                        {logoFile && (logoFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                // Show upload area when no logo selected
                <div 
                  onClick={handleUploadClick}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
                    ${dragActive 
                      ? 'border-split-500 bg-split-50' 
                      : 'border-charcoal-200 hover:border-split-400'
                    }`}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-split-500' : 'text-charcoal-400'}`} />
                  <p className={`text-sm ${dragActive ? 'text-split-600' : 'text-charcoal-600'}`}>
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || uploadingLogo || !formData.name || !formData.category}
              className="btn-primary w-full mt-6"
            >
              {loading || uploadingLogo ? (
                uploadingLogo ? 'Uploading logo...' : 'Creating...'
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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