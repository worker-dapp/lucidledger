import { useEffect, useState } from "react";
import {
  CheckCircle, AlertTriangle, Users, DollarSign,
  Shield, Clock, Loader2, LayoutDashboard
} from "lucide-react";
import { useEmployer } from "../../components/EmployerLayout";
import apiService from "../../services/api";

const StatCard = ({ label, value, sub, icon: Icon, color = "text-[#0D3B66]" }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value ?? "—"}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      {Icon && <Icon className="h-5 w-5 text-gray-300" />}
    </div>
  </div>
);

const StatusBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 capitalize">{label}</span>
        <span className="font-medium text-gray-700">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const CONTRACT_STATUS_COLORS = {
  active:     "bg-blue-400",
  completed:  "bg-green-400",
  disputed:   "bg-yellow-400",
  terminated: "bg-gray-400",
};

const OverviewTab = () => {
  const { employerId } = useEmployer();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchOverview = async () => {
      if (!employerId) { setLoading(false); return; }
      setLoading(true);
      try {
        const params = { employer_id: employerId };
        if (startDate) params.start_date = startDate;
        if (endDate)   params.end_date   = endDate;
        const response = await apiService.getComplianceOverview(params);
        setData(response);
      } catch (error) {
        console.error("Error fetching compliance overview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [employerId, startDate, endDate]);

  return (
    <div>
      {/* Date range filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
          />
        </div>
        {(startDate || endDate) && (
          <div className="flex items-end pb-0.5">
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading overview...
        </div>
      ) : !data ? (
        <div className="text-center py-16">
          <LayoutDashboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No data available yet.</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Top stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Contracts"
              value={data.contracts.total}
              sub={`${data.contracts.active} active`}
              icon={CheckCircle}
            />
            <StatCard
              label="USDC Paid Out"
              value={`${parseFloat(data.payments.total_usdc).toLocaleString()} USDC`}
              sub={`${data.payments.payment_count} payments`}
              icon={DollarSign}
              color="text-green-600"
            />
            <StatCard
              label="Unique Workers"
              value={data.workers.total_unique}
              sub={`${data.workers.repeat_workers} repeat workers`}
              icon={Users}
            />
            <StatCard
              label="Dispute Rate"
              value={`${data.contracts.dispute_rate}%`}
              sub={`${data.disputes.total} total disputes`}
              icon={AlertTriangle}
              color={parseFloat(data.contracts.dispute_rate) > 10 ? "text-red-600" : "text-[#0D3B66]"}
            />
          </div>

          {/* Contract health breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-[#0D3B66] mb-4">Contract Health</h3>
            <div className="space-y-3">
              {Object.entries(CONTRACT_STATUS_COLORS).map(([status, color]) => (
                <StatusBar
                  key={status}
                  label={status}
                  count={data.contracts[status] || 0}
                  total={data.contracts.total}
                  color={color}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dispute summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-[#0D3B66]" />
                <h3 className="text-sm font-semibold text-[#0D3B66]">Dispute Summary</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total disputes</span>
                  <span className="font-medium">{data.disputes.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved</span>
                  <span className="font-medium text-green-600">{data.disputes.resolved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pending</span>
                  <span className={`font-medium ${data.disputes.pending > 0 ? "text-yellow-600" : ""}`}>
                    {data.disputes.pending}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Avg resolution
                  </span>
                  <span className="font-medium">
                    {data.disputes.avg_resolution_days != null
                      ? `${data.disputes.avg_resolution_days} days`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Oracle verification */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 text-[#0D3B66]" />
                <h3 className="text-sm font-semibold text-[#0D3B66]">Oracle Verifications</h3>
              </div>
              {data.oracles.total === 0 ? (
                <p className="text-sm text-gray-400">No oracle verifications recorded yet.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total checks</span>
                    <span className="font-medium">{data.oracles.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Verified</span>
                    <span className="font-medium text-green-600">{data.oracles.verified}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3">
                    <span className="text-gray-500">Pass rate</span>
                    <span className={`font-bold text-base ${
                      parseFloat(data.oracles.pass_rate) >= 90
                        ? "text-green-600"
                        : parseFloat(data.oracles.pass_rate) >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}>
                      {data.oracles.pass_rate}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default OverviewTab;
