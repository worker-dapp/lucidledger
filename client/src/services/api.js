const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { getAuthToken } from "./authToken";

// Store wallet address for API requests (set by components that have wallet access)
let currentWalletAddress = null;

class ApiService {
  // Set the wallet address for API requests
  setWalletAddress(address) {
    currentWalletAddress = address;
  }

  // Get the current wallet address
  getWalletAddress() {
    return currentWalletAddress;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    // Check if API_BASE_URL is configured
    if (!API_BASE_URL) {
      console.error('VITE_API_BASE_URL is not configured!');
      throw new Error('API base URL is not configured. Please set VITE_API_BASE_URL in your environment variables.');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Making API request to: ${url}`);

    // Get the Privy access token
    const token = await getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(currentWalletAddress ? { 'x-wallet-address': currentWalletAddress } : {}),
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
        } catch {
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

  // Fetch a CSV blob — used for report exports that return text/csv instead of JSON
  async requestCsv(endpoint) {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(currentWalletAddress ? { 'x-wallet-address': currentWalletAddress } : {}),
      },
    });
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    return response.blob();
  }

  // Employee API methods
  async createEmployee(employeeData) {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async getProfileStatus() {
    // Takes no argument: the server resolves identity from the verified auth subject
    // (JWT sub) in the Authorization header. Passing a wallet would be meaningless —
    // the server does not read one — and accepting it would invite the impression that
    // the caller can influence who it is resolved as.
    return this.request('/profile-status');
  }

  // Self-lookup, in the { success, data } shape the old by-wallet / by-email lookups
  // returned, so call sites differ only in the method name. Those lookups took an
  // address or address-shaped argument and are gone (#151): the server would answer
  // them for anyone's profile, not just the caller's. There is no argument here
  // because there is no other profile to ask for.
  async getMyEmployeeProfile() {
    const response = await this.getProfileStatus();
    return { ...response, data: response?.data?.employee ?? null };
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

  // See getMyEmployeeProfile. Admin listing of employers is getAllEmployersForAdmin,
  // which hits the verifyAdmin-gated /admin/employers route.
  async getMyEmployerProfile() {
    const response = await this.getProfileStatus();
    return { ...response, data: response?.data?.employer ?? null };
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

  // No argument: the server derives the employer from the verified caller and ignores
  // any employer_id in the query string (#153).
  async getContractTemplates() {
    return this.request('/contract-templates');
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
    const parts = [];
    if (employerId != null) parts.push(`employer_id=${employerId}`);
    if (status) parts.push(`status=${status}`);
    const params = parts.length ? `?${parts.join('&')}` : '';
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

  async completeContractWithPayment(id, paymentData) {
    return this.request(`/deployed-contracts/${id}/complete-with-payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
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

  async getPaymentTransactionsByEmployee(employeeId) {
    return this.request(`/payment-transactions/employee/${employeeId}`);
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

  async updateApplicationStatus(applicationId, status, extraData = {}) {
    return this.request(`/job-applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extraData }),
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

  async getApplicationsByRecruiter(recruiterId, status = null, jobPostingId = null) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (jobPostingId) params.set('job_posting_id', jobPostingId);
    const query = params.toString();
    return this.request(`/job-applications/recruiter/${recruiterId}${query ? `?${query}` : ''}`);
  }

  async bulkUpdateApplicationStatusAsRecruiter(applicationIds, status, recruiterId) {
    return this.request('/job-applications/recruiter/bulk-status', {
      method: 'POST',
      body: JSON.stringify({
        application_ids: applicationIds,
        status,
        actor_type: 'recruiter',
        actor_id: recruiterId,
      }),
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

  // Dispute History API methods
  async createDisputeRecord(disputeData) {
    return this.request('/dispute-history', {
      method: 'POST',
      body: JSON.stringify(disputeData),
    });
  }

  async getDisputesByEmployer(employerId) {
    return this.request(`/dispute-history/employer/${employerId}`);
  }

  async getDisputesByContract(contractId) {
    return this.request(`/dispute-history/contract/${contractId}`);
  }

  async updateDisputeRecord(id, disputeData) {
    return this.request(`/dispute-history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(disputeData),
    });
  }

  async getAuditLog(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-log${query ? `?${query}` : ''}`);
  }

  async getComplianceOverview(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/overview${query ? `?${query}` : ''}`);
  }

  async exportWorkforceSummary(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.requestCsv(`/reports/workforce-summary${query ? `?${query}` : ''}`);
  }

  async exportPaymentHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.requestCsv(`/reports/payment-history${query ? `?${query}` : ''}`);
  }

  async exportOracleVerifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.requestCsv(`/reports/oracle-verifications${query ? `?${query}` : ''}`);
  }

  async exportDisputeReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.requestCsv(`/reports/dispute-report${query ? `?${query}` : ''}`);
  }

  // -------------------------------------------------------------------------
  // QR Oracle
  // -------------------------------------------------------------------------

  // Worker: generate a QR token for an active contract
  async generateQrToken(contractId) {
    return this.request('/qr-tokens', {
      method: 'POST',
      body: JSON.stringify({ contract_id: contractId }),
    });
  }

  // Worker or employer: fetch presence event history for a contract
  async getPresenceEvents(contractId) {
    return this.request(`/presence-events?contract_id=${contractId}`);
  }

  // Employer: register a kiosk device
  async registerKioskDevice(siteName) {
    return this.request('/kiosk-devices', {
      method: 'POST',
      body: JSON.stringify({ site_name: siteName }),
    });
  }

  // Employer: list registered kiosk devices
  async getKioskDevices() {
    return this.request('/kiosk-devices');
  }

  // Employer: suspend a kiosk device
  async suspendKioskDevice(kioskId) {
    return this.request(`/kiosk-devices/${kioskId}/suspend`, { method: 'PATCH' });
  }

  // Employer: regenerate kiosk device token (invalidates old token)
  async regenerateKioskToken(kioskId) {
    return this.request(`/kiosk-devices/${kioskId}/regenerate-token`, { method: 'POST' });
  }

  // Employer: delete a suspended kiosk device (soft-delete)
  async deleteKioskDevice(kioskId) {
    return this.request(`/kiosk-devices/${kioskId}`, { method: 'DELETE' });
  }

  // Employer: NFC badge management
  async registerNfcBadge(badgeUid, employeeId, label) {
    return this.request('/nfc-badges', {
      method: 'POST',
      body: JSON.stringify({ badge_uid: badgeUid, employee_id: employeeId || null, label: label || null })
    });
  }

  async getNfcBadges() {
    return this.request('/nfc-badges');
  }

  async assignNfcBadge(badgeId, employeeId, label) {
    return this.request(`/nfc-badges/${badgeId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ employee_id: employeeId ?? null, ...(label !== undefined ? { label } : {}) })
    });
  }

  async suspendNfcBadge(badgeId, status = 'suspended') {
    return this.request(`/nfc-badges/${badgeId}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async deleteNfcBadge(badgeId) {
    return this.request(`/nfc-badges/${badgeId}`, { method: 'DELETE' });
  }

  // Health check
  async healthCheck() {
    const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '');
    return this.request('/health', { baseURL });
  }

  // Admin Employer Management
  async getPendingEmployers() {
    return this.request('/admin/employers/pending');
  }

  async getAllEmployersForAdmin(status = null) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/admin/employers${params}`);
  }

  async approveEmployer(id) {
    return this.request(`/admin/employers/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectEmployer(id, reason) {
    return this.request(`/admin/employers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Recruiter Management
  async checkRecruiter(email) {
    return this.request(`/recruiters/check/${encodeURIComponent(email)}`);
  }

  async createRecruiter(data) {
    return this.request('/recruiters', { method: 'POST', body: JSON.stringify(data) });
  }

  async getRecruiterById(id) {
    return this.request(`/recruiters/${id}`);
  }

  async getAllRecruiters(search = '') {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/recruiters${params}`);
  }

  async updateRecruiter(id, data) {
    return this.request(`/recruiters/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async getAssignedJobs(recruiterId) {
    return this.request(`/recruiters/${recruiterId}/assigned-jobs`);
  }

  async assignRecruiter(jobPostingId, recruiterId, feeAmount, feeCurrency = 'USD') {
    return this.request(`/job-postings/${jobPostingId}/recruiter`, {
      method: 'PATCH',
      body: JSON.stringify({ recruiter_id: recruiterId, recruiter_fee_amount: feeAmount, recruiter_fee_currency: feeCurrency }),
    });
  }

  async unassignRecruiter(jobPostingId) {
    return this.request(`/job-postings/${jobPostingId}/recruiter`, {
      method: 'PATCH',
      body: JSON.stringify({ recruiter_id: null }),
    });
  }

  async createRecruiterFeePayment(data) {
    return this.request('/recruiters/fee-payments', { method: 'POST', body: JSON.stringify(data) });
  }

  async getRecruiterFeePayments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/recruiters/fee-payments${query ? `?${query}` : ''}`);
  }
}

export default new ApiService();
