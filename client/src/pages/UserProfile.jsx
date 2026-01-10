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
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
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

  const [formDataInitialized, setFormDataInitialized] = useState(false);

  useEffect(() => {
    if (user && !formDataInitialized) {
      // Only initialize formData once when user first loads
      // Extract phone number from Dynamic Labs user object
      // Dynamic Labs phone number might be in format: +1234567890 or just the number
      // Check multiple possible field names: phone_number, phone
      let phoneNumber = '';
      let countryCode = '+1';
      
      // Try different field names that Dynamic Labs might use
      // Dynamic Labs might store phone in: phone_number, phone, or verifiedCredentials
      let phoneValue = user.phone_number || user.phone || '';
      
      // Also check verifiedCredentials array for phone
      if (!phoneValue && user.verifiedCredentials && Array.isArray(user.verifiedCredentials)) {
        // Try different possible structures in verifiedCredentials
        const phoneCredential = user.verifiedCredentials.find(
          cred => 
            cred.type === 'phone' || 
            cred.credentialType === 'phone' || 
            cred.credential === 'phone' ||
            cred.credentialType === 'PHONE' ||
            (cred.address && /^\+?\d+$/.test(cred.address.replace(/\s/g, ''))) // If it looks like a phone number
        );
        if (phoneCredential) {
          phoneValue = phoneCredential.value || phoneCredential.phone || phoneCredential.address || phoneCredential.id || '';
        } else {
          // Search through all credentials for phone-like values
          user.verifiedCredentials.forEach((c) => {
            Object.keys(c).forEach(key => {
              const val = c[key];
              if (val && typeof val === 'string' && /^\+?\d{10,}$/.test(val.replace(/\s/g, ''))) {
                phoneValue = val;
              }
            });
          });
        }
      }
      
      if (phoneValue) {
        // If phone includes country code (starts with +)
        if (phoneValue.startsWith('+')) {
          // Try to extract country code (first 1-3 digits after +)
          const match = phoneValue.match(/^(\+\d{1,3})(.+)$/);
          if (match) {
            countryCode = match[1];
            phoneNumber = match[2].replace(/\D/g, ''); // Remove non-digits
          } else {
            phoneNumber = phoneValue.replace(/\D/g, '');
          }
        } else {
          phoneNumber = phoneValue.replace(/\D/g, '');
        }
      }
      
      // Determine which method user logged in with
      // If user has email but no phone, they logged in with email
      // If user has phone but no email, they logged in with phone
      const hasEmail = !!(user.email && user.email.trim() !== '');
      const hasPhone = !!(phoneValue && phoneValue.trim() !== '');
      
      // Mark as verified based on login method (same flow as email login)
      if (hasEmail && !hasPhone) {
        // Logged in with email - mark email as verified
        setEmailVerified(true);
      } else if (hasPhone && !hasEmail) {
        // Logged in with phone - mark phone as verified
        setPhoneVerified(true);
      } else if (hasEmail && hasPhone) {
        // User has both - mark both as verified (already verified)
        setEmailVerified(true);
        setPhoneVerified(true);
      }
      
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name || prev.firstName || '',
        lastName: user.last_name || prev.lastName || '',
        email: user.email || prev.email || '',
        phoneNumber: phoneNumber || prev.phoneNumber || '',
        countryCode: user.country_code || countryCode || prev.countryCode || '+1',
        streetAddress: user.street_address || prev.streetAddress || '',
        streetAddress2: user.street_address2 || prev.streetAddress2 || '',
        country: user.country || prev.country || '',
        zipCode: user.zip_code || prev.zipCode || '',
        state: user.state || prev.state || '',
        city: user.city || prev.city || '',
        companyName: user.company_name || prev.companyName || '',
        companyDescription: user.company_description || prev.companyDescription || '',
        industry: user.industry || prev.industry || '',
        companySize: user.company_size || prev.companySize || '',
        website: user.website || prev.website || '',
        linkedin: user.linkedin || prev.linkedin || ''
      }));
      setFormDataInitialized(true);
    }
  }, [user, formDataInitialized]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    
    // Reset verified flags if user changes email or phone after verification
    if (field === 'email' && emailVerified) {
      setEmailVerified(false);
    }
    if (field === 'phoneNumber' && phoneVerified) {
      setPhoneVerified(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const role = localStorage.getItem('persistedUserRole') || localStorage.getItem('userRole') || localStorage.getItem('pendingRole');
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Email is required only if user didn't log in with phone (phoneVerified means they logged in with phone)
    if (!phoneVerified && !formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }
    
    // Phone is required only if user didn't log in with email (emailVerified means they logged in with email)
    if (!emailVerified && !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (formData.phoneNumber && !/^\d{10,15}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!formData.state.trim()) newErrors.state = 'State/Province is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
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
    setVerificationSuccess(false);
    
    try {
      const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;
      
      // Call updateUser - it returns a promise that resolves with verification info
      const result = await updateUser({ 
        phoneNumber: fullPhoneNumber 
      });
      
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
      
      if (isPhoneVerificationRequired && verifyOtp) {
        // Store the verifyOtp function
        setVerifyOtpFunction(() => verifyOtp);
        // Set verifying to false so user can click verify button
        setVerifying(false);
      } else {
        // Phone added successfully without verification
        setNeedsVerification(false);
        setVerifying(false);
        setVerificationType(null);
        setVerifyOtpFunction(null);
        setVerificationSuccess(false);
        alert('Phone number added successfully!');
      }
    } catch (error) {
      console.error('Error adding phone number:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Check if phone number already exists
      const errorMessage = error?.message || error?.toString() || '';
      const isDuplicate = errorMessage.toLowerCase().includes('already') || 
                         errorMessage.toLowerCase().includes('exists') ||
                         errorMessage.toLowerCase().includes('duplicate') ||
                         errorMessage.toLowerCase().includes('associated');
      
      if (isDuplicate) {
        setErrors({ phoneNumber: 'This phone number is already associated with another account. Please try with another number.' });
      } else {
      setErrors({ phoneNumber: 'Failed to add phone number. Please try again.' });
      }
      
      setNeedsVerification(false);
      setVerifying(false);
      setVerificationType(null);
      setVerifyOtpFunction(null);
      setVerificationSuccess(false);
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
      
      // Call the verifyOtp function
      const verifyFunction = typeof verifyOtpFunction === 'function' 
        ? verifyOtpFunction 
        : verifyOtpFunction;
      
      await verifyFunction(verificationCode);
      
      setVerificationSuccess(true);
      
      // Mark the verified field as verified
      if (verificationType === 'email') {
        setEmailVerified(true);
      } else if (verificationType === 'phone') {
        setPhoneVerified(true);
      }
      
      // Hide OTP input box after showing success, but keep the green tick visible
      // Verification states will be cleared only on form submit
      setTimeout(() => {
      setNeedsVerification(false);
      setVerificationCode('');
      setVerifyOtpFunction(null);
      setVerificationType(null);
        // Keep verificationSuccess true so the green tick stays visible
        // setVerificationSuccess(false); // Don't clear this - keep tick visible
        // Note: emailVerified and phoneVerified remain true to track verification status
      }, 2000);
      setVerifying(false);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      console.error('Error details:', error.message, error.stack);
      setErrors({ verification: error.message || 'Invalid verification code. Please try again.' });
      setVerifying(false);
      setVerificationSuccess(false);
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
    setVerificationSuccess(false);
    
    try {
      const result = await updateUser({ 
        email: formData.email 
      });
      
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
        setVerifyOtpFunction(() => verifyOtp);
        // Set verifying to false so user can click verify button
        setVerifying(false);
      } else {
        // Email added successfully without verification
        setNeedsVerification(false);
        setVerifying(false);
        setVerificationType(null);
        setVerifyOtpFunction(null);
        setVerificationSuccess(false);
        alert('Email added successfully!');
      }
    } catch (error) {
      console.error('Error adding email:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Check if email already exists
      const errorMessage = error?.message || error?.toString() || '';
      const isDuplicate = errorMessage.toLowerCase().includes('already') || 
                         errorMessage.toLowerCase().includes('exists') ||
                         errorMessage.toLowerCase().includes('duplicate') ||
                         errorMessage.toLowerCase().includes('associated');
      
      if (isDuplicate) {
        setErrors({ email: 'This email is already associated with another account. Please try with another email.' });
      } else {
      setErrors({ email: 'Failed to add email. Please try again.' });
      }
      
      setNeedsVerification(false);
      setVerifying(false);
      setVerificationType(null);
      setVerifyOtpFunction(null);
      setVerificationSuccess(false);
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
          setVerificationSuccess(false);
        }
      } catch (error) {
        console.error('Error adding phone number:', error);
        console.error('Error details:', error.message, error.stack);
        
        // Check if phone number already exists
        const errorMessage = error?.message || error?.toString() || '';
        const isDuplicate = errorMessage.toLowerCase().includes('already') || 
                           errorMessage.toLowerCase().includes('exists') ||
                           errorMessage.toLowerCase().includes('duplicate') ||
                           errorMessage.toLowerCase().includes('associated');
        
        if (isDuplicate) {
          setErrors({ phoneNumber: 'This phone number is already associated with another account. Please try with another number.' });
        } else {
        setErrors({ phoneNumber: 'Failed to add phone number. Please try again.' });
        }
        
        setNeedsVerification(false);
        setVerifying(false);
        setVerificationType(null);
        setVerifyOtpFunction(null);
        setVerificationSuccess(false);
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
          setVerificationSuccess(false);
        }
      } catch (error) {
        console.error('Error adding email:', error);
        console.error('Error details:', error.message, error.stack);
        
        // Check if email already exists
        const errorMessage = error?.message || error?.toString() || '';
        const isDuplicate = errorMessage.toLowerCase().includes('already') || 
                           errorMessage.toLowerCase().includes('exists') ||
                           errorMessage.toLowerCase().includes('duplicate') ||
                           errorMessage.toLowerCase().includes('associated');
        
        if (isDuplicate) {
          setErrors({ email: 'This email is already associated with another account. Please try with another email.' });
        } else {
        setErrors({ email: 'Failed to add email. Please try again.' });
        }
        
        setNeedsVerification(false);
        setVerifying(false);
        setVerificationType(null);
        setVerifyOtpFunction(null);
        setVerificationSuccess(false);
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

      // Clear verification states only after successful form submission
      setNeedsVerification(false);
      setVerificationCode('');
      setVerifyOtpFunction(null);
      setVerificationType(null);
      setVerificationSuccess(false);
      setEmailVerified(false);
      setPhoneVerified(false);

      setSubmitted(true);
      navigate(role === 'employer' ? '/employerDashboard' : '/employee-dashboard', { replace: true });
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email {!phoneVerified && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!!user?.email || (needsVerification && verificationType === 'email') || emailVerified}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'} ${(!!user?.email || (needsVerification && verificationType === 'email') || emailVerified) ? 'bg-gray-100' : ''}`}
                placeholder="Enter your email"
              />
              {/* Show "Verify" button if user logged in with phone but doesn't have email */}
              {/* Show button if: phone is verified OR user has phone but no email, AND email is not verified */}
              {((phoneVerified || (user?.phone_number || user?.phone)) && !user?.email && !emailVerified && !(needsVerification && verificationType === 'email')) && (
                <button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={verifying || !formData.email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {verifying ? 'Adding...' : 'Verify'}
                </button>
              )}
              {/* Small OTP input box for email verification */}
              {(needsVerification && verificationType === 'email' && (verifyOtpFunction || verificationSuccess)) || emailVerified ? (
                <div className="flex items-center gap-2">
                  {needsVerification && verificationType === 'email' && verifyOtpFunction && !emailVerified && (
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                        if (errors.verification) {
                          setErrors(prev => ({ ...prev, verification: '' }));
                        }
                      }}
                      disabled={verifying || verificationSuccess || emailVerified}
                      className={`w-24 px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold tracking-widest ${verificationSuccess ? 'border-green-500 bg-green-50' : errors.verification ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                    />
                  )}
                  {(verificationSuccess || emailVerified) && (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {!verificationSuccess && !emailVerified && verifyOtpFunction && (
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifying || !verificationCode || verificationCode.length !== 6}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {verifying ? '...' : 'Verify'}
                </button>
              )}
                </div>
              ) : null}
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            {errors.verification && verificationType === 'email' && (
              <p className="text-red-500 text-sm mt-1">{errors.verification}</p>
            )}
          </div>

          {/* Row 3: Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number {!emailVerified && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={formData.countryCode}
                onChange={(e) => handleInputChange('countryCode', e.target.value)}
                disabled={(needsVerification && verificationType === 'phone') || phoneVerified}
                className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${((needsVerification && verificationType === 'phone') || phoneVerified) ? 'bg-gray-100' : ''}`}
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
                disabled={(needsVerification && verificationType === 'phone') || phoneVerified}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} ${((needsVerification && verificationType === 'phone') || phoneVerified) ? 'bg-gray-100' : ''}`}
                placeholder="Enter phone number"
              />
              {/* Show "Verify" button if user logged in with email but doesn't have phone */}
              {user?.email && !user?.phone && !user?.phone_number && !(needsVerification && verificationType === 'phone') && !phoneVerified && (
                <button
                  type="button"
                  onClick={handleAddPhone}
                  disabled={verifying || !formData.phoneNumber}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {verifying ? 'Adding...' : 'Verify'}
                </button>
              )}
              {/* Small OTP input box for phone verification */}
              {(needsVerification && verificationType === 'phone' && (verifyOtpFunction || verificationSuccess)) || phoneVerified ? (
                <div className="flex items-center gap-2">
                  {needsVerification && verificationType === 'phone' && verifyOtpFunction && !phoneVerified && (
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    if (errors.verification) {
                      setErrors(prev => ({ ...prev, verification: '' }));
                    }
                  }}
                      disabled={verifying || verificationSuccess || phoneVerified}
                      className={`w-24 px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold tracking-widest ${verificationSuccess ? 'border-green-500 bg-green-50' : errors.verification ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                  )}
                  {(verificationSuccess || phoneVerified) && (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {!verificationSuccess && !phoneVerified && verifyOtpFunction && (
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                      disabled={verifying || !verificationCode || verificationCode.length !== 6}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                      {verifying ? '...' : 'Verify'}
                </button>
              )}
            </div>
              ) : null}
            </div>
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            {errors.verification && verificationType === 'phone' && (
              <p className="text-red-500 text-sm mt-1">{errors.verification}</p>
          )}
          </div>


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


