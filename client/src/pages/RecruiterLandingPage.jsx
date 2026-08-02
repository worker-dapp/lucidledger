import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, CheckCircle, AlertCircle, LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import apiService from "../services/api";
import logo from "../assets/Android.png";
import LogoutButton from "../components/LogoutButton";

const RecruiterLandingPage = () => {
  const { user, isAuthenticated, isLoading, login, smartWalletAddress } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [checked, setChecked] = useState(false);
  const [signupForm, setSignupForm] = useState({ first_name: "", last_name: "", agency_name: "", phone_number: "" });
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState(null);

  const userEmail = user?.email?.address?.toLowerCase();

  useEffect(() => {
    if (!isAuthenticated || !userEmail || checked) return;

    const checkStatus = async () => {
      setChecking(true);
      try {
        const response = await apiService.checkRecruiter(userEmail);
        if (response?.success && response.isRecruiter) {
          setIsRecruiter(true);
          navigate("/recruiter-dashboard", { replace: true });
        }
      } catch {
        // 404 = not a recruiter yet, show signup form
      } finally {
        setChecking(false);
        setChecked(true);
      }
    };

    checkStatus();
  }, [isAuthenticated, userEmail, checked, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!userEmail) return;
    setSubmitting(true);
    setSignupError(null);
    try {
      await apiService.createRecruiter({ email: userEmail, wallet_address: smartWalletAddress || '', ...signupForm });
      navigate("/recruiter-dashboard", { replace: true });
    } catch (err) {
      setSignupError(err?.message || "Failed to create profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    setSignupForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D3B66]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0D3B66] shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
          <a href="/" className="flex items-center gap-2 text-2xl font-bold tracking-wide">
            <img src={logo} alt="Lucid Ledger Logo" className="w-12 h-12 object-contain" />
            <span className="text-white">LUCID LEDGER</span>
          </a>
          {isAuthenticated && (
            <LogoutButton className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-all text-sm" />
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-16">
        {!isAuthenticated ? (
          // Not logged in — show landing CTA
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-[#EEF5FF] rounded-full flex items-center justify-center mx-auto">
              <Briefcase className="h-8 w-8 text-[#0D3B66]" />
            </div>
            <h1 className="text-3xl font-bold text-[#0D3B66]">For Recruiters</h1>
            <p className="text-gray-500 text-base leading-relaxed">
              Lucid Ledger connects licensed recruitment agencies with employers committed to ethical hiring. Sign up to receive job orders, manage candidate pipelines, and have your placement fees verified transparently.
            </p>
            <ul className="text-left space-y-3 text-sm text-gray-600">
              {["Receive job orders directly from employers", "Manage candidate applications in one place", "Fee payments recorded with full transparency", "Zero-fee contracts protect workers you place"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                localStorage.setItem('pendingRole', 'recruiter');
                localStorage.setItem('loginIntent', 'signup');
                login();
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#EE964B] text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-[#d97b33] transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Sign Up / Log In
            </button>
          </div>
        ) : checked && !isRecruiter ? (
          // Logged in, no recruiter profile — show signup form
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#0D3B66] mb-2">Create Your Recruiter Profile</h2>
            <p className="text-gray-500 text-sm mb-6">Signed in as <span className="font-medium text-gray-700">{userEmail}</span></p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input name="first_name" value={signupForm.first_name} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input name="last_name" value={signupForm.last_name} onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input name="agency_name" value={signupForm.agency_name} onChange={handleFormChange}
                  placeholder="Your agency or company name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
                <input name="phone_number" value={signupForm.phone_number} onChange={handleFormChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]" />
              </div>

              {signupError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {signupError}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full bg-[#0D3B66] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0a2d50] transition-colors disabled:opacity-50">
                {submitting ? "Creating Profile..." : "Create Profile"}
              </button>
            </form>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default RecruiterLandingPage;
