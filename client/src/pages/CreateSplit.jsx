import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { 
  Camera, 
  Home, 
  Store,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  Info,
  CheckCircle
} from 'lucide-react';

const splitTypes = [
  {
    value: 'content',
    icon: Camera,
    title: 'Content',
    description: 'Photography, videography, studio rentals',
    color: 'border-blue-400 bg-blue-50',
    iconColor: 'text-blue-600 bg-blue-100'
  },
  {
    value: 'housing',
    icon: Home,
    title: 'Housing',
    description: 'Airbnb, hotels for trade shows',
    color: 'border-purple-400 bg-purple-50',
    iconColor: 'text-purple-600 bg-purple-100'
  },
  {
    value: 'popup',
    icon: Store,
    title: 'Popup',
    description: 'Booth space, retail pop-ins',
    color: 'border-green-400 bg-green-50',
    iconColor: 'text-green-600 bg-green-100'
  }
];

export default function CreateSplit() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdSplitId, setCreatedSplitId] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    totalCost: '',
    slots: 2,
    deadline: '',
    location: '',
    eventDate: '',
    vendorName: '',
    vendorDetails: ''
  });



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const costPerSlot = formData.totalCost && formData.slots 
    ? Math.ceil(Number(formData.totalCost) / Number(formData.slots))
    : 0;

  const canProceed = () => {
    if (step === 1) return formData.type;
    if (step === 2) return formData.title && formData.totalCost && formData.slots;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canProceed()) return;

    setLoading(true);
    try {
      const split = await api.createSplit({
        ...formData,
        totalCost: Number(formData.totalCost),
        slots: Number(formData.slots),
        organizerId: company.id
      });
      setCreatedSplitId(split.id);
      setSuccess(true);
    } catch (error) {
      console.error('Error creating split:', error);
      alert('Failed to create split. Please try again.');
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    const selectedType = splitTypes.find(t => t.value === formData.type);
    const TypeIcon = selectedType?.icon || Camera;
    
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="card-elevated p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="font-display text-2xl text-charcoal-900 mb-2">
            Split Created!
          </h1>
          <p className="text-charcoal-600 mb-8">
            Your split is now live and ready for participants to join.
          </p>
          
          {/* Summary Card */}
          <div className="bg-charcoal-50 rounded-2xl p-6 text-left mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedType?.iconColor || 'bg-charcoal-100 text-charcoal-600'}`}>
                <TypeIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-display text-lg text-charcoal-900">{formData.title}</h2>
                <p className="text-charcoal-500 capitalize">{formData.type} Split</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <DollarSign className="w-5 h-5 text-charcoal-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-charcoal-800">${costPerSlot}</p>
                <p className="text-xs text-charcoal-500">per slot</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <Users className="w-5 h-5 text-charcoal-400 mx-auto mb-1" />
                <p className="text-lg font-semibold text-charcoal-800">1/{formData.slots}</p>
                <p className="text-xs text-charcoal-500">spots filled</p>
              </div>
            </div>
            
            {formData.location && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-charcoal-200 text-charcoal-600">
                <MapPin className="w-4 h-4 text-charcoal-400" />
                {formData.location}
              </div>
            )}
          </div>
          
          {/* Manual Navigation */}
          <button
            onClick={() => navigate(`/splits/${createdSplitId}`)}
            className="btn-primary"
          >
            View Split Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/splits')}
          className="btn-ghost p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl text-charcoal-900">Create a Split</h1>
          <p className="text-charcoal-600">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-charcoal-100 rounded-full mb-8">
        <div 
          className="h-1 bg-split-500 rounded-full transition-all duration-500"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <form 
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
      >
        {/* Step 1: Type Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl text-charcoal-900 mb-6">
              What type of split is this?
            </h2>
            
            <div className="grid gap-4">
              {splitTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeSelect(type.value)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    formData.type === type.value
                      ? type.color + ' border-current'
                      : 'bg-white border-charcoal-200 hover:border-charcoal-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      formData.type === type.value ? type.iconColor : 'bg-charcoal-100 text-charcoal-600'
                    }`}>
                      <type.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-charcoal-900">{type.title}</h3>
                      <p className="text-sm text-charcoal-600">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-charcoal-900 mb-6">
              Split details
            </h2>
            
            {/* Title */}
            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                name="title"
                className="input"
                placeholder="e.g. Expo West Photography Day"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                className="input min-h-[100px] resize-none"
                placeholder="Describe what's included, requirements, etc."
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>
            
            {/* Cost & Slots */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Total Cost *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                  <input
                    type="number"
                    name="totalCost"
                    className="input pl-10"
                    placeholder="1200"
                    value={formData.totalCost}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Number of Slots *</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                  <input
                    type="number"
                    name="slots"
                    className="input pl-10"
                    placeholder="4"
                    value={formData.slots}
                    onChange={handleChange}
                    min="2"
                    max="20"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Cost Per Slot Preview */}
            {costPerSlot > 0 && (
              <div className="p-4 bg-split-50 rounded-xl border border-split-200">
                <div className="flex items-center gap-2 text-split-700">
                  <Info className="w-5 h-5" />
                  <span>Cost per participant: <strong>${costPerSlot}</strong></span>
                </div>
              </div>
            )}
            
            {/* Location */}
            <div>
              <label className="label">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                <input
                  type="text"
                  name="location"
                  className="input pl-10"
                  placeholder="e.g. Anaheim, CA"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Event/Shoot Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                  <input
                    type="date"
                    name="eventDate"
                    className="input pl-10"
                    value={formData.eventDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Sign-up Deadline</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-400" />
                  <input
                    type="date"
                    name="deadline"
                    className="input pl-10"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Vendor Details (optional) */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-charcoal-900 mb-2">
              Vendor details (optional)
            </h2>
            <p className="text-charcoal-600 mb-6">
              Add information about the photographer, venue, or service provider
            </p>
            
            {/* Vendor Name */}
            <div>
              <label className="label">Vendor Name</label>
              <input
                type="text"
                name="vendorName"
                className="input"
                placeholder="e.g. Studio ABC Photography"
                value={formData.vendorName}
                onChange={handleChange}
              />
            </div>
            
            {/* Vendor Details */}
            <div>
              <label className="label">Vendor Details / Links</label>
              <textarea
                name="vendorDetails"
                className="input min-h-[100px] resize-none"
                placeholder="Website, portfolio, contact info..."
                value={formData.vendorDetails}
                onChange={handleChange}
                rows={4}
              />
            </div>
            
            {/* Summary */}
            <div className="card-elevated p-6 mt-8">
              <h3 className="font-display text-lg text-charcoal-900 mb-4">Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal-600">Type</span>
                  <span className="font-medium capitalize">{formData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-600">Title</span>
                  <span className="font-medium">{formData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-600">Total Cost</span>
                  <span className="font-medium">${formData.totalCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-600">Slots</span>
                  <span className="font-medium">{formData.slots}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-charcoal-100">
                  <span className="text-charcoal-800 font-medium">Cost per participant</span>
                  <span className="font-semibold text-split-600">${costPerSlot}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-charcoal-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <button
              type="button"
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !canProceed()}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Split'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}