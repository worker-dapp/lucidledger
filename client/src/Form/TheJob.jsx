import React from "react";

export default function TheJob({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-medium mb-2">
          Summary <span className="text-sm text-gray-500">(Min. 100 characters)</span>
        </label>
        <textarea
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          className="w-full border p-3 rounded min-h-[100px]"
          placeholder="Write a brief job summary..."
        />
        {formData.summary.length > 0 && formData.summary.length < 100 && (
          <p className="text-red-500 text-sm mt-1">
            Summary must be at least 100 characters.
          </p>
        )}
      </div>

      {/* Summary Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-1">
            Job Title
          </label>
          <div className="border p-3 rounded bg-gray-50">
            {formData.jobTitle || <span className="text-gray-400">Not entered</span>}
          </div>
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-1">
            Company Name
          </label>
          <div className="border p-3 rounded bg-gray-50">
            {formData.companyName || <span className="text-gray-400">Not entered</span>}
          </div>
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-1">
            Rate of Pay
          </label>
          <div className="border p-3 rounded bg-gray-50">
            {formData.jobPay
              ? `${formData.currency || ''} ${formData.jobPay} ${formData.payFrequency || ''}`
              : <span className="text-gray-400">Not entered</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
