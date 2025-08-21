import React, { useState, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "../assets/Android.png";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);


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
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Navbar;
