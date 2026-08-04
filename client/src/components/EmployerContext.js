import { createContext, useContext } from "react";

// Kept in its own file (not EmployerLayout.jsx) so the layout module only exports
// a component — required for React Fast Refresh to work on the layout.
export const EmployerContext = createContext(null);
export const useEmployer = () => useContext(EmployerContext);
