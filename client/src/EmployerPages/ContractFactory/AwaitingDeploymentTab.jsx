import React from "react";
import { Rocket, ArrowRight } from "lucide-react";

const AwaitingDeploymentTab = ({ employerId }) => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
        <Rocket className="h-8 w-8 text-purple-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Blockchain Deployment - Coming Soon
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Deploy accepted contracts to the blockchain. This feature will allow you to:
      </p>
      <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700 mb-6">
        <li className="flex items-start gap-2">
          <ArrowRight className="h-5 w-5 text-purple-600 mt-0.5" />
          <span>View all contracts awaiting blockchain deployment</span>
        </li>
        <li className="flex items-start gap-2">
          <ArrowRight className="h-5 w-5 text-purple-600 mt-0.5" />
          <span>Deploy multiple contracts in a single batch transaction</span>
        </li>
        <li className="flex items-start gap-2">
          <ArrowRight className="h-5 w-5 text-purple-600 mt-0.5" />
          <span>Save on gas fees with optimized batch deployment</span>
        </li>
        <li className="flex items-start gap-2">
          <ArrowRight className="h-5 w-5 text-purple-600 mt-0.5" />
          <span>Track deployment status and confirmation</span>
        </li>
      </ul>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Batch blockchain deployment will be implemented in Phase 2 of the Contract Factory roadmap.
        </p>
      </div>
    </div>
  );
};

export default AwaitingDeploymentTab;
