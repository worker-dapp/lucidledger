import React, { useEffect, useState } from "react";
import { Briefcase, Building2, Users, DollarSign, AlertCircle, ExternalLink } from "lucide-react";
import apiService from "../services/api";
import { useRecruiter } from "./RecruiterLayout";
import { getBasescanUrl } from "../contracts/aaClient";

const statusColors = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  closed: "bg-gray-100 text-gray-500",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
};

const RecruiterDashboard = () => {
  const { recruiterId, recruiterData, isLoading: recruiterLoading } = useRecruiter();
  const [jobs, setJobs] = useState([]);
  const [feePayments, setFeePayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!recruiterId) return;
    const fetchJobs = async () => {
      try {
        const response = await apiService.getAssignedJobs(recruiterId);
        setJobs(response?.data ?? []);
      } catch (err) {
        console.error("Error fetching assigned jobs:", err);
        setError("Failed to load assigned jobs.");
      } finally {
        setLoading(false);
      }
    };
    const fetchFeePayments = async () => {
      try {
        const response = await apiService.getRecruiterFeePayments({ recruiter_id: recruiterId });
        const byJobId = {};
        for (const payment of response?.data ?? []) {
          byJobId[payment.job_posting_id] = payment;
        }
        setFeePayments(byJobId);
      } catch (err) {
        console.error("Error fetching fee payments:", err);
      }
    };
    fetchJobs();
    fetchFeePayments();
  }, [recruiterId]);

  if (recruiterLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D3B66]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0D3B66]">
          {recruiterData?.agency_name ? `${recruiterData.agency_name} — ` : ""}Assigned Jobs
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Jobs employers have assigned to you for recruitment.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {jobs.length === 0 && !error ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No jobs assigned yet</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            When an employer assigns a job to you, it will appear here. Share your profile with employers to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-[#0D3B66] truncate">{job.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[job.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {job.status}
                    </span>
                  </div>
                  {job.employer && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                      <Building2 className="h-4 w-4" />
                      <span>{job.employer.company_name || job.employer.email}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{job.positions_available} position{job.positions_available !== 1 ? "s" : ""}</span>
                    </div>
                    {job.application_count > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-600">{job.application_count} application{job.application_count !== 1 ? "s" : ""}</span>
                      </div>
                    )}
                    {job.recruiter_fee_amount && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-green-700 font-medium">
                          {parseFloat(job.recruiter_fee_amount).toLocaleString()} {job.recruiter_fee_currency || "USD"} fee
                        </span>
                        {feePayments[job.id]?.payment_status === "paid" ? (
                          <a
                            href={getBasescanUrl(feePayments[job.id].tx_hash, "tx")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full hover:underline"
                          >
                            Paid <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                            Pending payment
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
