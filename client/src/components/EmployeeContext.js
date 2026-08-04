import { createContext, useContext } from "react";

// Kept in its own file (not EmployeeLayout.jsx) so the layout module only exports
// a component — required for React Fast Refresh to work on the layout.
export const EmployeeContext = createContext(null);
export const useEmployee = () => useContext(EmployeeContext);
