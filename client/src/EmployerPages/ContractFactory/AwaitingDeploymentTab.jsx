import React, { useEffect, useMemo, useState } from "react";
import { Rocket } from "lucide-react";
import apiService from "../../services/api";

const AwaitingDeploymentTab = ({ employerId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState("");

  const fetchSignedApplications = async () => {
    if (!employerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await apiService.getApplicationsByEmployer(employerId, "signed");
      setApplications(response?.data || []);
    } catch (error) {
      setMessage(error.message || "Failed to load signed applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignedApplications();
  }, [employerId]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === applications.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(applications.map((app) => app.id)));
  };

  const createMockAddress = (seed) => {
    const base = BigInt(Date.now() + seed).toString(16);
    const padded = `${base}${seed.toString(16)}`.padStart(40, "0").slice(-40);
    return `0x${padded}`;
  };

  const deploySelected = async () => {
    if (selectedIds.size === 0) {
      setMessage("Select at least one contract to deploy.");
      return;
    }

    setMessage("");
    try {
      for (const application of applications) {
        if (!selectedIds.has(application.id)) {
          continue;
        }
        const job = application.job;
        const employee = application.employee;
        if (!job || !employee) {
          continue;
        }

        await apiService.createDeployedContract({
          job_posting_id: job.id,
          employee_id: employee.id,
          employer_id: job.employer_id,
          contract_address: createMockAddress(application.id),
          payment_amount: Number(job.salary || 0),
          payment_currency: job.currency || "USD",
          payment_frequency: job.pay_frequency || null,
          status: "active",
          selected_oracles: job.selected_oracles || null,
          verification_status: "pending",
        });
      }

      await apiService.bulkUpdateApplicationStatus(Array.from(selectedIds), "deployed");
      setSelectedIds(new Set());
      await fetchSignedApplications();
      setMessage("Contracts moved to Workforce as active deployments (mock).");
    } catch (error) {
      setMessage(error.message || "Failed to deploy contracts.");
    }
  };

  const signedCount = useMemo(() => applications.length, [applications.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        Loading signed contracts...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#0D3B66]">Awaiting Deployment</h2>
          <p className="text-sm text-gray-500">Signed offers ready for blockchain deployment.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Rocket className="h-4 w-4 text-purple-600" />
          {signedCount} signed contracts
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.size === applications.length && applications.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Select all
          </label>
          <span>{selectedIds.size} selected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-medium px-6 py-3">Worker</th>
                <th className="text-left font-medium px-6 py-3">Role</th>
                <th className="text-left font-medium px-6 py-3">Signed</th>
                <th className="text-left font-medium px-6 py-3">Compensation</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const employee = application.employee;
                const job = application.job;
                return (
                  <tr key={application.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(application.id)}
                          onChange={() => toggleSelect(application.id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <div className="font-medium text-[#0D3B66]">
                            {employee?.first_name || "Unknown"} {employee?.last_name || ""}
                          </div>
                          <div className="text-xs text-gray-400">{employee?.email || ""}</div>
                        </div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{job?.title || "--"}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {application.offer_accepted_at
                        ? new Date(application.offer_accepted_at).toLocaleDateString()
                        : "--"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {job?.currency || "USD"} {job?.salary || "--"} / {job?.pay_frequency || "--"}
                    </td>
                  </tr>
                );
              })}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-500">
                    No signed contracts awaiting deployment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-gray-500">
            Deployment is mocked until blockchain integration is available.
          </p>
          <button
            onClick={deploySelected}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            Deploy Selected (Mock)
          </button>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-amber-700">{message}</p>}
    </div>
  );
};

export default AwaitingDeploymentTab;
