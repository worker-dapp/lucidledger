import React from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const LogoutButton = ({ className = "", children = "Log out" }) => {
  const { handleLogOut } = useDynamicContext();

  return (
    <button onClick={() => handleLogOut()} className={className}>
      {children}
    </button>
  );
};

export default LogoutButton;


