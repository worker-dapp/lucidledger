import { useState } from "react";
import StepIndicator from "../components/StepIndicator";
import JobBasics from "../Form/JobBasics";
import EmploymentType from "../Form/EmploymentType";
import Responsibilities from "../Form/Responsibilities";
import TheJob from "../Form/TheJob"
import ContractFactory from "../Form/ContractFactory";
import Navbar from "../components/Navbar";
import Oracles from "../Form/Oracles";
import { SubmitJob } from "../components/SubmitJob";

export default function Job() {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState({
    jobTitle: "",
    jobLocationType: "",
    jobLocation: "",
    companyName: "",
    notificationEmail: "",
    referenceCode: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await SubmitJob(formData)
    if(result.success){
      alert("Contract Created")
    }else {
      alert("Failed to save Contract")
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

  return (
    <>
    <Navbar />
    <div className="w-2/3 mx-auto m-10 p-10 bg-white rounded shadow-md">
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
              className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
