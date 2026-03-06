import React, { createContext, useContext, useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiService from "../services/api";

export const EmployeeContext = createContext(null);
export const useEmployee = () => useContext(EmployeeContext);

// Provides employee data to child pages via context — does NOT render a navbar.
// Used as a layout route in App.jsx; each page manages its own navbar.
const EmployeeLayout = ({ children }) => {
  const { user, smartWalletAddress, primaryWallet } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);

  // Fetch employee profile once — shared with all child pages via EmployeeContext
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!user) return;
      try {
        const userEmail = user?.email?.address || user?.email;
        if (userEmail) {
          const response = await apiService.getEmployeeByEmail(userEmail);
          if (response?.data) { setEmployeeData(response.data); return; }
        }
        const wallet = smartWalletAddress || primaryWallet?.address;
        if (wallet) {
          const response = await apiService.getEmployeeByWallet(wallet);
          if (response?.data) setEmployeeData(response.data);
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
      }
    };

    fetchEmployee();
  }, [user, smartWalletAddress, primaryWallet]);

  return (
    <EmployeeContext.Provider value={{ employeeData, employeeId: employeeData?.id ?? null }}>
      {children ?? <Outlet />}
    </EmployeeContext.Provider>
  );
};

export default EmployeeLayout;
