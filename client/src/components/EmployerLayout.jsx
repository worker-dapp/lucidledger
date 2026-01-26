import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { LayoutGrid, Users, AlertTriangle, User, Menu, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/Android.png";
import LogoutButton from "./LogoutButton";
import BetaBanner from "./BetaBanner";
import SmartWalletInfo from "./SmartWalletInfo";

const navItems = [
  { to: "/contract-factory", label: "Recruitment Hub", icon: LayoutGrid },
  { to: "/workforce", label: "Workforce Dashboard", icon: Users },
  { to: "/dispute", label: "Compliance", icon: AlertTriangle },
  { to: "/employer-profile", label: "My Profile", icon: User },
];

const EmployerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <BetaBanner />
      <header className="bg-[#0D3B66] shadow-md">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden text-white hover:text-[#F4D35E] transition-all p-1"
              aria-label="Toggle navigation"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link
              to="/contract-factory"
              className="flex items-center gap-1 text-2xl sm:text-3xl font-bold tracking-wide"
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
          </div>

          <div className="flex items-center gap-3">
            <SmartWalletInfo />
            <LogoutButton className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-all" />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:static lg:translate-x-0`}
        >
          <div className="px-4 py-6 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
              Navigation
            </div>
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#EEF5FF] text-[#0D3B66]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}

            {user && (
              <div className="mt-6 px-3 py-2 rounded-lg bg-gray-50 text-xs text-gray-500">
                Signed in as{" "}
                <span className="font-semibold text-gray-700">
                  {user.first_name ||
                    user.email?.address ||
                    user.email ||
                    user.phone?.number ||
                    user.phone ||
                    "Employer"}
                </span>
              </div>
            )}
          </div>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default EmployerLayout;
