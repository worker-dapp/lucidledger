import React, { useState, useEffect } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import apiService from "../../services/api";

const PostJobModal = ({ employerId, preselectedTemplate = null, onClose, onSuccess }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(preselectedTemplate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    positions_available: "",
    application_deadline: "",
    location: "",
    status: "active",
  });

  useEffect(() => {
    if (!preselectedTemplate) {
      fetchTemplates();
    } else {
      setTemplates([preselectedTemplate]);
    }
  }, [preselectedTemplate]);

  const fetchTemplates = async () => {
    try {
      const response = await apiService.getContractTemplates(employerId);
      if (response?.success) {
        setTemplates(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemplateSelect = (e) => {
    const templateId = parseInt(e.target.value);
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!selectedTemplate) {
      setError("Please select a template");
      setLoading(false);
      return;
    }

    if (!formData.positions_available || formData.positions_available <= 0) {
      setError("Please enter a valid number of positions");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        employer_id: employerId,
        template_id: selectedTemplate.id,
        positions_available: parseInt(formData.positions_available),
        application_deadline: formData.application_deadline || null,
        location: formData.location || null,
        status: formData.status,
      };

      await apiService.createJobPosting(payload);
      onSuccess();
    } catch (err) {
      console.error("Error creating job posting:", err);
      setError(err.message || "Failed to create job posting");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#0D3B66]">Post New Job</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Template *
              </label>
              <select
                value={selectedTemplate?.id || ""}
                onChange={handleTemplateSelect}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              >
                <option value="">-- Choose a template --</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} (${template.base_salary || "N/A"}/{template.pay_frequency || "month"})
                  </option>
                ))}
              </select>
              {templates.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No templates available. Create a template first from the Template Library.
                </p>
              )}
            </div>

            {/* Template Preview */}
            {selectedTemplate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Template Preview: {selectedTemplate.name}
                </h3>
                <div className="text-xs text-blue-800 space-y-1">
                  {selectedTemplate.description && (
                    <p><strong>Description:</strong> {selectedTemplate.description}</p>
                  )}
                  <p><strong>Job Type:</strong> {selectedTemplate.job_type || "N/A"}</p>
                  <p><strong>Location Type:</strong> {selectedTemplate.location_type || "N/A"}</p>
                  <p>
                    <strong>Salary:</strong> {selectedTemplate.base_salary || "N/A"} {selectedTemplate.currency} / {selectedTemplate.pay_frequency}
                  </p>
                  {selectedTemplate.selected_oracles && (
                    <p><strong>Oracles:</strong> {selectedTemplate.selected_oracles}</p>
                  )}
                </div>
              </div>
            )}

            {/* Number of Positions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Positions *
              </label>
              <input
                type="number"
                name="positions_available"
                value={formData.positions_available}
                onChange={handleChange}
                placeholder="e.g., 50"
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many workers are you hiring for this position?
              </p>
            </div>

            {/* Application Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                name="application_deadline"
                value={formData.application_deadline}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              />
            </div>

            {/* Location Override */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Location (Optional)
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Factory Floor A, Building 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify the exact work location (optional)
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              >
                <option value="draft">Draft (not visible to employees)</option>
                <option value="active">Active (visible to employees)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || templates.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d88542] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {loading ? "Posting..." : "Post Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJobModal;
