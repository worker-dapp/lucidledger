import React from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const LoginButtons = ({ variant = "both", storageKey = "userRole" }) => {
  const { setShowAuthFlow, openModal } = useDynamicContext();

  const handleEmployeeLogin = () => {
    localStorage.setItem(storageKey, "employee");
    // immediately open auth flow (provider no longer remounts)
    setShowAuthFlow?.(true);
    openModal?.();
  };

  const handleEmployerLogin = () => {
    localStorage.setItem(storageKey, "employer");
    setShowAuthFlow?.(true);
    openModal?.();
  };

  if (variant === "employee") {
    return (
      <button
        type="button"
        onClick={handleEmployeeLogin}
        className="mt-6 bg-[#0d3b66] text-white font-medium px-6 py-3 rounded-lg w-full transition-all hover:bg-[#1a5a95] hover:shadow-lg cursor-pointer"
      >
        Find a Job →
      </button>
    );
  }

  if (variant === "employer") {
    return (
      <button
        type="button"
        onClick={handleEmployerLogin}
        className="mt-6 bg-[#0d3b66] text-white font-medium px-6 py-3 rounded-lg w-full transition-all hover:bg-[#1a5a95] hover:shadow-lg cursor-pointer"
      >
        Create a Contract →
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleEmployeeLogin}
        className="mt-6 bg-[#0d3b66] text-white font-medium px-6 py-3 rounded-lg w-full transition-all hover:bg-[#1a5a95] hover:shadow-lg cursor-pointer"
      >
        Login as Employee
      </button>
      <button
        type="button"
        onClick={handleEmployerLogin}
        className="mt-2 bg-[#0d3b66] text-white font-medium px-6 py-3 rounded-lg w-full transition-all hover:bg-[#1a5a95] hover:shadow-lg cursor-pointer"
      >
        Login as Employer
      </button>
    </div>
  );
};

export default LoginButtons;

