
import apiService from '../services/api';

export async function SubmitJob(formData) {
  try {
    const jobData = {
      title: formData.jobTitle,
      location_type: formData.jobLocationType,
      location: formData.jobLocation,
      company_name: formData.companyName,
      notification_email: formData.notificationEmail,
      reference_code: formData.referenceCode,
      job_type: formData.JobType,
      salary: formData.jobPay,
      currency: formData.currency,
      pay_frequency: formData.payFrequency,
      additional_compensation: formData.additionalCompensation,
      employee_benefits: formData.employeeBenefits,
      description: formData.summary,
      selected_oracles: Array.isArray(formData.selectedOracles)
        ? formData.selectedOracles.join(",")
        : formData.selectedOracles,
      verification_notes: formData.verificationNotes,
      responsibilities: formData.responsiblities,
      skills: formData.skills,
      associated_skills: formData.associatedSkills,
      company_description: formData.companyDescription,
      status: 'draft'
    };

    // Submit job to API
    const response = await apiService.createJob(jobData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error submitting job:", error);
    return { success: false, error: error.message };
  }
}
