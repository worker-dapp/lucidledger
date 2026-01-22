const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { getAuthToken } from "@dynamic-labs/sdk-react-core";

class ApiService {
  // Generic request method
  async request(endpoint, options = {}) {
    // Check if API_BASE_URL is configured
    if (!API_BASE_URL) {
      console.error('VITE_API_BASE_URL is not configured!');
      throw new Error('API base URL is not configured. Please set VITE_API_BASE_URL in your environment variables.');
    }
    
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Making API request to: ${url}`);
    
    // Get the Dynamic JWT token
    const token = getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      console.error('Request URL:', url);
      console.error('Request config:', { 
        method: config.method || 'GET',
        headers: config.headers,
        hasBody: !!config.body 
      });
      
      // Provide more helpful error messages
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(`Unable to connect to the server. Please check if the backend is running and accessible at ${API_BASE_URL}`);
      }
      
      throw error;
    }
  }

  // Employee API methods
  async createEmployee(employeeData) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async getAllEmployees() {
    return this.request('/employees');
  }

  async getEmployeeById(id) {
    return this.request(`/employees/${id}`);
  }

  async getEmployeeByEmail(email) {
    return this.request(`/employees/email/${email}`);
  }

  async getEmployeeByWallet(walletAddress) {
    return this.request(`/employees/wallet/${walletAddress}`);
  }

  async getEmployeeByPhone(phoneNumber) {
    return this.request(`/employees/phone/${phoneNumber}`);
  }

  async updateEmployee(id, employeeData) {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  // Employer API methods
  async createEmployer(employerData) {
    return this.request('/employers', {
      method: 'POST',
      body: JSON.stringify(employerData),
    });
  }

  async getAllEmployers() {
    return this.request('/employers');
  }

  async getEmployerById(id) {
    return this.request(`/employers/${id}`);
  }

  async getEmployerByEmail(email) {
    return this.request(`/employers/email/${email}`);
  }

  async getEmployerByWallet(walletAddress) {
    return this.request(`/employers/wallet/${walletAddress}`);
  }

  async getEmployerByPhone(phoneNumber) {
    return this.request(`/employers/phone/${phoneNumber}`);
  }

  async updateEmployer(id, employerData) {
    return this.request(`/employers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employerData),
    });
  }

  // Contract Template API methods
  async createContractTemplate(templateData) {
    return this.request('/contract-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async getContractTemplates(employerId) {
    return this.request(`/contract-templates?employer_id=${employerId}`);
  }

  async getContractTemplateById(id) {
    return this.request(`/contract-templates/${id}`);
  }

  async updateContractTemplate(id, templateData) {
    return this.request(`/contract-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteContractTemplate(id) {
    return this.request(`/contract-templates/${id}`, {
      method: 'DELETE',
    });
  }

  async incrementTemplateUsage(id) {
    return this.request(`/contract-templates/${id}/use`, {
      method: 'POST',
    });
  }

  // Job Posting API methods
  async createJobPosting(jobPostingData) {
    return this.request('/job-postings', {
      method: 'POST',
      body: JSON.stringify(jobPostingData),
    });
  }

  async getJobPostings(employerId, status = null) {
    const params = status ? `?employer_id=${employerId}&status=${status}` : `?employer_id=${employerId}`;
    return this.request(`/job-postings${params}`);
  }

  async getJobPostingById(id) {
    return this.request(`/job-postings/${id}`);
  }

  async updateJobPosting(id, jobPostingData) {
    return this.request(`/job-postings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobPostingData),
    });
  }

  async deleteJobPosting(id) {
    return this.request(`/job-postings/${id}`, {
      method: 'DELETE',
    });
  }

  async closeJobPosting(id) {
    return this.request(`/job-postings/${id}/close`, {
      method: 'POST',
    });
  }

  async activateJobPosting(id) {
    return this.request(`/job-postings/${id}/activate`, {
      method: 'POST',
    });
  }

  async getActiveJobPostings(employeeId = null) {
    const params = employeeId ? `?employee_id=${employeeId}` : '';
    return this.request(`/job-postings/active${params}`);
  }

  // Deployed Contract API methods
  async createDeployedContract(contractData) {
    return this.request('/deployed-contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  async getDeployedContracts(employerId, status = null) {
    const params = status ? `?employer_id=${employerId}&status=${status}` : `?employer_id=${employerId}`;
    return this.request(`/deployed-contracts${params}`);
  }

  async getDeployedContractById(id) {
    return this.request(`/deployed-contracts/${id}`);
  }

  async getDeployedContractsByEmployee(employeeId, status = null) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/deployed-contracts/employee/${employeeId}${params}`);
  }

  async updateDeployedContractStatus(id, status, updates = {}) {
    return this.request(`/deployed-contracts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...updates }),
    });
  }

  async updateDeployedContract(id, contractData) {
    return this.request(`/deployed-contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contractData),
    });
  }

  async getAllDisputedContracts() {
    return this.request('/deployed-contracts?status=disputed');
  }

  async getDisputedContractsByMediator(mediatorId) {
    return this.request(`/deployed-contracts/mediator/${mediatorId}/disputed`);
  }
  async getDisputedContractsForAdmin() {
    return this.request('/deployed-contracts/disputed');
  }
  async assignMediatorToDeployedContract(contractId, mediatorId) {
    return this.request(`/deployed-contracts/${contractId}/mediator`, {
      method: 'PATCH',
      body: JSON.stringify({ mediator_id: mediatorId }),
    });
  }

  // Oracle Verification API methods
  async createOracleVerification(verificationData) {
    return this.request('/oracle-verifications', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  async getOracleVerifications(contractId) {
    return this.request(`/oracle-verifications?contract_id=${contractId}`);
  }

  async getLatestOracleVerifications(contractId) {
    return this.request(`/oracle-verifications/latest/${contractId}`);
  }

  // Payment Transaction API methods
  async createPaymentTransaction(transactionData) {
    return this.request('/payment-transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async getPaymentTransactions(contractId) {
    return this.request(`/payment-transactions?contract_id=${contractId}`);
  }

  async getPendingPaymentTransactions() {
    return this.request('/payment-transactions/pending');
  }

  // Legacy Job API methods - DEPRECATED, use Job Posting methods instead
  // Kept temporarily for Phase 3 pages that need updating

  // Job Application API methods
  async saveJob(employeeId, jobPostingId) {
    return this.request('/job-applications/save', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, job_posting_id: jobPostingId }),
    });
  }

  async unsaveJob(employeeId, jobPostingId) {
    return this.request('/job-applications/unsave', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, job_posting_id: jobPostingId }),
    });
  }

  async applyToJob(employeeId, jobPostingId) {
    return this.request('/job-applications/apply', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, job_posting_id: jobPostingId }),
    });
  }

  async getSavedJobs(employeeId) {
    return this.request(`/job-applications/saved/${employeeId}`);
  }

  async getAppliedJobs(employeeId) {
    return this.request(`/job-applications/applied/${employeeId}`);
  }

  async updateApplicationStatus(applicationId, status) {
    return this.request(`/job-applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getApplicationsByEmployer(employerId, status = null, jobPostingId = null) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (jobPostingId) params.set('job_posting_id', jobPostingId);
    const query = params.toString();
    return this.request(`/job-applications/employer/${employerId}${query ? `?${query}` : ''}`);
  }

  async bulkUpdateApplicationStatus(applicationIds, status) {
    return this.request('/job-applications/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ application_ids: applicationIds, status }),
    });
  }

  // Mediator API methods
  async checkMediator(email) {
    return this.request(`/mediators/check/${encodeURIComponent(email)}`);
  }

  async updateMediatorWallet(email, walletAddress) {
    return this.request(`/mediators/wallet/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify({ wallet_address: walletAddress }),
    });
  }

  async getActiveMediators() {
    return this.request('/mediators/active');
  }

  // Admin-only mediator management
  async getAllMediators() {
    return this.request('/mediators');
  }

  async createMediator(mediatorData) {
    return this.request('/mediators', {
      method: 'POST',
      body: JSON.stringify(mediatorData),
    });
  }

  async updateMediator(id, mediatorData) {
    return this.request(`/mediators/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mediatorData),
    });
  }

  async deleteMediator(id) {
    return this.request(`/mediators/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '');
    return this.request('/health', { baseURL });
  }
}

export default new ApiService();
