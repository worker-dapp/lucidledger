import React, { useEffect, useState } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import apiService from "../services/api";
import { useRecruiter } from "./RecruiterContext";

const RecruiterProfile = () => {
  const { recruiterId, recruiterData, isLoading } = useRecruiter();
  const [form, setForm] = useState({ first_name: "", last_name: "", phone_number: "", agency_name: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (recruiterData) {
      setForm({
        first_name: recruiterData.first_name || "",
        last_name: recruiterData.last_name || "",
        phone_number: recruiterData.phone_number || "",
        agency_name: recruiterData.agency_name || "",
      });
    }
  }, [recruiterData]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recruiterId) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.updateRecruiter(recruiterId, form);
      setSuccess(true);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D3B66]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0D3B66] mb-6">My Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
            <input
              name="agency_name"
              value={form.agency_name}
              onChange={handleChange}
              placeholder="Your agency or company name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
            />
          </div>

          {recruiterData?.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={recruiterData.email}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Update it via your login settings.</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Profile saved successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#0D3B66] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0a2d50] transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecruiterProfile;
