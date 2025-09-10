import apiClient from './apiClient';

class ApiService {
  // Jobs
  async getJobs() {
    try {
      const response = await apiClient.request('/api/jobs', { method: 'GET' });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createJob(jobData) {
    try {
      const response = await apiClient.request('/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getJobById(id) {
    try {
      const response = await apiClient.request(`/api/jobs/${id}`, { method: 'GET' });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Contracts
  async getContracts() {
    try {
      const response = await apiClient.request('/api/contracts', { method: 'GET' });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createContract(contractData) {
    try {
      const response = await apiClient.request('/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateContract(id, updateData) {
    try {
      const response = await apiClient.request(`/api/contracts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Applications
  async getApplications() {
    try {
      const response = await apiClient.request('/api/applications', { method: 'GET' });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createApplication(applicationData) {
    try {
      const response = await apiClient.request('/api/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData),
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Notifications
  async getNotifications() {
    try {
      const response = await apiClient.request('/api/notifications', { method: 'GET' });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createNotification(notificationData) {
    try {
      const response = await apiClient.request('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async deleteNotification(id) {
    try {
      const response = await apiClient.request(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Users/Profiles (only update supported client-side)
  async updateUserProfile(profileData) {
    try {
      const response = await apiClient.request('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Payments
  async getPayments() {
    try {
      const response = await apiClient.request('/api/payments', { method: 'GET' });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createPayment(paymentData) {
    try {
      const response = await apiClient.request('/api/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Disputes
  async getDisputes() {
    try {
      const response = await apiClient.request('/api/disputes', { method: 'GET' });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createDispute(disputeData) {
    try {
      const response = await apiClient.request('/api/disputes', {
        method: 'POST',
        body: JSON.stringify(disputeData),
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Wallets
  async getWallet() {
    try {
      const response = await apiClient.request('/api/wallets', { method: 'GET' });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateWallet(walletData) {
    try {
      const response = await apiClient.request('/api/wallets', {
        method: 'PUT',
        body: JSON.stringify(walletData),
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export default new ApiService(); 