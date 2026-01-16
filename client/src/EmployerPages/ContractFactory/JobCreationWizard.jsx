import React, { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import apiService from "../../services/api";
import StepIndicator from "../../components/StepIndicator";
import JobBasics from "../../Form/JobBasics";
import EmploymentType from "../../Form/EmploymentType";
import TheJob from "../../Form/TheJob";
import Oracles from "../../Form/Oracles";
import Responsibilities from "../../Form/Responsibilities";
import { Save, X } from "lucide-react";

const JobCreationWizard = ({ employerId, onComplete, onCancel }) => {
  const { user, primaryWallet } = useDynamicContext();
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPrefilledData, setHasPrefilledData] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    jobTitle: "",
    jobLocationType: "",
    jobLocation: "",
    companyName: "",
    notificationEmail: "",
    JobType: "",
    jobPay: "",
    currency: "",
    payFrequency: "",
    additionalCompensation: "",
    employeeBenefits: "",
    summary: "",
    selectedOracles: "",
    verificationNotes: "",
    responsiblities: "",
    skills: "",
    associatedSkills: "",
    companyDescription: ""
  });

  // Template options
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [templateNameTouched, setTemplateNameTouched] = useState(false);
  const [positionsCount, setPositionsCount] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Auto-fill template name from job title
  useEffect(() => {
    if (saveAsTemplate && formData.jobTitle && !templateNameTouched) {
      setTemplateName(formData.jobTitle);
    }
  }, [saveAsTemplate, formData.jobTitle, templateNameTouched]);

  // Validation functions
  const validateStep1 = () => {
    return (
      formData.jobTitle &&
      formData.jobLocationType &&
      formData.jobLocation &&
      formData.companyName &&
      formData.notificationEmail
    );
  };

  const validateStep2 = () => {
    return (
      formData.JobType &&
      formData.jobPay &&
      formData.currency &&
      formData.payFrequency
    );
  };

  const validateStep3 = () => {
    return formData.summary && formData.summary.length >= 100;
  };

  const validateStep4 = () => {
    return formData.selectedOracles;
  };

  const validateStep5 = () => {
    return formData.responsiblities && formData.skills;
  };

  const validateStep6 = () => {
    if (saveAsTemplate && !templateName.trim()) {
      return false;
    }
    if (!positionsCount || positionsCount < 1) {
      return false;
    }
    return true;
  };

  const isStepValid = (stepIndex) => {
    switch (stepIndex) {
      case 1: return validateStep1();
      case 2: return validateStep2();
      case 3: return validateStep3();
      case 4: return validateStep4();
      case 5: return validateStep5();
      case 6: return validateStep6();
      default: return true;
    }
  };

  const getFirstInvalidStep = (maxStep) => {
    for (let i = 1; i <= maxStep; i += 1) {
      if (!isStepValid(i)) {
        return i;
      }
    }
    return null;
  };

  const canProceedToNext = () => getFirstInvalidStep(step) === null;

  const handleNext = () => {
    if (step >= totalSteps) return;

    const firstInvalidStep = getFirstInvalidStep(step);
    if (firstInvalidStep !== null) {
      setStep(firstInvalidStep);
      return;
    }

    setStep(step + 1);
  };

  const handleStepClick = (stepNum) => {
    if (stepNum <= step) {
      setStep(stepNum);
      return;
    }

    const firstInvalidStep = getFirstInvalidStep(stepNum - 1);
    if (firstInvalidStep !== null) {
      setStep(firstInvalidStep);
      return;
    }

    setStep(stepNum);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Fetch employer info and prefill form
  useEffect(() => {
    const fetchEmployerData = async () => {
      if (hasPrefilledData) return;

      try {
        let employerResponse = null;

        if (primaryWallet?.address) {
          employerResponse = await apiService.getEmployerByWallet(primaryWallet.address);
        }

        if ((!employerResponse || !employerResponse.data) && user?.email) {
          employerResponse = await apiService.getEmployerByEmail(user.email);
        }

        if (employerResponse?.data) {
          const employer = employerResponse.data;

          setFormData((prev) => ({
            ...prev,
            companyName: prev.companyName || employer.company_name || "",
            jobLocation:
              prev.jobLocation ||
              [employer.city, employer.state, employer.country].filter(Boolean).join(", "),
            notificationEmail: prev.notificationEmail || employer.email || "",
            companyDescription: prev.companyDescription || employer.company_description || "",
          }));

          setHasPrefilledData(true);
        }
      } catch (error) {
        console.error("Error fetching employer information:", error);
      }
    };

    if (primaryWallet?.address || user?.email) {
      fetchEmployerData();
    }
  }, [primaryWallet?.address, user?.email, hasPrefilledData, user]);

  const handleSubmit = async () => {
    if (!employerId) {
      alert("Employer information not available. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (saveAsTemplate) {
        // Create template first
        const templateResponse = await apiService.createContractTemplate({
          employer_id: employerId,
          name: templateName,
          description: formData.summary,
          job_type: formData.JobType,
          location_type: formData.jobLocationType,
          base_salary: formData.jobPay ? parseFloat(formData.jobPay) : null,
          currency: formData.currency,
          pay_frequency: formData.payFrequency,
          selected_oracles: Array.isArray(formData.selectedOracles)
            ? formData.selectedOracles.join(",")
            : formData.selectedOracles,
          responsibilities: formData.responsiblities,
          skills: formData.skills,
          additional_compensation: formData.additionalCompensation,
          employee_benefits: formData.employeeBenefits,
        });

        // Then create job posting from template
        await apiService.createJobPosting({
          employer_id: employerId,
          template_id: templateResponse.data.id,
          positions_available: parseInt(positionsCount),
          location: formData.jobLocation,
          status: 'active'
        });

        alert(`Success! Created template "${templateName}" and posted ${positionsCount} position(s).`);
      } else {
        // Create job posting directly without template
        await apiService.createJobPosting({
          employer_id: employerId,
          template_id: null,
          title: formData.jobTitle,
          positions_available: parseInt(positionsCount),
          location: formData.jobLocation,
          job_type: formData.JobType,
          location_type: formData.jobLocationType,
          salary: formData.jobPay ? parseFloat(formData.jobPay) : null,
          currency: formData.currency,
          pay_frequency: formData.payFrequency,
          selected_oracles: Array.isArray(formData.selectedOracles)
            ? formData.selectedOracles.join(",")
            : formData.selectedOracles,
          responsibilities: formData.responsiblities,
          skills: formData.skills,
          additional_compensation: formData.additionalCompensation,
          employee_benefits: formData.employeeBenefits,
          company_name: formData.companyName,
          company_description: formData.companyDescription,
          status: 'active'
        });

        alert(`Success! Posted ${positionsCount} position(s) for ${formData.jobTitle}.`);
      }

      onComplete();
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to create job posting: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <JobBasics formData={formData} handleChange={handleChange} />;
      case 2:
        return <EmploymentType formData={formData} handleChange={handleChange} />;
      case 3:
        return <TheJob formData={formData} handleChange={handleChange} />;
      case 4:
        return <Oracles formData={formData} handleChange={handleChange} />;
      case 5:
        return <Responsibilities formData={formData} handleChange={handleChange} />;
      case 6:
        return renderReviewAndDeploy();
      default:
        return <div>Step {step}</div>;
    }
  };

  const renderReviewAndDeploy = () => {
    const additionalCompList = formData.additionalCompensation
      ? formData.additionalCompensation.split(",").filter(Boolean)
      : [];
    const employeeBenefitsList = formData.employeeBenefits
      ? formData.employeeBenefits.split(",").filter(Boolean)
      : [];
    const oracleLabels = {
      manual: "Manual Verification",
      "time-clock": "Badge Scan",
      "ble-beacon": "Bluetooth Beacon",
      gps: "GPS",
      weight: "Scale/Weight",
      image: "Image"
    };
    const selectedOraclesList = Array.isArray(formData.selectedOracles)
      ? formData.selectedOracles
      : (formData.selectedOracles || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    const selectedOracleLabels = selectedOraclesList
      .map((key) => oracleLabels[key] || key)
      .filter(Boolean);
    const skillsList = (formData.skills || "")
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    const responsibilitiesList = (formData.responsiblities || "")
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    return (
      <div className="bg-white rounded-lg p-6">
        {/* Job Header */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-[#0D3B66] mb-4">
            {formData.jobTitle || "Job Title"}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xl text-[#EE964B] font-semibold">
                {formData.companyName || "Company Name"}
              </p>
              <p className="text-lg text-gray-600">
                📍 {formData.jobLocation || "Location"} ({formData.jobLocationType || "Location Type"})
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#0D3B66]">
                {formData.jobPay && formData.currency ? `${formData.currency} ${formData.jobPay}` : "Salary not specified"}
              </p>
              <p className="text-lg text-gray-600">
                {formData.payFrequency ? `per ${formData.payFrequency}` : "Payment frequency not specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-bold text-[#0D3B66] mb-4">Job Details</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-[#EE964B] text-sm">Job Type</h3>
                <p className="text-gray-700">{formData.JobType || "Not specified"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#EE964B] text-sm">Verification Method</h3>
                {selectedOracleLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedOracleLabels.map((label) => (
                      <span key={label} className="inline-block bg-gray-100 px-2 py-1 rounded text-sm">
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700">Not specified</p>
                )}
              </div>
              {additionalCompList.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#EE964B] text-sm">Additional Compensation</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {additionalCompList.map((comp, index) => (
                      <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded text-sm">
                        {comp.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {employeeBenefitsList.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#EE964B] text-sm">Employee Benefits</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {employeeBenefitsList.map((benefit, index) => (
                      <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded text-sm">
                        {benefit.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#0D3B66] mb-4">Requirements</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-[#EE964B] text-sm">Skills Required</h3>
                {skillsList.length > 0 ? (
                  <ul className="text-gray-700 text-sm list-disc list-inside space-y-1">
                    {skillsList.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 text-sm">Not specified</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[#EE964B] text-sm">Responsibilities</h3>
                {responsibilitiesList.length > 0 ? (
                  <ul className="text-gray-700 text-sm list-disc list-inside space-y-1">
                    {responsibilitiesList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 text-sm">Not specified</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Template Options */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-xl font-bold text-[#0D3B66] mb-4">Template Options</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(!e.target.checked)}
              className="w-4 h-4 text-[#EE964B] border-gray-300 rounded focus:ring-[#EE964B]"
            />
            <span className="text-gray-700 font-medium">
              One-time posting (do not save to template library)
            </span>
          </label>

          {saveAsTemplate && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setTemplateNameTouched(true);
                }}
                placeholder="e.g., Sewing Operator, Quality Inspector"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                You'll be able to reuse this template for future job postings
              </p>
            </div>
          )}

          {!saveAsTemplate && (
            <p className="text-sm text-gray-600 mt-2">
              This posting will not be saved for reuse in the template library
            </p>
          )}
        </div>

        {/* Number of Positions */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-bold text-[#0D3B66] mb-4">Positions to Fill</h2>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Positions *
          </label>
          <input
            type="number"
            min="1"
            value={positionsCount}
            onChange={(e) => setPositionsCount(e.target.value)}
            placeholder="How many workers are you hiring?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter 1 for single hire, or 50+ for bulk hiring
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0D3B66]">
          Create New Job
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={step}
        onStepClick={handleStepClick}
        totalSteps={totalSteps}
      />

      {/* Form Content */}
      <div className="mt-6">
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className={`ml-auto px-6 py-2 rounded-lg transition-colors ${
                canProceedToNext()
                  ? "bg-[#0D3B66] text-white hover:bg-[#0a2d4d]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!canProceedToNext()}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className={`ml-auto flex items-center gap-2 px-6 py-2 rounded-lg text-white transition-colors ${
                isSubmitting || !canProceedToNext()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#EE964B] hover:bg-[#d88542]"
              }`}
              disabled={isSubmitting || !canProceedToNext()}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Posting..." : "Post Job(s)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCreationWizard;
