import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiService from "../services/api";
import { EmployeeContext } from "./EmployeeContext";

// Provides employee data to child pages via context — does NOT render a navbar.
// Used as a layout route in App.jsx; each page manages its own navbar.
const EmployeeLayout = ({ children }) => {
  const { user } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = React.useRef(false);

  // Fetch employee profile once — shared with all child pages via EmployeeContext.
  // The server resolves which profile from the verified token, so this no longer waits
  // on a wallet or an email to try as a lookup key; isFetchingRef still guards against
  // a second run overlapping the first.
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user) return;
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);
      try {
        const response = await apiService.getMyEmployeeProfile();
        if (response?.data) setEmployeeData(response.data);
      } catch (err) {
        console.error("Error fetching employee data:", err);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchEmployee();
  }, [user]);

  return (
    <EmployeeContext.Provider value={{ employeeData, employeeId: employeeData?.id ?? null, isLoading }}>
      {children ?? <Outlet />}
    </EmployeeContext.Provider>
  );
};

export default EmployeeLayout;
