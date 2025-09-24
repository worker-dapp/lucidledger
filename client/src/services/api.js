const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiService {
  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
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

  async getAllJobs() {
    return this.request('/jobs');
  }

  async getJobById(id) {
    return this.request(`/jobs/${id}`);
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

  // Health check
  async healthCheck() {
    const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '');
    return this.request('/health', { baseURL });
  }
}

export default new ApiService();
