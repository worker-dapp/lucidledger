import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import logo from "../assets/Android.png";

const Navbar = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  const handleHomeClick = () => {
    if (user) {
      if (user.role === 'employee') {
        navigate('/employeeDashboard');
      } else if (user.role === 'employer') {
        navigate('/employerDashboard');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
    setIsMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => setDropdownOpen((v) => !v);

  return (
    <div className="w-full z-50 bg-[#0D3B66] shadow-md">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
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

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-12 text-md">
          <button
            onClick={handleHomeClick}
            className="transition-all font-medium text-white hover:text-[#F4D35E]"
          >
            Home
          </button>
          <NavLink
            to="/about-us"
            className={({ isActive }) =>
              `transition-all font-medium ${
                isActive ? "text-[#EE964B] font-semibold" : "text-white"
              } hover:text-[#F4D35E]`
            }
            onClick={handleNavClick}
          >
            About Us
          </NavLink>
          
          {/* Dynamic Wallet Widget */}
          <DynamicWidget />
          
          {/* User Menu */}
          {user ? (
            <div className='flex items-center gap-12'>
              <span className="text-white text-sm">
                Welcome, {user.first_name || user.email}
              </span>
              <Link 
                to={user.role === 'employee' ? '/employee-profile' : '/employer-profile'} 
                className='text-white hover:text-orange-600 transition-all text-lg'
                onClick={handleNavClick}
              >
                Profile
              </Link>
              <button 
                onClick={handleLogout} 
                className='bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all shadow-md text-lg'
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className='relative' ref={dropdownRef}>
              <button 
                onClick={toggleDropdown}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); } }}
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
                aria-controls="landing-signin-menu"
                className='bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-all shadow-md text-lg'
              >
                Sign In
              </button>

              {isDropdownOpen && (
                <div
                  id="landing-signin-menu"
                  role="menu"
                  aria-label="Sign in options"
                  className='absolute right-0 mt-2 min-w-44 bg-white border border-gray-200 shadow-lg rounded-lg z-50'
                >
                  <Link 
                    to='/employeeLogin' 
                    role="menuitem"
                    className='block px-4 py-2 text-gray-900 hover:bg-orange-100 transition-all rounded-t-lg'
                    onClick={handleNavClick}
                  >
                    Employee
                  </Link>
                  <Link 
                    to='/employerLogin' 
                    role="menuitem"
                    className='block px-4 py-2 text-gray-900 hover:bg-orange-100 transition-all rounded-b-lg'
                    onClick={handleNavClick}
                  >
                    Employer
                  </Link>
                </div>
              )}
            </div>
          )}
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
            <button
              onClick={handleHomeClick}
              className="w-full text-left transition-all font-medium text-white hover:text-[#F4D35E] py-2 px-3 rounded hover:bg-[#1a4a7a]"
            >
              Home
            </button>

            <NavLink
              to="/about-us"
              onClick={handleNavClick}
              className={({ isActive }) =>
                `block w-full text-left transition-all font-medium py-2 px-3 rounded ${
                  isActive ? "text-[#EE964B] font-semibold bg-[#1a4a7a]" : "text-white hover:text-[#F4D35E] hover:bg-[#1a4a7a]"
                }`
              }
            >
              About Us
            </NavLink>

            {user ? (
              <div className="pt-3 border-t border-[#1a4a7a] space-y-3">
                <div className="text-white text-sm">Welcome, {user.first_name || user.email}</div>
                <Link
                  to={user.role === 'employee' ? '/employee-profile' : '/employer-profile'}
                  onClick={handleNavClick}
                  className='block w-full bg-white text-[#0D3B66] px-4 py-2 rounded text-center hover:bg-gray-100 transition-all'
                >
                  Profile
                </Link>
                <button 
                  onClick={handleLogout} 
                  className='block w-full bg-red-500 text-white px-4 py-2 rounded text-center hover:bg-red-600 transition-all'
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-[#1a4a7a] space-y-2">
                <Link 
                  to='/employeeLogin' 
                  onClick={handleNavClick}
                  className='block w-full bg-orange-500 text-white px-4 py-2 rounded text-center hover:bg-orange-600 transition-all'
                >
                  Employee Sign In
                </Link>
                <Link 
                  to='/employerLogin' 
                  onClick={handleNavClick}
                  className='block w-full bg-gray-600 text-white px-4 py-2 rounded text-center hover:bg-gray-700 transition-all'
                >
                  Employer Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
