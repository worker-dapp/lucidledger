import { createContext, useContext } from "react";

// Kept in its own file (not RecruiterLayout.jsx) so the layout module only exports
// a component — required for React Fast Refresh to work on the layout.
export const RecruiterContext = createContext(null);
export const useRecruiter = () => useContext(RecruiterContext);
