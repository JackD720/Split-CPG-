import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storage, db, auth } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import StripeConnect from '../components/StripeConnect';
import { 
  Building2, 
  CreditCard, 
  User,
  Check,
  Save,
  Upload,
  X,
  Camera,
  AlertTriangle
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
  const { user, company, updateCompany, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('company');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Get current logo URL
  const currentLogo = company?.logoUrl || company?.logo;
  
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
    setSaved(false);
    
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

  // Remove selected/current logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setSaved(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload logo to Firebase Storage
  const uploadLogo = async () => {
    if (!logoFile || !user) return null;
    
    setUploadingLogo(true);
    try {
      const fileExtension = logoFile.name.split('.').pop();
      const fileName = `logos/${user.id}/logo_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, logoFile);
      const downloadUrl = await getDownloadURL(storageRef);
      console.log('Logo uploaded successfully:', downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let logoUrl = currentLogo;
      
      // Upload new logo if selected
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      } else if (logoPreview === null && currentLogo) {
        // Logo was removed
        logoUrl = null;
      }
      
      await updateCompany({
        ...formData,
        logoUrl,
        logo: logoUrl // Keep both for compatibility
      });
      
      setSaved(true);
      setLogoFile(null); // Clear file after successful upload
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account?\n\n' +
      'This will permanently delete:\n' +
      '• Your company profile\n' +
      '• All your data\n\n' +
      'This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    // Double confirmation for safety
    const doubleConfirm = window.confirm(
      'This is your final warning.\n\n' +
      'Type "DELETE" in the next prompt to confirm account deletion.'
    );
    
    if (!doubleConfirm) return;
    
    const typed = window.prompt('Type DELETE to confirm:');
    if (typed !== 'DELETE') {
      alert('Account deletion cancelled.');
      return;
    }
    
    setDeleting(true);
    
    try {
      // Delete company from Firestore
      if (company?.id) {
        await deleteDoc(doc(db, 'companies', company.id));
      }
      
      // Also try to delete by user ID in case company ID is different
      if (user?.id && user.id !== company?.id) {
        try {
          await deleteDoc(doc(db, 'companies', user.id));
        } catch (e) {
          // Ignore if doesn't exist
        }
      }
      
      // Delete user from Firebase Auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
      }
      
      // Clear local storage
      localStorage.removeItem('split_company');
      
      // Logout and redirect
      await logout();
      navigate('/');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      
      // Handle re-authentication requirement
      if (error.code === 'auth/requires-recent-login') {
        alert(
          'For security reasons, please log out and log back in, then try deleting your account again.'
        );
      } else {
        alert('Failed to delete account. Please try again or contact support.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'account', label: 'Account', icon: User }
  ];

  // Determine what logo to show (new preview takes priority)
  const displayLogo = logoPreview || (logoPreview !== null ? currentLogo : null);

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
            {/* Logo Upload Section */}
            <div>
              <label className="label">Company Logo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <div className="flex items-start gap-6">
                {/* Current/Preview Logo */}
                <div className="flex-shrink-0">
                  {displayLogo || currentLogo ? (
                    <div className="relative group">
                      <img 
                        src={displayLogo || currentLogo} 
                        alt="Company logo" 
                        className="w-24 h-24 object-cover rounded-xl border-2 border-charcoal-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {logoFile && (
                        <div className="absolute bottom-0 left-0 right-0 bg-split-500 text-white text-xs text-center py-1 rounded-b-xl">
                          New
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-charcoal-100 rounded-xl flex items-center justify-center border-2 border-dashed border-charcoal-300">
                      <Camera className="w-8 h-8 text-charcoal-400" />
                    </div>
                  )}
                </div>
                
                {/* Upload Area */}
                <div className="flex-1">
                  <div 
                    onClick={handleUploadClick}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer
                      ${dragActive 
                        ? 'border-split-500 bg-split-50' 
                        : 'border-charcoal-200 hover:border-split-400'
                      }`}
                  >
                    <Upload className={`w-6 h-6 mx-auto mb-2 ${dragActive ? 'text-split-500' : 'text-charcoal-400'}`} />
                    <p className={`text-sm ${dragActive ? 'text-split-600' : 'text-charcoal-600'}`}>
                      {currentLogo || logoFile ? 'Change logo' : 'Upload logo'}
                    </p>
                    <p className="text-xs text-charcoal-400 mt-1">
                      PNG, JPG up to 2MB
                    </p>
                  </div>
                  
                  {logoFile && (
                    <p className="text-xs text-split-600 mt-2">
                      New file selected: {logoFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

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
                disabled={saving || uploadingLogo}
                className="btn-primary"
              >
                {saving || uploadingLogo ? (
                  uploadingLogo ? 'Uploading logo...' : 'Saving...'
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
            <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-charcoal-500 mb-4">
              Once you delete your account, there is no going back. This will permanently delete your company profile and all associated data.
            </p>
            <button 
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}