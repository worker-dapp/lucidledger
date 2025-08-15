import React from "react";

export default function StepIndicator({ currentStep, onStepClick }) {
  const stepLabels = [
    "Job Basics",
    "Employment Type",
    "The Job",
    "Oracle Configuration",
    "Responsibilities",
    "Review Contract",
  ];

  const totalSteps = stepLabels.length;

  return (
    <div className="mb-8">
      {/* Step numbers and lines */}
      <div className="flex items-center justify-between relative">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = currentStep === stepNum;
          const isCompleted = stepNum < currentStep;

          return (
            <React.Fragment key={stepNum}>
              {/* Circle */}
              <div className="flex flex-col items-center relative z-10">
                <button
                  type="button" 
                  onClick={() => onStepClick(stepNum)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      isActive
                        ? "bg-green-500 text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }
                    transition-colors duration-300
                  `}
                >
                  {stepNum}
                </button>
              </div>

              {/* Connector line, except after last step */}
              {stepNum !== totalSteps && (
                <div className="flex-1 h-1 bg-gray-300 mx-1 relative">
                  <div
                    className={`absolute top-0 left-0 h-1 transition-all duration-300
                      ${stepNum < currentStep ? "bg-green-500 w-full" : "w-0"}
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Labels below */}
      <div className="mt-2 flex justify-between p-1">
        {stepLabels.map((label, i) => (
          <div key={i} className="w-10 text-sm">
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
