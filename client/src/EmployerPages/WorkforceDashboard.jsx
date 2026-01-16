import React, { useEffect, useMemo, useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { CheckCircle, Clock, Search, Users } from "lucide-react";
import EmployerLayout from "../components/EmployerLayout";
import apiService from "../services/api";

const statusStyles = {
  active: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  disputed: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-700",
};

const verificationStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const WorkforceDashboard = () => {
  const { primaryWallet } = useDynamicContext();
  const [employerId, setEmployerId] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [oracleVerifications, setOracleVerifications] = useState([]);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchEmployer = async () => {
      const walletAddress = primaryWallet?.address;

      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.getEmployerByWallet(walletAddress);
        if (response?.data?.id) {
          setEmployerId(response.data.id);
        }
      } catch (error) {
        console.error("Error fetching employer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployer();
  }, [primaryWallet?.address]);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!employerId) {
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const response = await apiService.getDeployedContracts(employerId, statusFilter);
        const data = response?.data || [];
        setContracts(data);
        if (data.length > 0 && !selectedContract) {
          setSelectedContract(data[0]);
        }
      } catch (error) {
        setErrorMessage(error.message || "Failed to load contracts");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [employerId, statusFilter]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedContract?.id) {
        setOracleVerifications([]);
        setPaymentTransactions([]);
        return;
      }

      setDetailLoading(true);
      setActionMessage("");
      try {
        const [oracleResponse, paymentResponse] = await Promise.all([
          apiService.getLatestOracleVerifications(selectedContract.id),
          apiService.getPaymentTransactions(selectedContract.id),
        ]);
        setOracleVerifications(oracleResponse?.data || []);
        setPaymentTransactions(paymentResponse?.data || []);
      } catch (error) {
        setActionMessage(error.message || "Unable to load contract details");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetails();
  }, [selectedContract?.id]);

  const filteredContracts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return contracts;
    }

    return contracts.filter((contract) => {
      const title = contract?.jobPosting?.title || "";
      const employeeName = `${contract?.employee?.first_name || ""} ${contract?.employee?.last_name || ""}`.trim();
      return title.toLowerCase().includes(term) || employeeName.toLowerCase().includes(term);
    });
  }, [contracts, searchTerm]);

  const metrics = useMemo(() => {
    const total = contracts.length;
    const verifiedCount = contracts.filter((c) => c.verification_status === "verified").length;
    const pendingPayments = contracts.filter((c) => c.next_payment_date).length;
    return { total, verifiedCount, pendingPayments };
  }, [contracts]);

  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined) {
      return "--";
    }
    const formatted = Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency || "USD"} ${formatted}`;
  };

  const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString();
  };

  const handleRecordPayment = async (contract) => {
    if (!contract?.id) return;
    setActionMessage("");
    try {
      await apiService.createPaymentTransaction({
        deployed_contract_id: contract.id,
        amount: contract.payment_amount,
        currency: contract.payment_currency,
        payment_type: "regular",
        status: "pending",
      });
      setActionMessage("Payment queued successfully.");
      const paymentResponse = await apiService.getPaymentTransactions(contract.id);
      setPaymentTransactions(paymentResponse?.data || []);
    } catch (error) {
      setActionMessage(error.message || "Failed to queue payment");
    }
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading...</div>
        </div>
      </EmployerLayout>
    );
  }

  if (!employerId) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Employer profile not found.</div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <main className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-[#0D3B66]" />
              <div>
                <p className="text-sm text-gray-500">Active Contracts</p>
                <p className="text-2xl font-semibold text-[#0D3B66]">{metrics.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Verified Workers</p>
                <p className="text-2xl font-semibold text-[#0D3B66]">{metrics.verifiedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Upcoming Payments</p>
                <p className="text-2xl font-semibold text-[#0D3B66]">{metrics.pendingPayments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {["active", "completed", "disputed", "terminated"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  statusFilter === status
                    ? "border-[#EE964B] text-[#EE964B] bg-[#FFF4E6]"
                    : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search worker or job..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0D3B66]">Active Contracts</h2>
                <p className="text-sm text-gray-500">Showing {filteredContracts.length} contracts</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left font-medium px-6 py-3">Worker</th>
                    <th className="text-left font-medium px-6 py-3">Role</th>
                    <th className="text-left font-medium px-6 py-3">Status</th>
                    <th className="text-left font-medium px-6 py-3">Verification</th>
                    <th className="text-left font-medium px-6 py-3">Next Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => {
                    const employeeName = `${contract?.employee?.first_name || ""} ${contract?.employee?.last_name || ""}`.trim();
                    return (
                      <tr
                        key={contract.id}
                        onClick={() => setSelectedContract(contract)}
                        className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedContract?.id === contract.id ? "bg-[#FFF9F2]" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#0D3B66]">
                            {employeeName || "Unknown Worker"}
                          </div>
                          <div className="text-xs text-gray-400">{contract?.employee?.email || ""}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{contract?.jobPosting?.title || "--"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[contract.status] || "bg-gray-100 text-gray-600"}`}>
                            {contract.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${verificationStyles[contract.verification_status] || "bg-gray-100 text-gray-600"}`}>
                            {contract.verification_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatDate(contract.next_payment_date)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredContracts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                        No contracts found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#0D3B66] mb-2">Contract Details</h2>
            {!selectedContract && <p className="text-sm text-gray-500">Select a contract to view details.</p>}
            {selectedContract && (
              <>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="text-xs uppercase text-gray-400">Worker</p>
                    <p className="font-medium text-[#0D3B66]">
                      {`${selectedContract?.employee?.first_name || ""} ${selectedContract?.employee?.last_name || ""}`.trim() || "Unknown Worker"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Role</p>
                    <p>{selectedContract?.jobPosting?.title || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Contract Address</p>
                    <p className="break-all">{selectedContract.contract_address || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Payment</p>
                    <p>{formatCurrency(selectedContract.payment_amount, selectedContract.payment_currency)}</p>
                    <p className="text-xs text-gray-500">{selectedContract.payment_frequency || "--"}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRecordPayment(selectedContract)}
                  className="mt-5 w-full bg-[#EE964B] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#e58a38] transition-colors"
                >
                  Record Payment
                </button>

                {actionMessage && (
                  <div className="mt-3 text-xs text-gray-500">{actionMessage}</div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-[#0D3B66] mb-2">Latest Oracle Checks</h3>
                  {detailLoading && <p className="text-xs text-gray-400">Loading details...</p>}
                  {!detailLoading && oracleVerifications.length === 0 && (
                    <p className="text-xs text-gray-400">No oracle updates yet.</p>
                  )}
                  <div className="space-y-2">
                    {oracleVerifications.map((verification) => (
                      <div key={verification.id} className="flex items-center justify-between text-xs text-gray-600">
                        <span className="capitalize">{verification.oracle_type?.replace("_", " ")}</span>
                        <span>{verification.verification_status || "pending"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-[#0D3B66] mb-2">Payment History</h3>
                  {detailLoading && <p className="text-xs text-gray-400">Loading details...</p>}
                  {!detailLoading && paymentTransactions.length === 0 && (
                    <p className="text-xs text-gray-400">No payments recorded.</p>
                  )}
                  <div className="space-y-2">
                    {paymentTransactions.slice(0, 4).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-xs text-gray-600">
                        <span>{formatCurrency(payment.amount, payment.currency)}</span>
                        <span>{payment.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </EmployerLayout>
  );
};

export default WorkforceDashboard;
