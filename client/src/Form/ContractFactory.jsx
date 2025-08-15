import React from "react";

export default function ContractFactory({ formData }) {
  const {
    companyName,
    jobTitle,
    jobLocationType,
    jobLocation,
    JObType,
    jobPay,
    currency,
    payFrequency,
    additionalCompensation,
    employeeBenefits,
    summary,
    responsiblities,
    skills,
    associatedSkills,
    companyDescription,
  } = formData;

  // Parse additionalCompensation and employeeBenefits if stored as comma-separated strings
  const additionalCompList = additionalCompensation
    ? additionalCompensation.split(",").filter(Boolean)
    : [];
  const employeeBenefitsList = employeeBenefits
    ? employeeBenefits.split(",").filter(Boolean)
    : [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Job Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <h1 className="text-4xl font-bold text-[#0D3B66] mb-4">
          {jobTitle || "Job Title"}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xl text-[#EE964B] font-semibold">
              {companyName || "Company Name"}
            </p>
            <p className="text-lg text-gray-600">
              📍 {jobLocation || "Location"} ({jobLocationType || "Location Type"})
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#0D3B66]">
              {jobPay && currency ? `${currency} ${jobPay}` : "Salary not specified"}
            </p>
            <p className="text-lg text-gray-600">
              {payFrequency ? `per ${payFrequency}` : "Payment frequency not specified"}
            </p>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">
            Job Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[#EE964B]">Job Type</h3>
              <p className="text-gray-700">{JObType || "Not specified"}</p>
            </div>

            <div>
              <h3 className="font-semibold text-[#EE964B]">Location Type</h3>
              <p className="text-gray-700">{jobLocationType || "Not specified"}</p>
            </div>

            <div>
              <h3 className="font-semibold text-[#EE964B]">Additional Compensation</h3>
              {additionalCompList.length > 0 ? (
                <div className="text-gray-700">
                  {additionalCompList.map((comp, index) => (
                    <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded mr-2 mb-1">
                      {comp.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700">None specified</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-[#EE964B]">Employee Benefits</h3>
              {employeeBenefitsList.length > 0 ? (
                <div className="text-gray-700">
                  {employeeBenefitsList.map((benefit, index) => (
                    <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded mr-2 mb-1">
                      {benefit.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700">None specified</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">
            Requirements
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[#EE964B]">Skills Required</h3>
              <p className="text-gray-700">{skills || "Not specified"}</p>
            </div>

            <div>
              <h3 className="font-semibold text-[#EE964B]">Associated Skills</h3>
              <p className="text-gray-700">{associatedSkills || "Not specified"}</p>
            </div>

            <div>
              <h3 className="font-semibold text-[#EE964B]">Responsibilities</h3>
              <p className="text-gray-700">{responsiblities || "Not specified"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Description */}
      {summary && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">
            Job Description
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* Company Description */}
      {companyDescription && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">
            About the Company
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">
              {companyDescription}
            </p>
          </div>
        </div>
      )}

      {/* Review Notice */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-[#0D3B66] mb-2">
            📋 Review Your Job Posting
          </h3>
          <p className="text-gray-700">
            Please review all the information above before submitting your job posting. 
            Once submitted, the job will be available for employees to view and apply.
          </p>
        </div>
      </div>
    </div>
  );
} 