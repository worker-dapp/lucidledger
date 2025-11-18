import React, { useEffect, useState } from 'react';
import { useDynamicContext, useUserUpdateRequest } from '@dynamic-labs/sdk-react-core';
import Navbar from "../components/Navbar";
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const UserProfile = () => {
  const { user, primaryWallet } = useDynamicContext();
  const { updateUser } = useUserUpdateRequest();
  const navigate = useNavigate();
  const walletAddress = primaryWallet?.address || '';
  
  // Dynamic Labs verification states - unified
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationType, setVerificationType] = useState(null); // 'phone' or 'email'
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyOtpFunction, setVerifyOtpFunction] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    countryCode: '+1',
    streetAddress: '',
    streetAddress2: '',
    country: '',
    zipCode: '',
    state: '',
    city: '',
    // Company fields for employers
    companyName: '',
    companyDescription: '',
    industry: '',
    companySize: '',
    website: '',
    linkedin: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

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

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'India', 'Australia',
    'China', 'Japan', 'Germany', 'France', 'Italy', 'Spain', 'Brazil',
    'Mexico', 'South Korea', 'Netherlands', 'Switzerland', 'Sweden',
    'Norway', 'Denmark', 'Finland', 'Poland', 'Russia', 'Turkey',
    'Saudi Arabia', 'South Africa', 'Egypt', 'Nigeria', 'Kenya'
  ];

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

  const industrySuggestions = [
    'Agriculture', 'Construction', 'Manufacturing', 'Healthcare', 'Technology', 
    'Retail', 'Hospitality', 'Transportation', 'Energy', 'Finance', 'Education',
    'Real Estate', 'Food & Beverage', 'Automotive', 'Pharmaceuticals', 'Media',
    'Consulting', 'Legal', 'Government', 'Non-profit', 'Other'
  ];

  const companySizeOptions = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phoneNumber: user.phone_number || '',
        countryCode: user.country_code || '+1',
        streetAddress: user.street_address || '',
        streetAddress2: user.street_address2 || '',
        country: user.country || '',
        zipCode: user.zip_code || '',
        state: user.state || '',
        city: user.city || '',
        companyName: user.company_name || '',
        companyDescription: user.company_description || '',
        industry: user.industry || '',
        companySize: user.company_size || '',
        website: user.website || '',
        linkedin: user.linkedin || ''
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const role = localStorage.getItem('persistedUserRole') || localStorage.getItem('userRole') || localStorage.getItem('pendingRole');
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Enter a valid email';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!formData.state.trim()) newErrors.state = 'State/Province is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (formData.phoneNumber && !/^\d{10,15}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    // Employer-specific validation
    if (role === 'employer') {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle adding phone number to Dynamic Labs
  const handleAddPhone = async () => {
    if (!formData.phoneNumber || !formData.countryCode) {
      setErrors({ phoneNumber: 'Phone number is required' });
      return;
    }
    
    // Show the verification field immediately while we're processing
    setVerifying(true);
    setNeedsVerification(true);
    setVerificationType('phone');
    setVerificationCode('');
    
    try {
      const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
      console.log('Adding phone number to Dynamic Labs:', fullPhoneNumber);
      
      // Call updateUser - it returns a promise that resolves with verification info
      const result = await updateUser({ 
        phoneNumber: fullPhoneNumber 
      });
      
      console.log('Update user result:', result);
      console.log('Result type:', typeof result);
      console.log('Result keys:', result ? Object.keys(result) : 'null');
      
      // Handle different possible response formats
      let isPhoneVerificationRequired = false;
      let verifyOtp = null;
      
      if (result) {
        // Check if result has the expected properties
        if (result.isPhoneVerificationRequired !== undefined) {
          isPhoneVerificationRequired = result.isPhoneVerificationRequired;
          verifyOtp = result.verifyOtp;
        } else if (typeof result === 'object' && 'verifyOtp' in result) {
          // If verifyOtp exists, assume verification is required
          isPhoneVerificationRequired = true;
          verifyOtp = result.verifyOtp;
        } else if (typeof result === 'function') {
          // If result is a function, it's likely verifyOtp
          isPhoneVerificationRequired = true;
          verifyOtp = result;
        }
      }
      
      console.log('isPhoneVerificationRequired:', isPhoneVerificationRequired);
      console.log('verifyOtp:', typeof verifyOtp);
      
      if (isPhoneVerificationRequired && verifyOtp) {
        console.log('Phone verification required, storing verifyOtp function');
        // Store the verifyOtp function
        setVerifyOtpFunction(() => verifyOtp);
        // Set verifying to false so user can click verify button
        setVerifying(false);
      } else {
        // Phone added successfully without verification
        console.log('Phone added without verification');
        setNeedsVerification(false);
        setVerifying(false);
        setVerificationType(null);
        setVerifyOtpFunction(null);
        alert('Phone number added successfully!');
      }
    } catch (error) {
      console.error('Error adding phone number:', error);
      console.error('Error details:', error.message, error.stack);
      setErrors({ phoneNumber: 'Failed to add phone number. Please try again.' });
      setNeedsVerification(false);
      setVerifying(false);
      setVerificationType(null);
      setVerifyOtpFunction(null);
    }
  };

  // Handle verifying OTP (unified for phone and email)
  const handleVerifyOtp = async () => {
    if (!verificationCode) {
      setErrors({ verification: 'Please enter the verification code' });
      return;
    }
    
    if (!verifyOtpFunction) {
      setErrors({ verification: 'Verification function not available. Please try again.' });
      return;
    }
    
    try {
      setVerifying(true);
      console.log('Verifying OTP:', verificationCode);
      
      // Call the verifyOtp function
      const verifyFunction = typeof verifyOtpFunction === 'function' 
        ? verifyOtpFunction 
        : verifyOtpFunction;
      
      await verifyFunction(verificationCode);
      
      console.log('OTP verified successfully');
      setNeedsVerification(false);
      setVerificationCode('');
      setVerifyOtpFunction(null);
      setVerificationType(null);
      setVerifying(false);
      alert(`${verificationType === 'phone' ? 'Phone number' : 'Email'} verified successfully!`);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      console.error('Error details:', error.message, error.stack);
      setErrors({ verification: error.message || 'Invalid verification code. Please try again.' });
      setVerifying(false);
    }
  };

  // Handle adding email to Dynamic Labs
  const handleAddEmail = async () => {
    if (!formData.email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    // Show the verification field immediately while we're processing
    setVerifying(true);
    setNeedsVerification(true);
    setVerificationType('email');
    setVerificationCode('');
    
    try {
      console.log('Adding email to Dynamic Labs:', formData.email);
      
      const result = await updateUser({ 
        email: formData.email 
      });
      
      console.log('Update user result for email:', result);
      
      // Handle different possible response formats
      let isEmailVerificationRequired = false;
      let verifyOtp = null;
      
      if (result) {
        if (result.isEmailVerificationRequired !== undefined) {
          isEmailVerificationRequired = result.isEmailVerificationRequired;
          verifyOtp = result.verifyOtp;
        } else if (typeof result === 'object' && 'verifyOtp' in result) {
          isEmailVerificationRequired = true;
          verifyOtp = result.verifyOtp;
        } else if (typeof result === 'function') {
          isEmailVerificationRequired = true;
          verifyOtp = result;
        }
      }
      
      if (isEmailVerificationRequired && verifyOtp) {
        console.log('Email verification required, storing verifyOtp function');
        setVerifyOtpFunction(() => verifyOtp);
        // Set verifying to false so user can click verify button
        setVerifying(false);
      } else {
        // Email added successfully without verification
        console.log('Email added without verification');
        setNeedsVerification(false);
        setVerifying(false);
        setVerificationType(null);
        setVerifyOtpFunction(null);
        alert('Email added successfully!');
      }
    } catch (error) {
      console.error('Error adding email:', error);
      setErrors({ email: 'Failed to add email. Please try again.' });
      setNeedsVerification(false);
      setVerifying(false);
      setVerificationType(null);
      setVerifyOtpFunction(null);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Check if we need to add phone or email to Dynamic Labs first
    const userHasEmail = user?.email && user.email.trim() !== '';
    const userHasPhone = user?.phone_number && user.phone_number.trim() !== '';
    const formHasEmail = formData.email && formData.email.trim() !== '';
    const formHasPhone = formData.phoneNumber && formData.phoneNumber.trim() !== '';
    
    // If user logged in with email but doesn't have phone, add phone to Dynamic
    if (userHasEmail && !userHasPhone && formHasPhone) {
      try {
        setVerifying(true);
        setNeedsVerification(true);
        setVerificationType('phone');
        setVerificationCode('');
        const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
        const result = await updateUser({ 
          phoneNumber: fullPhoneNumber 
        });
        
        let isPhoneVerificationRequired = false;
        let verifyOtp = null;
        
        if (result) {
          if (result.isPhoneVerificationRequired !== undefined) {
            isPhoneVerificationRequired = result.isPhoneVerificationRequired;
            verifyOtp = result.verifyOtp;
          } else if (typeof result === 'object' && 'verifyOtp' in result) {
            isPhoneVerificationRequired = true;
            verifyOtp = result.verifyOtp;
          } else if (typeof result === 'function') {
            isPhoneVerificationRequired = true;
            verifyOtp = result;
          }
        }
        
        if (isPhoneVerificationRequired && verifyOtp) {
          setVerifyOtpFunction(() => verifyOtp);
          setVerifying(false);
          // Wait for verification before proceeding
          return;
        } else {
          setNeedsVerification(false);
          setVerifying(false);
          setVerificationType(null);
          setVerifyOtpFunction(null);
        }
      } catch (error) {
        console.error('Error adding phone number:', error);
        setErrors({ phoneNumber: 'Failed to add phone number. Please try again.' });
        setNeedsVerification(false);
        setVerifying(false);
        setVerificationType(null);
        setVerifyOtpFunction(null);
        return;
      }
    }
    
    // If user logged in with phone but doesn't have email, add email to Dynamic
    if (userHasPhone && !userHasEmail && formHasEmail) {
      try {
        setVerifying(true);
        setNeedsVerification(true);
        setVerificationType('email');
        setVerificationCode('');
        const result = await updateUser({ 
          email: formData.email 
        });
        
        let isEmailVerificationRequired = false;
        let verifyOtp = null;
        
        if (result) {
          if (result.isEmailVerificationRequired !== undefined) {
            isEmailVerificationRequired = result.isEmailVerificationRequired;
            verifyOtp = result.verifyOtp;
          } else if (typeof result === 'object' && 'verifyOtp' in result) {
            isEmailVerificationRequired = true;
            verifyOtp = result.verifyOtp;
          } else if (typeof result === 'function') {
            isEmailVerificationRequired = true;
            verifyOtp = result;
          }
        }
        
        if (isEmailVerificationRequired && verifyOtp) {
          setVerifyOtpFunction(() => verifyOtp);
          setVerifying(false);
          // Wait for verification before proceeding
          return;
        } else {
          setNeedsVerification(false);
          setVerifying(false);
          setVerificationType(null);
          setVerifyOtpFunction(null);
        }
      } catch (error) {
        console.error('Error adding email:', error);
        setErrors({ email: 'Failed to add email. Please try again.' });
        setNeedsVerification(false);
        setVerifying(false);
        setVerificationType(null);
        setVerifyOtpFunction(null);
        return;
      }
    }
    
    setLoading(true);
    try {
      const role = localStorage.getItem('persistedUserRole') || localStorage.getItem('userRole') || localStorage.getItem('pendingRole');
      
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        country_code: formData.countryCode,
        street_address: formData.streetAddress,
        street_address2: formData.streetAddress2,
        country: formData.country,
        zip_code: formData.zipCode,
        state: formData.state,
        city: formData.city,
        wallet_address: walletAddress,
      };

      // Add employer-specific fields
      if (role === 'employer') {
        payload.company_name = formData.companyName;
        payload.company_description = formData.companyDescription;
        payload.industry = formData.industry;
        payload.company_size = formData.companySize;
        payload.website = formData.website;
        payload.linkedin = formData.linkedin;
      }
      
      // Submit profile data to API
      if (role === 'employer') {
        await apiService.createEmployer(payload);
      } else {
        await apiService.createEmployee(payload);
      }

      setSubmitted(true);
      navigate(role === 'employer' ? '/employerDashboard' : '/employeeDashboard', { replace: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="w-2/3 mx-auto m-10 p-10 bg-white rounded shadow-md">
        <h1 className="text-3xl font-bold text-[#0D3B66] mb-6 text-center">Complete Your Profile</h1>

        {submitted && (
          <div className="mb-4 p-3 rounded bg-green-50 text-green-700 border border-green-200">
            Profile updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: First & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your first name"
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your last name"
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Row 2: Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!!user?.email || (needsVerification && verificationType === 'email')}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'} ${(!!user?.email || (needsVerification && verificationType === 'email')) ? 'bg-gray-100' : ''}`}
                placeholder="Enter your email"
              />
              {user?.phone_number && !user?.email && !(needsVerification && verificationType === 'email') && (
                <button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={verifying || !formData.email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Adding...' : 'Add to Dynamic'}
                </button>
              )}
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Row 3: Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex gap-2">
              <select
                value={formData.countryCode}
                onChange={(e) => handleInputChange('countryCode', e.target.value)}
                disabled={needsVerification && verificationType === 'phone'}
                className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${(needsVerification && verificationType === 'phone') ? 'bg-gray-100' : ''}`}
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
                disabled={needsVerification && verificationType === 'phone'}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} ${(needsVerification && verificationType === 'phone') ? 'bg-gray-100' : ''}`}
                placeholder="Enter phone number"
              />
              {/* Show "Add to Dynamic" button if user logged in with email but doesn't have phone */}
              {user?.email && !user?.phone && !user?.phoneNumber && !(needsVerification && verificationType === 'phone') && (
                <button
                  type="button"
                  onClick={handleAddPhone}
                  disabled={verifying || !formData.phoneNumber}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {verifying ? 'Adding...' : 'Add to Dynamic'}
                </button>
              )}
            </div>
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
          </div>

          {/* Unified OTP Verification Field */}
          {needsVerification && (
            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{verificationType === 'phone' ? '📱' : '📧'}</span>
                <label className="block text-base font-semibold text-gray-800">
                  Verification Required
                </label>
              </div>
              {verifyOtpFunction ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    {verificationType === 'phone' ? (
                      <>We sent a verification code via SMS to <strong>{formData.countryCode}{formData.phoneNumber}</strong></>
                    ) : (
                      <>We sent a verification code to <strong>{formData.email}</strong></>
                    )}
                  </p>
                  <p className="text-xs text-blue-600 mb-3 font-medium">
                    Please {verificationType === 'phone' ? 'check your phone' : 'check your email inbox'} and enter the 6-digit code below.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600 mb-3">
                  Sending verification code{verificationType === 'phone' ? ` to ${formData.countryCode}${formData.phoneNumber}` : ` to ${formData.email}`}...
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = verificationType === 'phone' 
                      ? e.target.value.replace(/\D/g, '') 
                      : e.target.value;
                    setVerificationCode(value);
                    if (errors.verification) {
                      setErrors(prev => ({ ...prev, verification: '' }));
                    }
                  }}
                  disabled={!verifyOtpFunction}
                  className="flex-1 px-4 py-3 border-2 border-yellow-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-center font-semibold tracking-widest disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={!verifyOtpFunction || verifying || !verificationCode || verificationCode.length !== 6}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              {errors.verification && (
                <p className="text-red-600 text-sm mt-2 font-medium">{errors.verification}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Didn't receive the code? {verificationType === 'phone' ? 'Check your phone number and try again.' : 'Check your email inbox and spam folder.'}
              </p>
            </div>
          )}

          {/* Row 4: Street Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
              type="text"
              value={formData.streetAddress}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              placeholder="Street address, P.O. box, company name"
            />
          </div>

          {/* Row 4b: Street Address 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address 2 (Optional)</label>
            <input
              type="text"
              value={formData.streetAddress2}
              onChange={(e) => handleInputChange('streetAddress2', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>

          {/* Row 5: City & State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your city"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province *</label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your state</option>
                {usStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            </div>
          </div>

          {/* Row 6: Country & Zip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter zip code"
              />
              {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
            </div>
          </div>

          {/* Company Information - Only for Employers */}
          {(localStorage.getItem('persistedUserRole') === 'employer' || localStorage.getItem('userRole') === 'employer' || localStorage.getItem('pendingRole') === 'employer') && (
            <>
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#0D3B66] mt-6 mb-4 border-t pt-6">Company Information</h2>
              </div>

              {/* Company Name & Industry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Your company name"
                  />
                  {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  >
                    <option value="">Select Industry</option>
                    {industrySuggestions.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Company Size & Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => handleInputChange('companySize', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  >
                    <option value="">Select Company Size</option>
                    {companySizeOptions.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>

              {/* Company Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                <textarea
                  value={formData.companyDescription}
                  onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 min-h-[100px]"
                  placeholder="Describe your company, its mission, and what makes it unique..."
                />
              </div>
            </>
          )}

          {errors.submit && (
            <p className="text-red-500 text-sm text-center">{errors.submit}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d3b66] text-white py-3 px-4 rounded-md hover:bg-[#1a5a95] focus:outline-none focus:ring-2 focus:ring-[#1a5a95] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </>
  );
};

export default UserProfile;


