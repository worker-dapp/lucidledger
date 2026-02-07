import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Shield,
  Users,
  Rocket,
  Loader2,
  LogOut,
  XCircle,
} from "lucide-react";
import apiService from "../services/api";
import { useAuth } from "../hooks/useAuth";

const AdminDashboard = () => {
  const { user, login, logout, smartWalletAddress } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  const userEmail = user?.email?.address?.toLowerCase() || "";

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user && !smartWalletAddress) {
        setAdminCheckComplete(true);
        return;
      }
      try {
        const response = await apiService.getAllMediators();
        if (response.success) setIsAdmin(true);
      } catch (err) {
        if (err.status !== 403) console.error("Error checking admin status:", err);
        setIsAdmin(false);
      } finally {
        setAdminCheckComplete(true);
      }
    };
    checkAdminStatus();
  }, [user, smartWalletAddress]);

  if (!adminCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          Checking authorization...
        </div>
      </div>
    );
  }

  if (!user && !smartWalletAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Administrator Login</h1>
          <p className="text-gray-600 mb-6">
            Sign in with your authorized email address to access the admin dashboard.
          </p>
          <button
            onClick={login}
            className="px-4 py-2 bg-[#0D3B66] text-white rounded-lg hover:bg-[#0a2d4d] transition-colors"
          >
            Sign In
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Only authorized administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            This page is only accessible to platform administrators.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4">
            <p className="text-gray-500 mb-1">Your email:</p>
            <p className="font-mono text-xs text-gray-700 break-all">
              {userEmail || "Not available"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 mx-auto text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out & Try Another Account
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Manage Employers",
      description: "Review and approve employer accounts before they can post jobs.",
      icon: Building2,
      to: "/admin/employers",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Manage Mediators",
      description: "Add, remove, and manage approved mediators. Assign mediators to disputed contracts.",
      icon: Users,
      to: "/admin/mediators",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Deploy Factory",
      description: "Deploy a new WorkContractFactory contract from your admin smart wallet.",
      icon: Rocket,
      to: "/admin/deploy-factory",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#0D3B66]" />
              <div>
                <h1 className="text-xl font-semibold text-[#0D3B66]">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Platform administration tools</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center mb-4`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <h2 className="text-lg font-semibold text-[#0D3B66] group-hover:text-[#0a2d4d] mb-2">
                {card.title}
              </h2>
              <p className="text-sm text-gray-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
