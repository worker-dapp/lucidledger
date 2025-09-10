import React, { useState, useEffect } from "react";
import img from '../assets/profile.webp';
import EmployeeNavbar from "../components/EmployeeNavbar";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const PencilIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.862 4.487z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 2.25l3.75 3.75" />
  </svg>
);

const EmployeeProfile = () => {
  const { user } = useDynamicContext();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

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

  // Skills state
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const skillSuggestions = [
    'Fishing','Driving','Harvesting','Carpentry','Plumbing','Cooking','Masonry','Welding','First Aid','Security','Cleaning','Child Care','Data Entry','Retail','Customer Service','Electrical','Painting','Landscaping','Construction','Forklift'
  ];
  const filteredSuggestions = skillInput
    ? skillSuggestions.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s))
    : [];

  // Experience state
  const [experiences, setExperiences] = useState([
    { title: '',description: '', startDate: '', endDate: '' }
  ]);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      // Optionally hydrate phone/address/skills/experience from API later
    }
  }, [user]);

  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Your Name';

  const simulateSave = async (note = 'Profile updated') => {
    setIsSaving(true);
    setMessage('');
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
    setMessage(note);
  };

  const handleSaveContact = async () => {
    await simulateSave('Contact information saved');
    setIsEditingContact(false);
  };

  const handleSaveAddress = async () => {
    await simulateSave('Address saved');
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

  // Debounced auto-save for skills (simulated)
  useEffect(() => {
    if (!skills) return;
    const t = setTimeout(() => {
      if (skills.length >= 0) simulateSave('Skills saved');
    }, 800);
    return () => clearTimeout(t);
  }, [skills]);

  // Experience handlers
  const addExperienceRow = () => {
    setExperiences(prev => [...prev, { title: '', startDate: '', endDate: '' }]);
  };

  const removeExperienceRow = (idx) => {
    setExperiences(prev => prev.filter((_, i) => i !== idx));
  };

  const updateExperienceField = (idx, field, value) => {
    setExperiences(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const saveExperiences = async () => {
    await simulateSave('Work experience saved');
  };

  return (
    <div className="min-h-screen bg-white">
      <EmployeeNavbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                  placeholder="name@example.com"
                />

                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mb-6 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                  placeholder="+1 555 555 5555"
                />

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
                  <div className="text-gray-800">{phone || '—'}</div>
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
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      placeholder="State / Region"
                    />
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
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      placeholder="Country"
                    />
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

        {/* Skills & Work Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Skills */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0D3B66] mb-4">Skills</h2>

            {/* Tag input */}
            <div className="relative mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                placeholder="Add a skill"
              />
              {/* Suggestions */}
              {filteredSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="w-full text-left px-4 py-2 hover:bg-orange-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected skills as pills */}
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="text-orange-700 hover:text-orange-900"
                    aria-label={`Remove ${s}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <span className="text-gray-400 text-sm">No skills added yet</span>
              )}
            </div>
          </div>

          {/* Work Experience */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0D3B66] mb-4">Work Experience</h2>

            <div className="space-y-4">
              {experiences.map((row, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                      <label className="block text-sm text-gray-600 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => updateExperienceField(idx, 'title', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                        placeholder="e.g., Farm Worker"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={row.startDate}
                        onChange={(e) => updateExperienceField(idx, 'startDate', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={row.endDate}
                        onChange={(e) => updateExperienceField(idx, 'endDate', e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
                      />
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
        </div>

        {message && (
          <div className="mt-6 text-sm text-green-600">{message}</div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
