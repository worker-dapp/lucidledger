import React, { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Shield, Clock, UserCheck, CheckCircle } from "lucide-react";
import EmployerLayout from "../components/EmployerLayout";
import apiService from "../services/api";
import { useAuth } from "../hooks/useAuth";

const statusBadge = (contract) => {
  if (contract.status === "completed" || contract.status === "terminated") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3" />
        Resolved
      </span>
    );
  }
  if (contract.mediator_id || contract.mediator) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <UserCheck className="h-3 w-3" />
        Mediator Assigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <Clock className="h-3 w-3" />
      Awaiting Mediator
    </span>
  );
};

const Dispute = () => {
  const { smartWalletAddress } = useAuth();
  const [employerId, setEmployerId] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEmployer = async () => {
      if (!smartWalletAddress) {
        setLoading(false);
        return;
      }
      try {
        const response = await apiService.getEmployerByWallet(smartWalletAddress);
        if (response?.data?.id) {
          setEmployerId(response.data.id);
        }
      } catch (err) {
        console.error("Error fetching employer:", err);
        setError("Unable to load employer profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployer();
  }, [smartWalletAddress]);

  useEffect(() => {
    const fetchDisputes = async () => {
      if (!employerId) return;
      setLoading(true);
      try {
        const response = await apiService.getDeployedContracts(employerId, "disputed");
        setDisputes(response?.data || []);
      } catch (err) {
        console.error("Error fetching disputes:", err);
        setError("Unable to load disputes.");
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, [employerId]);

  const filtered = disputes.filter((d) => {
    const term = search.toLowerCase();
    if (!term) return true;
    const title = d.jobPosting?.title || "";
    const worker = `${d.employee?.first_name || ""} ${d.employee?.last_name || ""}`.trim();
    return title.toLowerCase().includes(term) || worker.toLowerCase().includes(term);
  });

  return (
    <EmployerLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D3B66]">Compliance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track disputed contracts. A neutral mediator will review and resolve each dispute.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search by job title or worker name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 text-sm mb-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
        />

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading disputes...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#0D3B66] mb-1">No disputes</h3>
            <p className="text-sm text-gray-500">
              {search ? "No disputes match your search." : "None of your contracts are currently disputed."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((contract) => {
              const workerName = `${contract.employee?.first_name || ""} ${contract.employee?.last_name || ""}`.trim() || "Unknown Worker";
              return (
                <div
                  key={contract.id}
                  className="p-5 rounded-xl border border-gray-200 bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#0D3B66]">
                        {contract.jobPosting?.title || "Untitled Job"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Worker: {workerName}</p>
                    </div>
                    {statusBadge(contract)}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Payment</p>
                      <p className="text-gray-700">
                        {contract.payment_amount} {contract.payment_currency || "USDC"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Contract</p>
                      <p className="text-gray-700 font-mono text-xs break-all">
                        {contract.contract_address
                          ? `${contract.contract_address.slice(0, 10)}...${contract.contract_address.slice(-6)}`
                          : "--"}
                      </p>
                    </div>
                  </div>

                  {contract.dispute_reason && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                      <p className="text-xs font-medium text-yellow-700">Dispute Reason</p>
                      <p className="text-sm text-yellow-800 mt-0.5">{contract.dispute_reason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EmployerLayout>
  );
};

export default Dispute;
