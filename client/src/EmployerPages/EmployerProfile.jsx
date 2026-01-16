import React, { useState, useEffect } from "react";
import img from "../assets/profile.webp";
import EmployerLayout from "../components/EmployerLayout";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import apiService from '../services/api';

const PencilIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 2.25l3.75 3.75" />
  </svg>
);

const EmployerProfile = () => {
  const { user, primaryWallet } = useDynamicContext();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');

  // Address fields
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // Edit mode toggles
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);

  // Company information state
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Company edit mode
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  // Constants for dropdowns
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

  // Industry suggestions
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

  // Fetch user details from localStorage
  const fetchUserDetails = async () => {
    if (!user || !primaryWallet?.address) {
      setLoading(false);
      return;
    }

    try {
      // Get employer profile from API
      const response = await apiService.getEmployerByWallet(primaryWallet.address);
      const data = response.data;

      if (data) {
        setUserDetails(data);
        // Populate form fields with fetched data
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        setPhone(data.phone_number || '');
        setCountryCode(data.country_code || '+1');
        setAddress1(data.street_address || '');
        setAddress2(data.street_address2 || '');
        setCity(data.city || '');
        setStateRegion(data.state || '');
        setPostalCode(data.zip_code || '');
        setCountry(data.country || '');
        setCompanyName(data.company_name || '');
        setCompanyDescription(data.company_description || '');
        setIndustry(data.industry || '');
        setCompanySize(data.company_size || '');
        setWebsite(data.website || '');
        setLinkedin(data.linkedin || '');
      }
    } catch (error) {
      console.error('Error fetching employer details:', error);
      setMessage('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [user, primaryWallet]);

  // DO NOT use Dynamic Labs user data as fallback - it may contain data from employee account
  // Employer profile must be created separately through /user-profile

  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Your Name';

  const saveToAPI = async (data, note = 'Profile updated') => {
    setIsSaving(true);
    setMessage('');
    
    try {
      if (!primaryWallet?.address) {
        throw new Error('Wallet address not available');
      }

      const payload = {
        ...data,
        wallet_address: primaryWallet.address
      };

      if (userDetails) {
        // Update existing record
        await apiService.updateEmployer(userDetails.id, payload);
      } else {
        // Create new record
        await apiService.createEmployer(payload);
      }

      setMessage(note);
      // Refresh user details
      await fetchUserDetails();
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContact = async () => {
    const contactData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phone,
      country_code: countryCode
    };
    await saveToAPI(contactData, 'Contact information saved');
    setIsEditingContact(false);
  };

  const handleSaveAddress = async () => {
    const addressData = {
      street_address: address1,
      street_address2: address2,
      city: city,
      state: stateRegion,
      zip_code: postalCode,
      country: country
    };
    await saveToAPI(addressData, 'Address saved');
    setIsEditingAddress(false);
  };

  const handleSaveCompany = async () => {
    const companyData = {
      company_name: companyName,
      company_description: companyDescription,
      industry: industry,
      company_size: companySize,
      website: website,
      linkedin: linkedin
    };
    await saveToAPI(companyData, 'Company information saved');
    setIsEditingCompany(false);
  };

  const handleCancelContact = () => {
    setIsEditingContact(false);
  };

  const handleCancelAddress = () => {
    setIsEditingAddress(false);
  };

  const handleCancelCompany = () => {
    setIsEditingCompany(false);
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE964B] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header: Avatar + Name */}
        <div className="flex items-center gap-6 mb-8">
          <img
            src={img}
            alt={fullName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0D3B66]">{fullName}</h1>
            <p className="text-gray-500">Employer</p>
          </div>
        </div>

        {/* Editable Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#0D3B66]">Contact Information</h2>
              <button
                type="button"
                aria-label={isEditingContact ? 'Finish editing contact' : 'Edit contact information'}
                onClick={() => setIsEditingContact((v) => !v)}
                className="text-[#0D3B66] hover:text-[#EE964B] transition-colors"
              >
                <PencilIcon />
              </button>
            </div>

            {isEditingContact ? (
              <>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                  placeholder="name@example.com"
                />

                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                <div className="flex gap-2 mb-6">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                  >
                    {countryCodes.map(({ code, country }) => (
                      <option key={code} value={code}>
                        {code} ({country})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                    placeholder="555 555 5555"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveContact}
                    disabled={isSaving}
                    className="flex-1 bg-[#EE964B] text-white py-2 rounded-lg font-semibold hover:bg-[#d97b33] transition-all disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelContact}
                    className="flex-1 bg-gray-200 text-[#0D3B66] py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="text-gray-800">{email || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="text-gray-800">{phone ? `${countryCode} ${phone}` : '—'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#0D3B66]">Address</h2>
              <button
                type="button"
                aria-label={isEditingAddress ? 'Finish editing address' : 'Edit address'}
                onClick={() => setIsEditingAddress((v) => !v)}
                className="text-[#0D3B66] hover:text-[#EE964B] transition-colors"
              >
                <PencilIcon />
              </button>
            </div>

            {isEditingAddress ? (
              <>
                <label className="block text-sm text-gray-600 mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                  placeholder="Street address, P.O. box, company name"
                />

                <label className="block text-sm text-gray-600 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">State / Region</label>
                    <select
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                    >
                      <option value="">Select State</option>
                      {usStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      placeholder="ZIP / Postal Code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                    >
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveAddress}
                    disabled={isSaving}
                    className="flex-1 bg-[#EE964B] text-white py-2 rounded-lg font-semibold hover:bg-[#d97b33] transition-all disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelAddress}
                    className="flex-1 bg-gray-200 text-[#0D3B66] py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="text-gray-800">
                    {address1 || '—'}{address2 ? `, ${address2}` : ''}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">City / State</div>
                  <div className="text-gray-800">{[city, stateRegion].filter(Boolean).join(', ') || '—'}</div>
                </div>
                <div className="flex gap-6">
                  <div>
                    <div className="text-sm text-gray-500">Postal Code</div>
                    <div className="text-gray-800">{postalCode || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Country</div>
                    <div className="text-gray-800">{country || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company Information */}
        <div className="mt-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#0D3B66]">Company Information</h2>
              <button
                type="button"
                aria-label={isEditingCompany ? 'Finish editing company' : 'Edit company information'}
                onClick={() => setIsEditingCompany((v) => !v)}
                className="text-[#0D3B66] hover:text-[#EE964B] transition-colors"
              >
                <PencilIcon />
              </button>
            </div>

            {isEditingCompany ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                    >
                      <option value="">Select Industry</option>
                      {industrySuggestions.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Company Size</label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                    >
                      <option value="">Select Company Size</option>
                      {companySizeOptions.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-600 mb-1">Company Description</label>
                  <textarea
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] min-h-[100px]"
                    placeholder="Describe your company, its mission, and what makes it unique..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveCompany}
                    disabled={isSaving}
                    className="flex-1 bg-[#EE964B] text-white py-2 rounded-lg font-semibold hover:bg-[#d97b33] transition-all disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelCompany}
                    className="flex-1 bg-gray-200 text-[#0D3B66] py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Company Name</div>
                    <div className="text-gray-800">{companyName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Industry</div>
                    <div className="text-gray-800">{industry || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Company Size</div>
                    <div className="text-gray-800">{companySize || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Website</div>
                    <div className="text-gray-800">
                      {website ? (
                        <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#EE964B] hover:underline">
                          {website}
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">LinkedIn</div>
                  <div className="text-gray-800">
                    {linkedin ? (
                      <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-[#EE964B] hover:underline">
                        {linkedin}
                      </a>
                    ) : '—'}
                  </div>
                </div>
                {companyDescription && (
                  <div>
                    <div className="text-sm text-gray-500">Company Description</div>
                    <div className="text-gray-800 leading-relaxed">{companyDescription}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-6 text-sm text-green-600">{message}</div>
        )}
      </div>
    </EmployerLayout>
  );
};

export default EmployerProfile;
