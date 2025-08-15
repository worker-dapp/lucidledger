import React from "react";

export default function EmploymentType({ formData, handleChange }) {
  const jobTypes = ["Full Time", "Part Time", "Temporary", "Contract", "Permanent (employee)"];
  const currencies = ["USD", "EUR", "GBP", "INR", "JPY"];
  const payFrequencies = ["hourly", "per day", "per week", "per month", "piece rate"];
  const additionalCompOptions = ["Bonus", "Commission", "Tip"];
  const benefits = [
    "Food and Drink",
    "Life Insurance",
    "Medical Insurance",
    "Mobile Phone",
    "Paid Sick Days",
    "Paid Time Off",
    "Parental Paid Leave",
    "Provident Fund",
    "Retirement/Pension",
    "Transportation Allowance",
  ];

  const handleMultiToggleChange = (value, field) => {
    const currentValues = formData[field]?.split(",").filter(Boolean) || [];
    const isSelected = currentValues.includes(value);
    const updatedValues = isSelected
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    handleChange({
      target: {
        name: field,
        value: updatedValues.join(","),
      },
    });
  };

  const handleMultiCheckboxChange = (e, field) => {
    const { value, checked } = e.target;
    const currentValues = formData[field]?.split(",").filter(Boolean) || [];
    const updatedValues = checked
      ? [...new Set([...currentValues, value])]
      : currentValues.filter((v) => v !== value);
    handleChange({
      target: {
        name: field,
        value: updatedValues.join(","),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Job Type Buttons */}
      <div>
        <label className="block text-lg font-medium mb-2">Job Type</label>
        <div className="flex flex-wrap gap-2">
          {jobTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                handleChange({ target: { name: "JobType", value: type } })
              }
              className={`px-4 py-2 rounded border ${
                formData.JobType === type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Pay Amount */}
      <div>
        <label className="block text-lg font-medium mb-2">
          What does this job pay?
        </label>
        <input
          type="number"
          name="jobPay"
          value={formData.jobPay}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder="Enter pay amount"
        />
      </div>

      {/* Currency & Pay Frequency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Currency</label>
          <select
            name="currency"
            value={formData.currency || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Currency</option>
            {currencies.map((cur) => (
              <option key={cur} value={cur}>
                {cur}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Pay Frequency</label>
          <select
            name="payFrequency"
            value={formData.payFrequency || ""}
            onChange={handleChange}
            className="w-full border rounded"
          >
            <option value="">Select Frequency</option>
            {payFrequencies.map((freq) => (
              <option key={freq} value={freq}>
                {freq}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Additional Compensation Checkboxes */}
      <div>
        <label className="block text-lg font-medium mb-2">
          Additional Compensation
        </label>
        <div className="flex gap-4 flex-wrap">
          {additionalCompOptions.map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={option}
                checked={
                  formData.additionalCompensation
                    ?.split(",")
                    .includes(option) || false
                }
                onChange={(e) =>
                  handleMultiCheckboxChange(e, "additionalCompensation")
                }
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      {/* Employee Benefits as Buttons */}
      <div>
        <label className="block text-lg font-medium mb-2">
          Employee Benefits
        </label>
        <div className="flex flex-wrap gap-2">
          {benefits.map((benefit) => {
            const selected =
              formData.employeeBenefits?.split(",").includes(benefit);
            return (
              <button
                key={benefit}
                type="button"
                onClick={() =>
                  handleMultiToggleChange(benefit, "employeeBenefits")
                }
                className={`px-3 py-2 rounded border ${
                  selected
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-black"
                }`}
              >
                {benefit}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
