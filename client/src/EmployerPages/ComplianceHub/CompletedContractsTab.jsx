import { useEffect, useState } from "react";
import { CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { useEmployer } from "../../components/EmployerLayout";
import apiService from "../../services/api";

const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || "https://base-sepolia.blockscout.com";

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const CompletedContractsTab = () => {
  const { employerId } = useEmployer();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchContracts = async () => {
      if (!employerId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await apiService.getDeployedContracts(employerId, "completed");
        setContracts(response?.data || []);
      } catch (error) {
        console.error("Error fetching completed contracts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [employerId]);

  const filtered = contracts.filter((c) => {
    const term = search.toLowerCase();
    if (term) {
      const title = c.jobPosting?.title || "";
      const worker = `${c.employee?.first_name || ""} ${c.employee?.last_name || ""}`.trim();
      if (!title.toLowerCase().includes(term) && !worker.toLowerCase().includes(term)) return false;
    }
    if (startDate && new Date(c.updated_at) < new Date(startDate)) return false;
    if (endDate && new Date(c.updated_at) > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading completed contracts...
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-[#0D3B66] mb-1">No completed contracts</h3>
        <p className="text-sm text-gray-500">Completed contracts will appear here for your records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by job title or worker name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
        />
        {(search || startDate || endDate) && (
          <button
            onClick={() => { setSearch(""); setStartDate(""); setEndDate(""); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No contracts match your filters.</p>
        </div>
      ) : filtered.map((contract) => {
        const worker = `${contract.employee?.first_name || ""} ${contract.employee?.last_name || ""}`.trim() || "—";
        const isMock = contract.contract_address?.startsWith("0x000000");

        return (
          <div
            key={contract.id}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#0D3B66]">
                  {contract.jobPosting?.title || "—"}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Worker: {worker}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 shrink-0">
                <CheckCircle className="h-3 w-3" />
                Completed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Payment</p>
                <p className="text-gray-700 font-medium">
                  {contract.payment_amount} {contract.payment_currency || "USDC"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Job Type</p>
                <p className="text-gray-700">{contract.jobPosting?.job_type || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-gray-700">{contract.jobPosting?.location || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Completed</p>
                <p className="text-gray-700">{formatDate(contract.updated_at)}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Contract Address</p>
              {isMock ? (
                <p className="text-xs text-gray-400 italic">Mock contract (not on-chain)</p>
              ) : (
                <a
                  href={`${BASESCAN_URL}/address/${contract.contract_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-blue-600 hover:text-blue-800"
                >
                  {contract.contract_address}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default CompletedContractsTab;
