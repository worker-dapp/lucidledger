import React, { useEffect, useState } from 'react';
import Navbar from "../components/Navbar";
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../hooks/useAuth';

const UserProfile = () => {
  const [linkMessage, setLinkMessage] = useState('');
  const { user, smartWalletAddress, logout, linkEmail, linkPhone } = useAuth({
    onSuccess: ({ user: updatedUser, linkMethod }) => {
      const method = linkMethod === 'email' ? 'Email' : 'Phone number';
      setLinkMessage(`${method} linked successfully!`);
      setTimeout(() => setLinkMessage(''), 3000);
    },
    onError: (error) => {
      console.error('Link account error:', error);
      setLinkMessage('Failed to link account. It may already be linked to another user.');
      setTimeout(() => setLinkMessage(''), 5000);
    },
  });
  const navigate = useNavigate();
  const walletAddress = smartWalletAddress || '';

  const privyEmail = user?.email?.address || '';
  const privyPhone = user?.phone?.number || '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
    website: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

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

  // Skills & experience state (employee only, optional)
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [openCategories, setOpenCategories] = useState({});
  const skillCategories = {
    'Agriculture & Farming': ['Harvesting', 'Planting', 'Irrigation', 'Animal Care', 'Fishing', 'Beekeeping'],
    'Construction & Trades': ['Carpentry', 'Masonry', 'Welding', 'Plumbing', 'Electrical', 'Painting', 'Roofing', 'Tiling'],
    'Manufacturing & Repair': ['Auto Repair', 'Machine Repair', 'Assembly', 'Quality Inspection', 'CNC/Machining', 'Sewing', 'Packaging'],
    'Transportation & Equipment': ['Driving', 'Forklift', 'Motorcycle', 'Boat Operation', 'Heavy Equipment'],
    'Food & Hospitality': ['Cooking', 'Baking', 'Food Prep', 'Serving', 'Housekeeping', 'Cleaning'],
    'Care & Services': ['Child Care', 'Elder Care', 'First Aid', 'Security', 'Laundry'],
    'Technical & Office': ['Data Entry', 'Mobile Phones', 'Customer Service', 'Retail', 'Inventory'],
    'Outdoor & Physical': ['Landscaping', 'Logging', 'Mining', 'Loading/Unloading', 'Waste Collection'],
  };
  const toggleCategory = (cat) => setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  const addSkill = (value) => {
    const v = value.trim();
    if (!v || skills.includes(v)) return;
    setSkills(prev => [...prev, v]);
    setSkillInput('');
  };
  const removeSkill = (value) => setSkills(prev => prev.filter(s => s !== value));
  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); }
  };

  const [experiences, setExperiences] = useState([{ title: '', description: '', startDate: '', endDate: '' }]);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);
  const getMonth = (d) => d ? (d.split('-')[1] || '') : '';
  const getYear = (d) => d ? (d.split('-')[0] || '') : '';
  const setDatePart = (idx, field, part, value) => {
    setExperiences(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      const cur = row[field] || '';
      const m = part === 'month' ? value : getMonth(cur);
      const y = part === 'year' ? value : getYear(cur);
      return { ...row, [field]: (y && m) ? `${y}-${m}` : y ? y : m ? `-${m}` : '' };
    }));
  };
  const addExperienceRow = () => setExperiences(prev => [...prev, { title: '', description: '', startDate: '', endDate: '' }]);
  const removeExperienceRow = (idx) => setExperiences(prev => prev.filter((_, i) => i !== idx));
  const updateExperienceField = (idx, field, value) => setExperiences(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));

  useEffect(() => {
    if (user && !formDataInitialized) {
      setFormData(prev => ({
        ...prev,
        firstName: user.first_name || prev.firstName || '',
        lastName: user.last_name || prev.lastName || '',
      }));
      setFormDataInitialized(true);
    }
  }, [user, formDataInitialized]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const isEmployerRole = () => {
    return localStorage.getItem('persistedUserRole') === 'employer' ||
      localStorage.getItem('userRole') === 'employer' ||
      localStorage.getItem('pendingRole') === 'employer';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    if (!formData.state.trim()) newErrors.state = 'State/Province is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';

    // Employer-specific validation
    if (isEmployerRole()) {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.industry) newErrors.industry = 'Industry is required';
      if (!formData.companySize) newErrors.companySize = 'Company size is required';
      if (!formData.companyDescription.trim()) newErrors.companyDescription = 'Company description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const employer = isEmployerRole();

      // DUAL ROLES ALLOWED: Users can have both employee and employer profiles
      // Same email/phone/wallet can exist in both tables
      // Backend validation will prevent applying to your own jobs

      // Read email/phone from Privy user object (source of truth for verified credentials)
      const currentEmail = user?.email?.address || '';
      const currentPhone = user?.phone?.number || '';

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: currentEmail,
        phone_number: currentPhone,
        street_address: formData.streetAddress,
        street_address2: formData.streetAddress2,
        country: formData.country,
        zip_code: formData.zipCode,
        state: formData.state,
        city: formData.city,
        wallet_address: walletAddress,
      };

      // Add employee-specific optional fields
      if (!employer) {
        if (skills.length > 0) payload.skills = JSON.stringify(skills);
        const filledExperiences = experiences.filter(e => e.title.trim()).map(e => ({
          ...e,
          startDate: e.startDate?.includes('-') && e.startDate.split('-')[0] ? e.startDate : '',
          endDate: e.endDate?.includes('-') && e.endDate.split('-')[0] ? e.endDate : '',
        }));
        if (filledExperiences.length > 0) payload.work_experience = filledExperiences;
      }

      // Add employer-specific fields
      if (employer) {
        payload.company_name = formData.companyName;
        payload.company_description = formData.companyDescription;
        payload.industry = formData.industry;
        payload.company_size = formData.companySize;
        payload.website = formData.website;
      }

      // Submit profile data to API
      if (employer) {
        await apiService.createEmployer(payload);
      } else {
        await apiService.createEmployee(payload);
      }

      setSubmitted(true);
      // Employees go to landing page, employers go to dashboard
      navigate(employer ? '/contract-factory' : '/', { replace: true });
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#0D3B66]">Complete Your Profile</h1>
          <button
            type="button"
            onClick={async () => { await logout(); navigate('/', { replace: true }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Exit
          </button>
        </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {privyEmail ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-gray-800">{privyEmail}</span>
                <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={linkEmail}
                className="px-4 py-2 border border-[#0d3b66] text-[#0d3b66] rounded-md hover:bg-[#0d3b66] hover:text-white transition-colors text-sm"
              >
                + Link Email Address
              </button>
            )}
          </div>

          {/* Row 3: Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            {privyPhone ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-gray-800">{privyPhone}</span>
                <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={linkPhone}
                className="px-4 py-2 border border-[#0d3b66] text-[#0d3b66] rounded-md hover:bg-[#0d3b66] hover:text-white transition-colors text-sm"
              >
                + Link Phone Number
              </button>
            )}
          </div>

          {linkMessage && (
            <div className={`p-3 rounded text-sm ${linkMessage.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {linkMessage}
            </div>
          )}


          {/* Row 4: Street Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
            <input
              type="text"
              value={formData.streetAddress}
              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.streetAddress ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Street address, P.O. box, company name"
            />
            {errors.streetAddress && <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>}
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
          {isEmployerRole() && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.industry ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Industry</option>
                    {industrySuggestions.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
                </div>
              </div>

              {/* Company Size & Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Size *</label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => handleInputChange('companySize', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companySize ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Company Size</option>
                    {companySizeOptions.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {errors.companySize && <p className="text-red-500 text-sm mt-1">{errors.companySize}</p>}
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

              {/* Company Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Description *</label>
                <textarea
                  value={formData.companyDescription}
                  onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyDescription ? 'border-red-500' : 'border-gray-300'} min-h-[100px]`}
                  placeholder="Describe your company, its mission, and what makes it unique..."
                />
                {errors.companyDescription && <p className="text-red-500 text-sm mt-1">{errors.companyDescription}</p>}
              </div>
            </>
          )}

          {/* Skills & Work Experience - Optional, Employee Only */}
          {!isEmployerRole() && (
            <>
              <div className="col-span-full">
                <h2 className="text-xl font-semibold text-[#0D3B66] mt-6 mb-1 border-t pt-6">Skills & Work Experience</h2>
                <p className="text-sm text-gray-500 mb-4">Optional — you can fill this in later from your profile page.</p>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Skills</label>

                {/* Selected skills */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {skills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1.5 bg-[#EE964B] text-white px-3 py-1 rounded-full text-sm font-medium">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)} className="hover:text-orange-200" aria-label={`Remove ${s}`}>&times;</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search */}
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search skills..."
                />

                {/* Accordion categories */}
                <div className="space-y-1">
                  {Object.entries(skillCategories).map(([category, items]) => {
                    const searchLower = skillSearch.toLowerCase();
                    const filtered = searchLower ? items.filter(s => s.toLowerCase().includes(searchLower)) : items;
                    if (filtered.length === 0) return null;
                    const isOpen = openCategories[category] || !!skillSearch;
                    const selectedCount = items.filter(s => skills.includes(s)).length;
                    return (
                      <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <span className="text-sm font-medium text-[#0D3B66]">
                            {category}
                            {selectedCount > 0 && (
                              <span className="ml-2 text-xs bg-[#EE964B] text-white px-2 py-0.5 rounded-full">{selectedCount}</span>
                            )}
                          </span>
                          <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="px-4 py-3 flex flex-wrap gap-2">
                            {filtered.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => skills.includes(s) ? removeSkill(s) : addSkill(s)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                  skills.includes(s) ? 'bg-[#EE964B] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Custom skill input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a custom skill and press Enter"
                  />
                  <button type="button" onClick={() => addSkill(skillInput)} className="px-4 py-2 bg-[#0D3B66] text-white rounded-md hover:bg-[#0a2f52] transition-colors text-sm">Add</button>
                </div>
              </div>

              {/* Work Experience */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Work Experience</label>
                {experiences.map((row, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={row.title}
                          onChange={(e) => updateExperienceField(idx, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Farm Worker"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Description / Duties</label>
                        <input
                          type="text"
                          value={row.description || ''}
                          onChange={(e) => updateExperienceField(idx, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Managed daily harvest operations"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                        <div className="flex gap-2">
                          <select value={getMonth(row.startDate)} onChange={(e) => setDatePart(idx, 'startDate', 'month', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Month</option>
                            {monthNames.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
                          </select>
                          <select value={getYear(row.startDate)} onChange={(e) => setDatePart(idx, 'startDate', 'year', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Year</option>
                            {yearOptions.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">End Date</label>
                        <div className="flex gap-2">
                          <select value={getMonth(row.endDate)} onChange={(e) => setDatePart(idx, 'endDate', 'month', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Month</option>
                            {monthNames.map((m, i) => <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
                          </select>
                          <select value={getYear(row.endDate)} onChange={(e) => setDatePart(idx, 'endDate', 'year', e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Year</option>
                            {yearOptions.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    {experiences.length > 1 && (
                      <div className="flex justify-end">
                        <button type="button" onClick={() => removeExperienceRow(idx)} className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addExperienceRow} className="text-[#0D3B66] hover:text-[#EE964B] font-medium text-sm">+ Add Another Job</button>
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
