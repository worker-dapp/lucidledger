import React, { useState } from "react";
import { X, Save } from "lucide-react";
import apiService from "../../services/api";

const ORACLE_OPTIONS = [
  { key: "manual", label: "Manual Verification", description: "Human supervisor verification" },
  { key: "qr",     label: "QR Clock-In",         description: "Worker scans QR code to clock in/out" },
];

const JOB_TYPES      = ["Full-time", "Part-time", "Contract", "Temporary"];
const LOCATION_TYPES = ["On-site", "Remote", "Hybrid"];
const PAY_FREQUENCIES = ["hourly", "daily", "weekly", "bi-weekly", "monthly"];
const CURRENCIES     = ["USD", "USDC"];

const EditTemplateModal = ({ template, employerId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name:                   template.name                   || "",
    description:            template.description            || "",
    job_type:               template.job_type               || "",
    location_type:          template.location_type          || "",
    base_salary:            template.base_salary            || "",
    currency:               template.currency               || "USD",
    pay_frequency:          template.pay_frequency          || "",
    additional_compensation: template.additional_compensation || "",
    employee_benefits:      template.employee_benefits      || "",
    responsibilities:       template.responsibilities       || "",
    skills:                 template.skills                 || "",
    selected_oracles:       template.selected_oracles       || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const selectedOraclesList = form.selected_oracles
    ? form.selected_oracles.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOracleToggle = (key) => {
    const current = selectedOraclesList;
    const updated = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setForm((prev) => ({ ...prev, selected_oracles: updated.join(",") }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Template name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiService.updateContractTemplate(template.id, {
        ...form,
        employer_id: employerId,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-[#0D3B66]">Edit Contract Template</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">

          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
            />
          </div>

          {/* Job Type + Location Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                name="job_type"
                value={form.job_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              >
                <option value="">Select…</option>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
              <select
                name="location_type"
                value={form.location_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              >
                <option value="">Select…</option>
                {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Pay */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Pay</label>
              <input
                type="number"
                name="base_salary"
                value={form.base_salary}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                name="pay_frequency"
                value={form.pay_frequency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              >
                <option value="">Select…</option>
                {PAY_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Additional Compensation + Benefits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Compensation</label>
              <textarea
                name="additional_compensation"
                value={form.additional_compensation}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
              <textarea
                name="employee_benefits"
                value={form.employee_benefits}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              />
            </div>
          </div>

          {/* Verification Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Methods</label>
            <div className="grid grid-cols-2 gap-3">
              {ORACLE_OPTIONS.map(({ key, label, description }) => {
                const selected = selectedOraclesList.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleOracleToggle(key)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      selected
                        ? "border-[#EE964B] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-sm text-[#0D3B66]">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
            <textarea
              name="responsibilities"
              value={form.responsibilities}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
            <textarea
              name="skills"
              value={form.skills}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d97b33] transition-colors font-medium disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTemplateModal;
