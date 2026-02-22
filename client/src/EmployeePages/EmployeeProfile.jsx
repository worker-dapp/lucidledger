import React, { useState, useEffect, useRef } from "react";
import img from '../assets/profile.webp';
import EmployeeNavbar from "../components/EmployeeNavbar";
import { useAuth } from "../hooks/useAuth";
import apiService from '../services/api';

const PencilIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 2.25l3.75 3.75" />
  </svg>
);

const EmployeeProfile = () => {
  const [linkMessage, setLinkMessage] = useState('');
  const accountCallbacks = {
    onSuccess: ({ user: updatedUser, linkMethod, updateMethod }) => {
      const method = (linkMethod || updateMethod) === 'email' ? 'Email' : 'Phone number';
      setLinkMessage(`${method} updated successfully!`);
      setTimeout(() => setLinkMessage(''), 3000);
    },
    onError: (error) => {
      console.error('Account link/update error:', error);
      setLinkMessage('Failed to update account. It may already be linked to another user.');
      setTimeout(() => setLinkMessage(''), 5000);
    },
  };
  const { user, primaryWallet, smartWalletAddress, linkEmail, linkPhone, updateEmail, updatePhone } = useAuth(accountCallbacks, accountCallbacks);

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
  const initialLoadDone = useRef(false);

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

  // Skills state
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

  // Experience state
  const [experiences, setExperiences] = useState([
    { title: '',description: '', startDate: '', endDate: '' }
  ]);

  // Fetch user details from localStorage
  const fetchUserDetails = async () => {
    const walletAddress = smartWalletAddress || primaryWallet?.address;
    if (!user || !walletAddress) {
      setLoading(false);
      return;
    }

    try {
      // Get employee profile from API
      const response = await apiService.getEmployeeByWallet(walletAddress);
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

        // Load skills from DB
        if (data.skills) {
          try {
            const parsed = typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills;
            if (Array.isArray(parsed)) setSkills(parsed);
          } catch (e) { /* ignore parse errors */ }
        }

        // Load work experience from DB
        if (Array.isArray(data.work_experience) && data.work_experience.length > 0) {
          setExperiences(data.work_experience);
        }

        initialLoadDone.current = true;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setMessage('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [user, primaryWallet]);

  useEffect(() => {
    if (user) {
      // Fallback to auth user data if DB data not available
      if (!userDetails) {
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setEmail(user.email?.address || user.email || '');
      }
    }
  }, [user, userDetails]);

  // Sync newly linked Privy credentials to the database
  const privyEmail = user?.email?.address || '';
  const privyPhone = user?.phone?.number || '';
  useEffect(() => {
    if (!userDetails) return;
    const dbEmail = userDetails.email || '';
    const dbPhone = userDetails.phone_number || '';
    const updates = {};
    if (privyEmail && privyEmail !== dbEmail) {
      updates.email = privyEmail;
      setEmail(privyEmail);
    }
    if (privyPhone && privyPhone !== dbPhone) {
      updates.phone_number = privyPhone;
      setPhone(privyPhone);
    }
    if (Object.keys(updates).length > 0) {
      saveToAPI(updates, 'Linked account synced');
    }
  }, [privyEmail, privyPhone]);

  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Your Name';

  const saveToAPI = async (data, note = 'Profile updated') => {
    setIsSaving(true);
    setMessage('');
    
    try {
    const walletAddress = smartWalletAddress || primaryWallet?.address;
    if (!walletAddress) {
      throw new Error('Wallet address not available');
    }

      const payload = {
        ...data,
        wallet_address: walletAddress
      };

      if (userDetails) {
        // Update existing record
        await apiService.updateEmployee(userDetails.id, payload);
      } else {
        // Create new record
        await apiService.createEmployee(payload);
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

  const handleCancelContact = () => {
    setIsEditingContact(false);
  };

  const handleCancelAddress = () => {
    setIsEditingAddress(false);
  };

  // Skills handlers
  const addSkill = (value) => {
    const v = value.trim();
    if (!v) return;
    if (skills.includes(v)) return;
    setSkills(prev => [...prev, v]);
    setSkillInput('');
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === 'Backspace' && !skillInput && skills.length) {
      // quick remove last
      setSkills(prev => prev.slice(0, -1));
    }
  };

  const removeSkill = (value) => {
    setSkills(prev => prev.filter(s => s !== value));
  };

  // Debounced auto-save for skills
  useEffect(() => {
    if (!initialLoadDone.current || !userDetails) return;
    // Compare with what's already in DB to avoid save loops from re-fetch
    let dbSkills = [];
    if (userDetails.skills) {
      try {
        dbSkills = typeof userDetails.skills === 'string' ? JSON.parse(userDetails.skills) : userDetails.skills;
      } catch (e) { /* ignore */ }
    }
    if (JSON.stringify(skills) === JSON.stringify(dbSkills)) return;
    const t = setTimeout(() => {
      saveToAPI({ skills: JSON.stringify(skills) }, 'Skills saved');
    }, 800);
    return () => clearTimeout(t);
  }, [skills, userDetails]);

  // Month/year helpers
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

  const getMonth = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts.length >= 2 ? parts[1] : '';
  };
  const getYear = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts[0] || '';
  };
  const setDatePart = (idx, field, part, value) => {
    setExperiences(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      const current = row[field] || '';
      const curMonth = getMonth(current);
      const curYear = getYear(current);
      const newMonth = part === 'month' ? value : curMonth;
      const newYear = part === 'year' ? value : curYear;
      const newDate = (newYear && newMonth) ? `${newYear}-${newMonth}` : newYear ? newYear : newMonth ? `-${newMonth}` : '';
      return { ...row, [field]: newDate };
    }));
  };

  // Experience handlers
  const addExperienceRow = () => {
    setExperiences(prev => [...prev, { title: '', description: '', startDate: '', endDate: '' }]);
  };

  const removeExperienceRow = (idx) => {
    setExperiences(prev => prev.filter((_, i) => i !== idx));
  };

  const updateExperienceField = (idx, field, value) => {
    setExperiences(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const saveExperiences = async () => {
    const cleaned = experiences.map(e => ({
      ...e,
      startDate: e.startDate?.includes('-') && e.startDate.split('-')[0] ? e.startDate : '',
      endDate: e.endDate?.includes('-') && e.endDate.split('-')[0] ? e.endDate : '',
    }));
    await saveToAPI({ work_experience: cleaned }, 'Work experience saved');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <EmployeeNavbar />
        <div className="pt-40 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE964B] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <EmployeeNavbar />

      <div className="pt-40 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header: Avatar + Name */}
        <div className="flex items-center gap-6 mb-8">
          <img
            src={img}
            alt={fullName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0D3B66]">{fullName}</h1>
            <p className="text-gray-500">Employee</p>
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
                {privyEmail ? (
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800">{privyEmail}</span>
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={updateEmail}
                      className="text-sm text-[#0d3b66] hover:text-[#EE964B] underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={linkEmail}
                      className="px-4 py-2 border border-[#0d3b66] text-[#0d3b66] rounded-md hover:bg-[#0d3b66] hover:text-white transition-colors text-sm"
                    >
                      + Link Email Address
                    </button>
                  </div>
                )}

                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                {privyPhone ? (
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800">{privyPhone}</span>
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={updatePhone}
                      className="text-sm text-[#0d3b66] hover:text-[#EE964B] underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={linkPhone}
                      className="px-4 py-2 border border-[#0d3b66] text-[#0d3b66] rounded-md hover:bg-[#0d3b66] hover:text-white transition-colors text-sm"
                    >
                      + Link Phone Number
                    </button>
                  </div>
                )}

                {linkMessage && (
                  <div className={`mb-4 p-3 rounded text-sm ${linkMessage.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {linkMessage}
                  </div>
                )}

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
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800">{email || '—'}</span>
                    {privyEmail && (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800">{phone || '—'}</span>
                    {privyPhone && (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
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

        {/* Work Experience */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0D3B66] mb-4">Work Experience</h2>

          <div className="space-y-4">
            {experiences.map((row, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={row.title}
                      onChange={(e) => updateExperienceField(idx, 'title', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      placeholder="e.g., Farm Worker"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Description / Duties</label>
                    <input
                      type="text"
                      value={row.description || ''}
                      onChange={(e) => updateExperienceField(idx, 'description', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      placeholder="e.g., Managed daily harvest operations"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                    <div className="flex gap-2">
                      <select
                        value={getMonth(row.startDate)}
                        onChange={(e) => setDatePart(idx, 'startDate', 'month', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      >
                        <option value="">Month</option>
                        {months.map((m, i) => (
                          <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={getYear(row.startDate)}
                        onChange={(e) => setDatePart(idx, 'startDate', 'year', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      >
                        <option value="">Year</option>
                        {years.map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">End Date</label>
                    <div className="flex gap-2">
                      <select
                        value={getMonth(row.endDate)}
                        onChange={(e) => setDatePart(idx, 'endDate', 'month', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      >
                        <option value="">Month</option>
                        {months.map((m, i) => (
                          <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={getYear(row.endDate)}
                        onChange={(e) => setDatePart(idx, 'endDate', 'year', e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      >
                        <option value="">Year</option>
                        {years.map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  {experiences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperienceRow(idx)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={addExperienceRow}
              className="text-[#0D3B66] hover:text-[#EE964B] font-medium"
            >
              + Add Job
            </button>

            <button
              type="button"
              onClick={saveExperiences}
              className="bg-[#EE964B] text-white px-4 py-2 rounded-lg hover:bg-[#d97b33]"
            >
              Save Experience
            </button>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0D3B66] mb-4">Skills</h2>

          {/* Selected skills summary */}
          {skills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 bg-[#EE964B] text-white px-3 py-1 rounded-full text-sm font-medium">
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="hover:text-orange-200"
                      aria-label={`Remove ${s}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
              placeholder="Search skills..."
            />
          </div>

          {/* Accordion categories */}
          <div className="space-y-1">
            {Object.entries(skillCategories).map(([category, items]) => {
              const searchLower = skillSearch.toLowerCase();
              const filtered = searchLower
                ? items.filter(s => s.toLowerCase().includes(searchLower))
                : items;
              if (filtered.length === 0) return null;
              const isOpen = openCategories[category] || !!skillSearch;
              const selectedCount = items.filter(s => skills.includes(s)).length;

              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-[#0D3B66]">
                      {category}
                      {selectedCount > 0 && (
                        <span className="ml-2 text-xs bg-[#EE964B] text-white px-2 py-0.5 rounded-full">
                          {selectedCount}
                        </span>
                      )}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
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
                            skills.includes(s)
                              ? 'bg-[#EE964B] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div className="mt-4">
            <label className="block text-sm text-gray-500 mb-1">Add a custom skill</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                placeholder="Type and press Enter"
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="px-4 py-2 bg-[#0D3B66] text-white rounded-lg hover:bg-[#0a2f52] transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {skills.length === 0 && (
            <p className="mt-3 text-gray-400 text-sm">No skills selected yet. Search or expand a category above, or add your own.</p>
          )}
        </div>

        {message && (
          <div className="mt-6 text-sm text-green-600">{message}</div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
