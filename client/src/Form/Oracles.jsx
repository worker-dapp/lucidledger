import React, { useState, useEffect } from "react";

export default function OracleConfiguration({ formData, handleChange }) {
  const [selectedOracles, setSelectedOracles] = useState(formData.selectedOracles || []);

  const oracleOptions = {
    gps: {
      name: "GPS Oracle",
      description: "Location-based work verification",
      suitableFor: ["time-based", "milestone"],
      features: ["Location tracking", "Attendance verification", "Route validation"]
    },
    image: {
      name: "Image Oracle",
      description: "Photo evidence for work completion",
      suitableFor: ["piece-rate", "milestone", "volume"],
      features: ["Photo verification", "Quality assessment", "Progress tracking"]
    },
    weight: {
      name: "Weight Oracle",
      description: "Quantity/weight-based verification",
      suitableFor: ["volume", "piece-rate"],
      features: ["Weight measurement", "Quantity counting", "Volume calculation"]
    },
    "time-clock": {
      name: "Time Clock Oracle",
      description: "Automated time tracking",
      suitableFor: ["time-based"],
      features: ["Clock in/out", "Break tracking", "Overtime calculation"]
    },
    manual: {
      name: "Manual Verification",
      description: "Human supervisor verification",
      suitableFor: ["all"],
      features: ["Supervisor approval", "Quality control", "Custom verification"]
    }
  };

  const handleOracleToggle = (oracleKey) => {
    const newSelected = selectedOracles.includes(oracleKey)
      ? selectedOracles.filter((key) => key !== oracleKey)
      : [...selectedOracles, oracleKey];

    setSelectedOracles(newSelected);

    // Update form data
    handleChange({
      target: {
        name: "selectedOracles",
        value: newSelected
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Work Verification Setup</h2>
        <p className="text-gray-600 mb-4">
          Choose how work will be verified and payments will be calculated. Different verification methods have different accuracy levels.
        </p>
      </div>

      {/* Oracle Selection */}
      <div>
        <label className="block text-lg font-medium mb-3">Verification Methods</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(oracleOptions).map(([key, oracle]) => {
            const isSelected = selectedOracles.includes(key);
            return (
              <div
                key={key}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-300"
                }`}
                onClick={() => handleOracleToggle(key)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{oracle.name}</h4>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{oracle.description}</p>
                <div className="space-y-1">
                  {oracle.features.map((feature, index) => (
                    <div key={index} className="text-xs text-gray-500 flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleOracleToggle(key)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Verification Notes */}
      <div>
        <label className="block text-lg font-medium mb-2">Additional Verification Notes</label>
        <textarea
          name="verificationNotes"
          value={formData.verificationNotes || ""}
          onChange={handleChange}
          className="w-full border p-3 rounded"
          placeholder="Any special verification requirements or notes..."
          rows={3}
        />
      </div>
    </div>
  );
}
