import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Clock, XCircle, AlertTriangle } from "lucide-react";
import StepIndicator from "../components/StepIndicator";
import JobBasics from "../Form/JobBasics";
import EmploymentType from "../Form/EmploymentType";
import Responsibilities from "../Form/Responsibilities";
import TheJob from "../Form/TheJob";
import ContractFactory from "../Form/ContractFactory";
import EmployerLayout from "../components/EmployerLayout";
import Oracles from "../Form/Oracles";
import { SubmitJob } from "../components/SubmitJob";
import apiService from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function Job() {
  const { user, smartWalletAddress } = useAuth();
  const navigate = useNavigate();
  const [employerId, setEmployerId] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(null);
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [hasPrefilledData, setHasPrefilledData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validation functions for each step
  const validateStep1 = () => {
    return formData.companyName && formData.jobTitle;
  };

  const validateStep2 = () => {
    return formData.jobLocationType && formData.jobLocation;
  };

  const validateStep3 = () => {
    return formData.JobType && formData.jobPay;
  };

  const validateStep4 = () => {
    return formData.selectedOracles;
  };

  const validateStep5 = () => {
    return formData.responsiblities && formData.skills;
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1: return validateStep1();
      case 2: return validateStep2();
      case 3: return validateStep3();
      case 4: return validateStep4();
      case 5: return validateStep5();
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < totalSteps && canProceedToNext()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Fetch employer info once and prefill the form with existing data
  useEffect(() => {
    const fetchEmployerData = async () => {
      if (hasPrefilledData) return;

      try {
        let employerResponse = null;

        if (smartWalletAddress) {
          employerResponse = await apiService.getEmployerByWallet(smartWalletAddress);
        }

        if ((!employerResponse || !employerResponse.data) && user?.email?.address) {
          employerResponse = await apiService.getEmployerByEmail(user.email.address);
        }

        if (employerResponse?.data) {
          const employer = employerResponse.data;

          if (employer.id) {
            setEmployerId(employer.id);
          }

          // Set approval status
          setApprovalStatus(employer.approval_status);
          setRejectionReason(employer.rejection_reason);

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

    if (smartWalletAddress || user?.email?.address) {
      fetchEmployerData();
    }
  }, [smartWalletAddress, user?.email?.address, hasPrefilledData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!employerId) {
      alert("Please wait, loading employer information...");
      return;
    }

    setIsSubmitting(true);

    // Use employer_id directly from database
    const result = await SubmitJob(formData, employerId);

    // Show loading state for 1 second before redirect
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);

    if (result.success) {
      alert("Contract Created");
      navigate("/view-open-contracts");
    } else {
      alert("Failed to save Contract");
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
        return <Oracles formData={formData} handleChange={handleChange} />
      case 5:
        return <Responsibilities formData={formData} handleChange={handleChange} />;
      case 6:
        return <ContractFactory formData={formData} handleChange={handleChange} />;
      default:
        return <div>Step {step}</div>;
    }
  };

  // Show blocking overlay if not approved
  if (approvalStatus && approvalStatus !== 'approved') {
    return (
      <EmployerLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            {approvalStatus === 'pending' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Account Pending Approval
                </h2>
                <p className="text-gray-600 mb-6">
                  Your employer account is currently under review. You'll be able to create
                  job postings once your account has been approved by our team.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Account Not Approved
                </h2>
                {rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                    <p className="text-sm font-medium text-red-800">Reason:</p>
                    <p className="text-sm text-red-700 mt-1">{rejectionReason}</p>
                  </div>
                )}
                <p className="text-gray-600 mb-6">
                  Please update your profile to address the issues and your account will be
                  automatically resubmitted for review.
                </p>
              </>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/employer-profile"
                className="px-6 py-2 bg-[#0D3B66] text-white rounded-lg hover:bg-[#0a2d4d] transition-colors"
              >
                {approvalStatus === 'rejected' ? 'Update Profile' : 'View Profile'}
              </Link>
              <Link
                to="/contract-factory"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
    <div className="max-w-4xl mx-auto p-10 bg-white rounded shadow-md">
      <StepIndicator
        currentStep={step}
        onStepClick={setStep}
        totalSteps={totalSteps}
      />

      {/* Remove the form wrapper to prevent premature submission */}
      <div>
        {renderStep()}

        <div className="flex justify-between mt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className={`ml-auto px-4 py-2 rounded ${
                canProceedToNext()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!canProceedToNext()}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className={`ml-auto px-4 py-2 rounded text-white ${
                isSubmitting
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
    </EmployerLayout>
  );
}
