import React from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useNavigate } from "react-router-dom";

const LogoutButton = ({ className = "", children = "Log out" }) => {
  const { handleLogOut } = useDynamicContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await handleLogOut();
    navigate("/");
  };

  return (
    <button onClick={handleLogout} className={className}>
      {children}
    </button>
  );
};

export default LogoutButton;


