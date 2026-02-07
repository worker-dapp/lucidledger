import React from "react";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

const EmployerApprovalBanner = ({ approvalStatus, rejectionReason }) => {
  if (approvalStatus === "approved") {
    return null;
  }

  if (approvalStatus === "pending") {
    return (
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Account Under Review</p>
              <p className="text-sm text-amber-700 mt-1">
                Your employer account is pending approval. You can explore the platform,
                but you won't be able to post jobs until your account is approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (approvalStatus === "rejected") {
    return (
      <div className="bg-red-50 border-b border-red-200">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Account Not Approved</p>
              {rejectionReason && (
                <p className="text-sm text-red-700 mt-1">
                  Reason: {rejectionReason}
                </p>
              )}
              <p className="text-sm text-red-700 mt-2">
                Please{" "}
                <Link
                  to="/employer-profile"
                  className="underline font-medium hover:text-red-800"
                >
                  update your profile
                </Link>{" "}
                to address the issues and resubmit for review.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default EmployerApprovalBanner;
