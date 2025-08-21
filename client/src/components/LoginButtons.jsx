import React from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const LoginButtons = ({ variant = "both", storageKey = "userRole" }) => {
  const { setShowAuthFlow } = useDynamicContext();

  const handleEmployeeLogin = () => {
    localStorage.setItem(storageKey, "employee");
    setShowAuthFlow(true);
  };

  const handleEmployerLogin = () => {
    localStorage.setItem(storageKey, "employer");
    setShowAuthFlow(true);
  };

  if (variant === "employee") {
    return (
      <button
        type="button"
        onClick={handleEmployeeLogin}
        className="w-full font-medium p-4 mt-2 border border-[#EE964B] text-[#EE964B] rounded-xl hover:bg-[#fff4ec]"
      >
        Continue with Social / Wallet (Employee)
      </button>
    );
  }

  if (variant === "employer") {
    return (
      <button
        type="button"
        onClick={handleEmployerLogin}
        className="w-full font-medium p-4 mt-2 border border-[#EE964B] text-[#EE964B] rounded-xl hover:bg-[#fff4ec]"
      >
        Continue with Social / Wallet (Employer)
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleEmployeeLogin}
        className="w-full font-medium p-4 mt-2 border border-[#EE964B] text-[#EE964B] rounded-xl hover:bg-[#fff4ec]"
      >
        Login as Employee
      </button>
      <button
        type="button"
        onClick={handleEmployerLogin}
        className="w-full font-medium p-4 mt-2 border border-[#EE964B] text-[#EE964B] rounded-xl hover:bg-[#fff4ec]"
      >
        Login as Employer
      </button>
    </div>
  );
};

export default LoginButtons;


