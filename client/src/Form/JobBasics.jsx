import React from 'react';

const JobBasics = ({ formData, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 font-semibold">
          Industry Standard Job Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleChange}
          required
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold">
          Where will this job be performed? <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-4">
          <label>
            <input
              type="radio"
              name="jobLocationType"
              value="on site"
              checked={formData.jobLocationType === 'on site'}
              onChange={handleChange}
              required
            />
            <span className="ml-2">On site</span>
          </label>
          <label>
            <input
              type="radio"
              name="jobLocationType"
              value="on the road"
              checked={formData.jobLocationType === 'on the road'}
              onChange={handleChange}
              required
            />
            <span className="ml-2">On the road</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block mb-2 font-semibold">
          Job Location <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="jobLocation"
          value={formData.jobLocation}
          onChange={handleChange}
          required
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold">
          Company Name on Job Listing <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          required
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold">
          Job notifications will be sent to: <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="notificationEmail"
          placeholder="Enter company’s email"
          value={formData.notificationEmail}
          onChange={handleChange}
          required
          className="w-full border rounded p-2"
        />
      </div>

    </div>
  );
};

export default JobBasics;
