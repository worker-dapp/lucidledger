import React, { useState, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import logo from "../assets/Android.png";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const { setShowAuthFlow, openModal } = useDynamicContext();

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleEmployeeLogin = () => {
    localStorage.setItem('pendingRole', 'employee');
    localStorage.setItem('userRole', 'employee');
    window.dispatchEvent(new Event('roleSelected'));
    setShowAuthFlow(true);
    openModal?.();
    setIsMobileMenuOpen(false);
  };

  const handleEmployerLogin = () => {
    localStorage.setItem('pendingRole', 'employer');
    localStorage.setItem('userRole', 'employer');
    window.dispatchEvent(new Event('roleSelected'));
    setShowAuthFlow(true);
    openModal?.();
    setIsMobileMenuOpen(false);
  };

  // Nav links that require login - clicking triggers auth flow
  const handleProtectedNavClick = () => {
    handleEmployeeLogin();
  };

  return (
    <div className="w-full z-50 bg-[#0D3B66] shadow-md">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
        {/* Left Side: Brand + Content Navigation */}
        <div className="flex items-center gap-8">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-1 text-2xl sm:text-3xl font-bold tracking-wide"
            onClick={handleNavClick}
          >
            <img
              src={logo}
              alt="Lucid Ledger Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
            />
            <span className="text-[#FFFFFF] hover:[#EE964B] transition-all">
              LUCID LEDGER
            </span>
          </Link>

          {/* Content Navigation */}
          <div className="hidden lg:flex items-center gap-6 text-md">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `transition-all font-medium flex items-center gap-2 ${
                  isActive ? "text-[#EE964B] font-semibold" : "text-white"
                } hover:text-[#F4D35E]`
              }
              onClick={handleNavClick}
            >
              <span>🏠</span>
              Home
            </NavLink>

            <NavLink
              to="/job-search"
              className={({ isActive }) =>
                `transition-all font-medium flex items-center gap-2 ${
                  isActive ? "text-[#EE964B] font-semibold" : "text-white"
                } hover:text-[#F4D35E]`
              }
              onClick={handleNavClick}
            >
              <span>🔍</span>
              Browse Jobs
            </NavLink>

            <NavLink
              to="/about-us"
              className={({ isActive }) =>
                `transition-all font-medium flex items-center gap-2 ${
                  isActive ? "text-[#EE964B] font-semibold" : "text-white"
                } hover:text-[#F4D35E]`
              }
              onClick={handleNavClick}
            >
              <span>ℹ️</span>
              About
            </NavLink>
          </div>
        </div>

        {/* Right Side: Auth + Employer Link */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Auth Buttons */}
          <button
            onClick={handleEmployeeLogin}
            className="px-4 py-2 text-white border border-white rounded-lg hover:bg-white hover:text-[#0D3B66] transition-all font-medium"
          >
            Log In
          </button>
          <button
            onClick={handleEmployeeLogin}
            className="px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d97b33] transition-all font-medium"
          >
            Sign Up
          </button>

          {/* Employer Link - Styled Distinctly, Far Right */}
          <Link
            to="/employers"
            onClick={handleNavClick}
            className="px-4 py-2 text-[#F4D35E] border-2 border-[#F4D35E] rounded-lg hover:bg-[#F4D35E] hover:text-[#0D3B66] font-medium transition-all flex items-center gap-2 ml-2"
          >
            For Employers
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:text-[#F4D35E] transition-all p-2"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="lg:hidden bg-[#0D3B66] border-t border-[#1a4a7a] shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <NavLink
              to="/"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `block w-full text-left transition-all font-medium py-2 px-3 rounded ${
                  isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
                }`
              }
            >
              🏠 Home
            </NavLink>

            <NavLink
              to="/job-search"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `block w-full text-left transition-all font-medium py-2 px-3 rounded ${
                  isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
                }`
              }
            >
              🔍 Browse Jobs
            </NavLink>

            <NavLink
              to="/about-us"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `block w-full text-left transition-all font-medium py-2 px-3 rounded ${
                  isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
                }`
              }
            >
              ℹ️ About
            </NavLink>

            {/* Employer Link - Styled Distinctly */}
            <Link
              to="/employers"
              onClick={handleNavClick}
              className="block w-full text-center mt-4 px-4 py-2 text-[#F4D35E] border-2 border-[#F4D35E] rounded-lg hover:bg-[#F4D35E] hover:text-[#0D3B66] font-medium transition-all"
            >
              For Employers →
            </Link>

            {/* Auth Buttons */}
            <div className="pt-4 border-t border-[#1a4a7a] space-y-2">
              <button
                onClick={handleEmployeeLogin}
                className="block w-full text-center px-4 py-2 text-white border border-white rounded-lg hover:bg-white hover:text-[#0D3B66] transition-all font-medium"
              >
                Log In
              </button>
              <button
                onClick={handleEmployeeLogin}
                className="block w-full text-center px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d97b33] transition-all font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
