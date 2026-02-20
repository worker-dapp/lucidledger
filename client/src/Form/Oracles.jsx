import React, { useState } from "react";

// Oracle types currently registered on-chain. Expand as new oracles are deployed.
const AVAILABLE_ORACLES = ["manual"];

export default function OracleConfiguration({ formData, handleChange }) {
  const [selectedOracles, setSelectedOracles] = useState(formData.selectedOracles || []);

  const oracleOptions = {
    manual: {
      name: "Manual Verification",
      description: "Human supervisor verification",
      suitableFor: ["all"],
      features: ["Supervisor approval", "Quality control", "Custom verification"]
    },
    "time-clock": {
      name: "Badge Scan",
      description: "Badge-based clock in/out at a terminal",
      suitableFor: ["time-based"],
      features: ["Clock in/out", "Break tracking", "Overtime calculation"]
    },
    "ble-beacon": {
      name: "Bluetooth Beacon",
      description: "Proximity-based verification using Bluetooth beacons",
      suitableFor: ["time-based", "milestone"],
      features: ["On-site proximity", "Low-power tracking", "Geofenced presence"]
    },
    gps: {
      name: "GPS",
      description: "Location-based work verification",
      suitableFor: ["time-based", "milestone"],
      features: ["Location tracking", "Attendance verification", "Route validation"]
    },
    weight: {
      name: "Scale/Weight",
      description: "Quantity/weight-based verification",
      suitableFor: ["volume", "piece-rate"],
      features: ["Weight measurement", "Quantity counting", "Volume calculation"]
    },
    image: {
      name: "Image",
      description: "Photo evidence for work completion",
      suitableFor: ["piece-rate", "milestone", "volume"],
      features: ["Photo verification", "Quality assessment", "Progress tracking"]
    }
  };

  const handleOracleToggle = (oracleKey) => {
    if (!AVAILABLE_ORACLES.includes(oracleKey)) return;

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
          Choose manual verification or one or more oracle-based methods for work verification and payment calculation.
        </p>
      </div>

      {/* Oracle Selection */}
      <div>
        <label className="block text-lg font-medium mb-3">
          Verification Methods <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(oracleOptions).map(([key, oracle]) => {
            const isSelected = selectedOracles.includes(key);
            const isAvailable = AVAILABLE_ORACLES.includes(key);
            return (
              <div
                key={key}
                className={`p-4 rounded-lg border transition-all ${
                  !isAvailable
                    ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "border-blue-500 bg-blue-50 cursor-pointer"
                    : "border-gray-300 hover:border-blue-300 cursor-pointer"
                }`}
                onClick={() => handleOracleToggle(key)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{oracle.name}</h4>
                  </div>
                  {!isAvailable && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-600">
                      Coming Soon
                    </span>
                  )}
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
                    disabled={!isAvailable}
                    onChange={() => handleOracleToggle(key)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">
                    {!isAvailable ? "Coming Soon" : isSelected ? "Selected" : "Select"}
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
