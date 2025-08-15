import { Routes, Route } from "react-router-dom";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import LandingPage from "./pages/LandingPage";
import EmployeeRegister from "./EmployeePages/EmployeeRegister";
import EmployerRegister from "./pages/EmployerRegister";
import EmployeeLogIn from "./EmployeePages/EmployeeLogIn";
import EmployerLogIn from "./pages/EmployerLogIn";
import AboutPage from "./pages/NewAbout";
import EmployeeDashboard from "./EmployeePages/EmployeeDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import Dispute from "./pages/Dispute";
import Payments from "./pages/Payments";
import JobDetails from "./pages/JobDetails";
import MyJobs from "./pages/MyJobs";
import MyJobDetails from "./pages/MyJobDetails";
import EmployerProfile from "./pages/EmployerProfile";
import EmployeeProfile from "./EmployeePages/EmployeeProfile";
import EmployerJobPortal from "./pages/EmployerJobPortal";
import ViewOpenContracts from "./pages/ViewOpenContracts";
import DAODashboard from "./pages/DAODashboard";
import ReviewCompletedContracts from "./pages/ReviewCompletedContracts";
import ReviewApplications from "./pages/ReviewApplications";
import Job from "./pages/Job";
import EmployeeJobsPage from "./EmployeePages/EmployeeJobsPage";
import { AuthProvider } from "./api/AuthContext";
// import ReviewCompletedContracts from "./pages/ReviewCompletedContracts";

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: "bb03ee6d-6f22-4d73-b630-439914bf6b18",
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <div>
        <AuthProvider>
        <Routes>
          <Route path="*" element={<h1>404 - Not Found</h1>} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/employeeRegister" element={<EmployeeRegister />} />
          <Route path="/employerRegister" element={<EmployerRegister />} />
          <Route path="/employeeLogin" element={<EmployeeLogIn />} />
          <Route path="/employerLogin" element={<EmployerLogIn />} />
          {/* <Route path='/about-us' element={<AboutUs />} /> */}
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/employerDashboard" element={<EmployerDashboard />} />
          <Route path="/employeeDashboard" element={<EmployeeDashboard />} />
          {/* <Route path='/view-employees' element={<ViewEmployees />} /> */}
          <Route path="/dispute" element={<Dispute />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/job-details/:id" element={<JobDetails />} />
          <Route path="/my-jobs" element={<MyJobs />} />
          <Route path="/my-jobs/:id" element={<MyJobDetails />} />
          <Route path="/employer-profile" element={<EmployerProfile />} />
          <Route path="/employee-profile" element={<EmployeeProfile />} />
          <Route path="/view-employees" element={<EmployerJobPortal />} />
          <Route path="/view-open-contracts" element={<ViewOpenContracts />} />
          <Route path="/dao" element={<DAODashboard />} />
          <Route path="/job" element={<Job />} />
          <Route path="/new-job" element={<Job />} />
          <Route path="/employee-jobs" element={<EmployeeJobsPage />} />
          {/* <Route path="/review-completed-contracts" element={ReviewCompletedContracts />} /> */}
          <Route path="/review-completed-contracts" element={<ReviewCompletedContracts />} />
          <Route path="/review-applications" element={<ReviewApplications />} />
        </Routes>
        </AuthProvider>
      </div>
    </DynamicContextProvider>
  );
};

export default App;
