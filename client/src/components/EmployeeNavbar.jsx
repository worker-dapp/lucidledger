import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import logo from "../assets/Android.png";

const EmployeeNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, setShowAuthFlow } = useDynamicContext();
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    // If you need logout, integrate Dynamic's logout when available
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const handleHomeClick = () => {
    navigate('/employeeDashboard');
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="w-full z-50 bg-[#0D3B66] shadow-md">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
        {/* Enhanced Brand Name */}
        <Link
          to="/employeeDashboard"
          className="flex items-center gap-1 text-2xl sm:text-3xl font-bold tracking-wide">
          <img
            src={logo}
            alt="Lucid Ledger Logo"
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
          />
          <span className="text-[#FFFFFF] hover:[#EE964B] transition-all">
            LUCID LEDGER
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 text-md">
          <button
            onClick={handleHomeClick}
            className="transition-all font-medium text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a] px-3 py-2 rounded flex items-center gap-2">
            <span>🏠</span>
            Home
          </button>
          
          <NavLink
            to="/employee-jobs"
            className={({ isActive }) =>
              `transition-all font-medium flex items-center gap-2 px-3 py-2 rounded ${
                isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
              }`
            }>
            <span>📋</span>
            Job Tracker
          </NavLink>

          <NavLink
            to="/employee-profile"
            className={({ isActive }) =>
              `transition-all font-medium flex items-center gap-2 px-3 py-2 rounded ${
                isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
              }`
            }>
            <span>👤</span>
            My Profile
          </NavLink>

          <NavLink
            to="/support"
            className={({ isActive }) =>
              `transition-all font-medium flex items-center gap-2 px-3 py-2 rounded ${
                isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
              }`
            }>
            <span>🆘</span>
            Support Center
          </NavLink>
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="lg:hidden bg-[#0D3B66] border-t border-[#1a4a7a] shadow-lg"
        >
          <div className="px-4 py-4 space-y-4">
            {/* User Welcome Section - First */}
            {user && (
              <div className="border-b border-[#1a4a7a] pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#EE964B] rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {user.first_name || user.email}
                      </p>
                      <p className="text-[#F4D35E] text-sm">Employee</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className='bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-all'>
                    Log Out
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-3">
              <button
                onClick={handleHomeClick}
                className="w-full text-left transition-all font-medium text-white hover:text-[#F4D35E] py-2 px-3 rounded hover:bg-[#1a4a7a]">
                🏠 Home
              </button>
              
              <NavLink
                to="/my-jobs"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `block w-full text-left transition-all font-medium py-2 px-3 rounded ${
                    isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
                  }`
                }>
                📋 Job Tracker
              </NavLink>

              <NavLink
                to="/employee-profile"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `block w-full text-left transition-all font-medium py-2 px-3 rounded ${
                    isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
                  }`
                }>
                👤 My Profile
              </NavLink>

              <NavLink
                to="/support"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `block w-full text-left transition-all font-medium py-2 px-3 rounded ${
                    isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
                  }`
                }>
                🆘 Support Center
              </NavLink>
            </div>

            {/* Sign In for non-authenticated users */}
            {!user && (
              <div className="pt-4 border-t border-[#1a4a7a]">
                <div className="space-y-2">
                  <Link 
                    to='/employeeLogin' 
                    onClick={handleNavClick}
                    className='block w-full bg-orange-500 text-white px-4 py-2 rounded text-center hover:bg-orange-600 transition-all'>
                    Employee Sign In
                  </Link>
                  <Link 
                    to='/employerLogin' 
                    onClick={handleNavClick}
                    className='block w-full bg-gray-600 text-white px-4 py-2 rounded text-center hover:bg-gray-700 transition-all'>
                    Employer Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeNavbar;
