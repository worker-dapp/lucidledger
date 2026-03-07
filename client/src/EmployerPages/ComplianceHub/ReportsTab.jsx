import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { useEmployer } from "../../components/EmployerLayout";
import apiService from "../../services/api";

const REPORTS = [
  {
    id: "workforce",
    title: "Workforce Summary",
    description: "Complete list of all workers, contracts, and verification status.",
    includes: "Worker names, job titles, contract addresses, payment details, verification status, Basescan links",
    exportFn: (params) => apiService.exportWorkforceSummary(params),
    filename: (date) => `workforce_summary_${date}.csv`,
  },
  {
    id: "payments",
    title: "Payment History",
    description: "All payments processed with blockchain transaction references.",
    includes: "Worker names, amounts, currencies, transaction hashes, Basescan links, payment dates",
    exportFn: (params) => apiService.exportPaymentHistory(params),
    filename: (date) => `payment_history_${date}.csv`,
  },
  {
    id: "oracles",
    title: "Oracle Verifications",
    description: "GPS check-ins, time clock logs, and all verification records.",
    includes: "Oracle types, verification status, GPS coordinates, hours worked, timestamps, contract links",
    exportFn: (params) => apiService.exportOracleVerifications(params),
    filename: (date) => `oracle_verifications_${date}.csv`,
  },
];

const ReportsTab = () => {
  const { employerId } = useEmployer();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState("");

  const handleDownload = async (report) => {
    if (!employerId) return;
    setDownloading(report.id);
    setError("");
    try {
      const params = { employer_id: employerId };
      if (startDate) params.start_date = startDate;
      if (endDate)   params.end_date   = endDate;

      const blob = await report.exportFn(params);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = report.filename(new Date().toISOString().split("T")[0]);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error downloading ${report.id} report:`, err);
      setError(`Failed to download ${report.title}. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#0D3B66] mb-1">Generate Compliance Reports</h2>
        <p className="text-sm text-gray-500">
          Export data for brand audits and compliance verification. All CSV files include
          Basescan links for on-chain verification.
        </p>
      </div>

      {/* Date range filter */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Date Range (optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Report cards */}
      <div className="space-y-4">
        {REPORTS.map((report) => (
          <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-5 w-5 text-[#0D3B66]" />
                  <h3 className="text-base font-semibold text-[#0D3B66]">{report.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                <p className="text-xs text-gray-400">
                  <span className="font-medium text-gray-500">Includes:</span> {report.includes}
                </p>
              </div>
              <button
                onClick={() => handleDownload(report)}
                disabled={!employerId || downloading === report.id}
                className="shrink-0 flex items-center gap-2 bg-[#EE964B] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d97b33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading === report.id ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Downloading...</>
                ) : (
                  <><Download className="h-4 w-4" /> Download CSV</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsTab;
