import React from "react";
import { Users, ArrowRight } from "lucide-react";

const ApplicationReviewTab = ({ employerId }) => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <Users className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Application Review - Coming Soon
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Review and accept applications from job seekers. This feature will allow you to:
      </p>
      <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700 mb-6">
        <li className="flex items-start gap-2">
          <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5" />
          <span>View all applicants for each job posting</span>
        </li>
        <li className="flex items-start gap-2">
          <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5" />
          <span>Review applicant profiles and credentials</span>
        </li>
        <li className="flex items-start gap-2">
          <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5" />
          <span>Accept or reject applications in bulk</span>
        </li>
        <li className="flex items-start gap-2">
          <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5" />
          <span>Send offer letters to accepted candidates</span>
        </li>
      </ul>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> For now, use the existing "Review Applications" page from the employer dashboard.
        </p>
      </div>
    </div>
  );
};

export default ApplicationReviewTab;
