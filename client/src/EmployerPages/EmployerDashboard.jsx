import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCircle, XCircle, Wallet, Settings, User } from "lucide-react";
import supabase from "../lib/supabaseClient";
import Navbar from "../components/Navbar";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const EmployerDashboard = () => {
  const [userName, setUserName] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const [unreviewedContracts, setUnreviewedContracts] = useState([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const navigate = useNavigate();
  const { user } = useDynamicContext();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setUserName(user.first_name || user.email.split("@")[0]);

        try {
          const { data, error } = await supabase.from('wallets').select('*').single();
          if (!error && data) {
            setWalletInfo(data);
          }
        } catch (error) {
          console.error("Error fetching wallet:", error);
        }
      }

      try {
        const { data: contracts, error: contractError } = await supabase.from('contracts').select('*');
        if (!contractError && contracts) {
          const unreviewed = contracts.filter(
            (contract) => contract.status === "open" && !contract.reviewed
          );
          setUnreviewedContracts(unreviewed);
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
        setUnreviewedContracts([]);
      }
    };

    fetchData();
  }, [user]);

  const handleReview = async (id) => {
    try {
      const { error } = await supabase.from('contracts').update({ reviewed: true }).eq('id', id);
      if (!error) {
        setUnreviewedContracts((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Error updating contract:", error);
    }
  };

  

  return (
    <div className="min-h-screen bg-[#FFFFFF] relative">
      <Navbar />

      {/* Profile Completion Alert */}
      {user && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex items-center">
            <User className="text-blue-400 mr-2" />
            <p className="text-blue-700">
              Please complete your profile to access all features.
            </p>
          </div>
        </div>
      )}

      {/* Top-right: Icons */}
      <div className="absolute top-32 right-6 flex items-center gap-4">
        <button
          onClick={() => setShowMessages(!showMessages)}
          className="relative p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition"
        >
          <Bell className="text-orange-600" />
          {unreviewedContracts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
              {unreviewedContracts.length}
            </span>
          )}
        </button>

        {/* Wallet */}
        <button
          onClick={() => setShowWalletModal(true)}
          className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition"
        >
          <Wallet className="text-orange-600" />
        </button>

        {/* DAO / Settings */}
        <button
          onClick={() => navigate("/dao")}
          className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition"
        >
          <Settings className="text-orange-600" />
        </button>
      </div>

      {/* Notification Dropdown */}
      {showMessages && (
        <div className="absolute right-6 top-16 w-80 bg-white shadow-lg rounded-lg p-4 z-10">
          <h4 className="text-md font-semibold text-gray-900 mb-2">
            Unreviewed Contracts
          </h4>
          {unreviewedContracts.length === 0 ? (
            <p className="text-sm text-gray-600">No unreviewed contracts.</p>
          ) : (
            <ul className="space-y-3">
              {unreviewedContracts.map((contract) => {
                const signerName =
                  Array.isArray(contract.signers) && contract.signers.length > 0
                    ? contract.signers[0]?.name || "Someone"
                    : "Someone";
                return (
                  <li key={contract.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-800 truncate">
                      {signerName} has accepted:{" "}
                      <strong>{contract.title || contract.contracttitle}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(contract.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={() =>
                          setUnreviewedContracts((prev) =>
                            prev.filter((c) => c.id !== contract.id)
                          )
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Welcome */}
      <div className="text-3xl text-center p-12">Welcome, {userName}!</div>

      {/* Action Cards */}
      <div className="flex flex-wrap justify-center gap-12 p-12">
        {[
          { to: "/job", label: "Create New Contract" },
          { to: "/review-applications", label: "Review Applications" },
          { to: "/view-open-contracts", label: "View Open Contracts" },
          { to: "/review-completed-contracts", label: "Review Completed Contracts" },
          { to: "/dispute", label: "View Ongoing Disputes" },
          { to: "/payments", label: "View Closed Contracts" },
        ].map(({ to, label }) => (
          <Link key={to} to={to} className={cardClass}>
            {label}
          </Link>
        ))}
      </div>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Wallet Summary
            </h2>
            {walletInfo ? (
              <>
                <p className="text-md text-gray-700 mb-2">
                  🧾 <strong>Wallet Address:</strong>{" "}
                  {walletInfo.wallet_address?.slice(0, 6)}...
                  {walletInfo.wallet_address?.slice(-4)}
                </p>
                <p className="text-lg mb-2">
                  💰 <strong>Current Balance:</strong>{" "}
                  <span className="text-green-700">
                    ${parseFloat(walletInfo.usd_balance || 0).toFixed(2)}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-red-500">No wallet connected or found.</p>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowWalletModal(false)}
                className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion Modal removed */}
    </div>
  );
};

const cardClass =
  "w-1/4 text-center p-10 rounded-2xl shadow-2xl font-medium text-2xl border border-gray-100 bg-gradient-to-b from-[#FAF0CA] to-white backdrop-blur-lg transition-all hover:shadow-2xl hover:scale-[1.03] text-gray-900";

export default EmployerDashboard;
