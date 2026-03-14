import { useEffect, useState } from "react";
import { FileText, Search, Loader2 } from "lucide-react";
import { useEmployer } from "../../components/EmployerLayout";
import apiService from "../../services/api";

const ACTION_COLORS = {
  contract_deployed:        "bg-blue-100 text-blue-700",
  application_accepted:     "bg-green-100 text-green-700",
  application_rejected:     "bg-red-100 text-red-700",
  offer_declined:           "bg-orange-100 text-orange-700",
  payment_processed:        "bg-purple-100 text-purple-700",
  dispute_created:          "bg-yellow-100 text-yellow-800",
  dispute_resolved:         "bg-teal-100 text-teal-700",
  qr_clock_in:              "bg-sky-100 text-sky-700",
  qr_clock_out:             "bg-slate-100 text-slate-700",
  nfc_clock_in:             "bg-indigo-100 text-indigo-700",
  nfc_clock_out:            "bg-gray-100 text-gray-600",
};

const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || "https://base-sepolia.blockscout.com";

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatActionLabel = (actionType) =>
  actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const AuditLogTab = () => {
  const { employerId } = useEmployer();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      if (!employerId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = { employer_id: employerId };
        if (actionFilter !== "all") params.action_type = actionFilter;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const response = await apiService.getAuditLog(params);
        setLogs(response?.data || []);
      } catch (error) {
        console.error("Error fetching audit log:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [employerId, actionFilter, startDate, endDate]);

  const filtered = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action_description?.toLowerCase().includes(term) ||
      log.entity_identifier?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by description or entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="py-2 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
        >
          <option value="all">All Actions</option>
          <option value="contract_deployed">Contract Deployed</option>
          <option value="application_accepted">Application Accepted</option>
          <option value="application_rejected">Application Rejected</option>
          <option value="offer_declined">Offer Declined (Worker)</option>
          <option value="payment_processed">Payment Processed</option>
          <option value="dispute_created">Dispute Created</option>
          <option value="dispute_resolved">Dispute Resolved</option>
          <option value="qr_clock_in">QR Clock In</option>
          <option value="qr_clock_out">QR Clock Out</option>
          <option value="nfc_clock_in">NFC Clock In</option>
          <option value="nfc_clock_out">NFC Clock Out</option>
        </select>
      </div>

      {/* Date range */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading audit log...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#0D3B66] mb-1">No entries found</h3>
          <p className="text-sm text-gray-500">
            {searchTerm || actionFilter !== "all" || startDate || endDate
              ? "No log entries match your filters."
              : "Audit log entries will appear here as actions are taken."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ACTION_COLORS[log.action_type] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {formatActionLabel(log.action_type)}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{log.action_description}</p>
                  {log.entity_identifier && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {log.entity_type}: {log.entity_identifier}
                    </p>
                  )}
                  {/* QR clock-in/out tx hash (camelCase, set by oracle enrichment) */}
                  {log.new_value?.txHash && (
                    <a
                      href={`${BASESCAN_URL}/tx/${log.new_value.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#EE964B] hover:underline mt-1 block truncate"
                    >
                      On-chain: {log.new_value.txHash}
                    </a>
                  )}
                  {/* Payment tx hash */}
                  {log.new_value?.tx_hash && (
                    <a
                      href={`${BASESCAN_URL}/tx/${log.new_value.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#EE964B] hover:underline mt-1 block truncate"
                    >
                      On-chain: {log.new_value.tx_hash}
                    </a>
                  )}
                  {/* Contract deployment — link to contract address */}
                  {log.action_type === "contract_deployed" && log.new_value?.contract_address && (
                    <a
                      href={`${BASESCAN_URL}/address/${log.new_value.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#EE964B] hover:underline mt-1 block truncate"
                    >
                      On-chain: {log.new_value.contract_address}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogTab;
