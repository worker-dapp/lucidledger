import React, { useState, useEffect } from 'react';
import { useAuth } from '../api/AuthContext';
import apiClient from '../api/apiClient';

const UserProfileModal = ({ isOpen, onClose, onComplete }) => {
  const { user, updateUserData } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    countryCode: '+1',
    country: '',
    zipCode: '',
    state: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Country codes for dropdown
  const countryCodes = [
    { code: '+1', country: 'US/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' }
  ];

  // Common countries
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'India', 'Australia',
    'China', 'Japan', 'Germany', 'France', 'Italy', 'Spain', 'Brazil',
    'Mexico', 'South Korea', 'Netherlands', 'Switzerland', 'Sweden',
    'Norway', 'Denmark', 'Finland', 'Poland', 'Russia', 'Turkey',
    'Saudi Arabia', 'South Africa', 'Egypt', 'Nigeria', 'Kenya'
  ];

  // Common US states
  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut','District of Columbia', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  useEffect(() => {
    if (user && isOpen) {
      // Pre-populate with existing user data if available
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phoneNumber: user.phone_number || '',
        countryCode: user.country_code || '+1',
        country: user.country || '',
        zipCode: user.zip_code || '',
        state: user.state || '',
        city: user.city || ''
      }));
    }
  }, [user, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!formData.state.trim()) newErrors.state = 'State/Province is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    // Phone number validation (optional but if provided, should be valid)
    if (formData.phoneNumber && !/^\d{10,15}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiClient.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        country_code: formData.countryCode,
        country: formData.country,
        zip_code: formData.zipCode,
        state: formData.state,
        city: formData.city
      });

      if (response.data) {
        // Update the user data in context
        updateUserData({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          country_code: formData.countryCode,
          country: formData.country,
          zip_code: formData.zipCode,
          state: formData.state,
          city: formData.city
        });

        onComplete(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => handleInputChange('countryCode', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {countryCodes.map(({ code, country }) => (
                    <option key={code} value={code}>
                      {code} ({country})
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                list="countries"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your country"
              />
              <datalist id="countries">
                {countries.map(country => (
                  <option key={country} value={country} />
                ))}
              </datalist>
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
              )}
            </div>

            {/* Zip Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code *
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.zipCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter zip code"
              />
              {errors.zipCode && (
                <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
              )}
            </div>

            {/* State/Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Province *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                list="states"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter state or province"
              />
              <datalist id="states">
                {usStates.map(state => (
                  <option key={state} value={state} />
                ))}
              </datalist>
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your city"
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <p className="text-red-500 text-sm text-center">{errors.submit}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Add My Information'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
