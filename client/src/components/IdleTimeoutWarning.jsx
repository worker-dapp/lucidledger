import React from "react";
import { Clock, LogOut } from "lucide-react";

const IdleTimeoutWarning = ({ onStayLoggedIn, onLogOut }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-xl">
        <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Session Expiring
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          You've been inactive for a while. You'll be logged out soon for security.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onStayLoggedIn}
            className="w-full px-4 py-2.5 bg-[#0D3B66] text-white rounded-lg font-medium hover:bg-[#0a2d4d] transition-colors"
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdleTimeoutWarning;
