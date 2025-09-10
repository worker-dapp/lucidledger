import apiClient from './apiClient';

// Employer/Employee profiles
export const createEmployer = async (profile) => {
  try {
    const { data } = await apiClient.request('/api/employers', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateEmployer = async (id, profile) => {
  try {
    const { data } = await apiClient.request(`/api/employers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const createEmployee = async (profile) => {
  try {
    const { data } = await apiClient.request('/api/employees', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateEmployee = async (id, profile) => {
  try {
    const { data } = await apiClient.request(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Jobs
export const getJobs = async () => {
  try {
    const { data } = await apiClient.request('/api/jobs', { method: 'GET' });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const createJob = async (jobData) => {
  try {
    const { data } = await apiClient.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getJobById = async (id) => {
  try {
    const { data } = await apiClient.request(`/api/jobs/${id}`, { method: 'GET' });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Contracts
export const getContracts = async () => {
  try {
    const { data } = await apiClient.request('/api/contracts', { method: 'GET' });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const createContract = async (contractData) => {
  try {
    const { data } = await apiClient.request('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateContract = async (id, updateData) => {
  try {
    const { data } = await apiClient.request(`/api/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Applications
export const getApplications = async () => {
  try {
    const { data } = await apiClient.request('/api/applications', { method: 'GET' });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const createApplication = async (applicationData) => {
  try {
    const { data } = await apiClient.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Notifications
export const getNotifications = async () => {
  try {
    const { data } = await apiClient.request('/api/notifications', { method: 'GET' });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const createNotification = async (notificationData) => {
  try {
    const { data } = await apiClient.request('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteNotification = async (id) => {
  try {
    const { data } = await apiClient.request(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Payments
export const getPayments = async () => {
  try {
    const { data } = await apiClient.request('/api/payments', { method: 'GET' });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const createPayment = async (paymentData) => {
  try {
    const { data } = await apiClient.request('/api/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Disputes
export const getDisputes = async () => {
  try {
    const { data } = await apiClient.request('/api/disputes', { method: 'GET' });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const createDispute = async (disputeData) => {
  try {
    const { data } = await apiClient.request('/api/disputes', {
      method: 'POST',
      body: JSON.stringify(disputeData),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Wallets
export const getWallet = async () => {
  try {
    const { data } = await apiClient.request('/api/wallets', { method: 'GET' });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateWallet = async (walletData) => {
  try {
    const { data } = await apiClient.request('/api/wallets', {
      method: 'PUT',
      body: JSON.stringify(walletData),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Default export for compatibility (object with all functions)
const apiService = {
  createEmployer,
  updateEmployer,
  createEmployee,
  updateEmployee,
  getJobs,
  createJob,
  getJobById,
  getContracts,
  createContract,
  updateContract,
  getApplications,
  createApplication,
  getNotifications,
  createNotification,
  deleteNotification,
  getPayments,
  createPayment,
  getDisputes,
  createDispute,
  getWallet,
  updateWallet,
};

export default apiService;