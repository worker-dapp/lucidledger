import React, { useState, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import logo from "../assets/Android.png";

const PublicEmployerNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const { setShowAuthFlow, openModal } = useDynamicContext();

  const handleNavClick = () => {
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

  return (
    <div className="w-full z-50 bg-[#0D3B66] shadow-md">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
        {/* Brand */}
        <Link
          to="/employers"
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

        {/* Right Side: Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Auth Buttons */}
          <button
            onClick={handleEmployerLogin}
            className="px-4 py-2 text-white border border-white rounded-lg hover:bg-white hover:text-[#0D3B66] transition-all font-medium"
          >
            Log In
          </button>
          <button
            onClick={handleEmployerLogin}
            className="px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d97b33] transition-all font-medium"
          >
            Sign Up
          </button>
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
            {/* Auth Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleEmployerLogin}
                className="block w-full text-center px-4 py-2 text-white border border-white rounded-lg hover:bg-white hover:text-[#0D3B66] transition-all font-medium"
              >
                Log In
              </button>
              <button
                onClick={handleEmployerLogin}
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

export default PublicEmployerNavbar;
