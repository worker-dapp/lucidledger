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

  async updateEmployer(id, employerData) {
    return this.request(`/employers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employerData),
    });
  }

  // Job API methods
  async createJob(jobData) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async getAllJobs(employeeId = null) {
    const params = employeeId ? `?employee_id=${employeeId}` : '';
    return this.request(`/jobs${params}`);
  }

  async getJobById(id) {
    return this.request(`/jobs/${id}`);
  }

  async getJobsByEmployer(employerId) {
    return this.request(`/jobs/employer/${employerId}`);
  }

  async getJobsWithApplicationsByEmployer(employerId) {
    return this.request(`/jobs/employer/${employerId}/applications`);
  }

  async getJobApplications(jobId) {
    return this.request(`/jobs/${jobId}/applications`);
  }

  async getJobsByStatus(status) {
    return this.request(`/jobs/status/${status}`);
  }

  async getJobsByCompany(companyName) {
    return this.request(`/jobs/company/${companyName}`);
  }

  async updateJob(id, jobData) {
    return this.request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async updateJobStatus(id, status) {
    return this.request(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Job Application API methods
  async saveJob(employeeId, jobId) {
    return this.request('/job-applications/save', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, job_id: jobId }),
    });
  }

  async unsaveJob(employeeId, jobId) {
    return this.request('/job-applications/unsave', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, job_id: jobId }),
    });
  }

  async applyToJob(employeeId, jobId) {
    return this.request('/job-applications/apply', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, job_id: jobId }),
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

  // Health check
  async healthCheck() {
    const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '');
    return this.request('/health', { baseURL });
  }
}

export default new ApiService();
