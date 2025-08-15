import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import GetLocation from "../components/GetLocation";
import apiService from "../api/apiService";
import { ethers } from "ethers";
import { Bell, CheckCircle, XCircle } from "lucide-react";

const MyJobDetails = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const { fetchLocation, location, loading, error } = GetLocation();
  const [punchInDetails, setPunchInDetails] = useState([]);
  const [locationFetched, setLocationFetched] = useState(false);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(null);
  const [payerInfo, setPayerInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [rfidValue, setRfidValue] = useState(null);
  const [scanning, setScanning] = useState(false);

  const handleDismissNotification = async (id) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete notification:", error);
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleScanRFID = async () => {
    setScanning(true);
    setRfidValue("⏳ Scanning for tag...");
    try {
      // Wait for 15 seconds before fetching
      await new Promise((resolve) => setTimeout(resolve, 10000));
      const res = await fetch("http://localhost:5001/rfid-scan");
      const data = await res.json();
      setRfidValue(`🎉 Scanned UID: ${data.uid}`);
    } catch (err) {
      console.error("Error fetching RFID:", err);
      setRfidValue("❌ Failed to scan RFID.");
    }
    setScanning(false);
  };
  

  const handlePunch = () => {
    if (!locationFetched && !loading) {
      fetchLocation();
      setLocationFetched(true);
    }

    if (location.latitude && location.longitude) {
      const currentTime = new Date().toLocaleTimeString();

      if (!isPunchedIn) {
        setPunchInDetails((prev) => [
          ...prev,
          {
            latitude: location.latitude,
            longitude: location.longitude,
            locationName: location.name,
            punchIn: currentTime,
            punchOut: null,
          },
        ]);
      } else {
        setPunchInDetails((prev) =>
          prev.map((entry, idx) =>
            idx === prev.length - 1 && !entry.punchOut
              ? { ...entry, punchOut: currentTime }
              : entry
          )
        );
      }

      setIsPunchedIn(!isPunchedIn);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not detected!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      await signer.signMessage("Confirm payout submission for your contract");
      setShowModal(true);

      const tx = await signer.sendTransaction({
        to: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        value: ethers.parseEther("0.0"),
        data: "0x",
      });

      console.log("📡 Tx sent:", tx.hash);

      tx.wait().then(async () => {
        const { data, error } = await supabase
          .from("wallets")
          .select("user_email,pay_for_job")
          .eq("latest_contract_id", contract.id)
          .single();

        if (error || !data) {
          console.error("Error fetching payer info by contract ID:", error);
          setPayerInfo(null);
          setPaymentAmount(null);
          return;
        }

        const amountPaid = data.pay_for_job

        setPaymentAmount(amountPaid.toFixed(2));
        setPayerInfo({ ...data, txHash: tx.hash });

        const { error: updateError } = await supabase
          .from("contracts")
          .update({ status: "closed" })
          .eq("id", contract.id);

        if (updateError) {
          console.error("❌ Failed to update contract status:", updateError);
        }
      });
    } catch (err) {
      console.error("MetaMask error or signature rejected:", err);
      alert("Signature required to submit.");
      setShowModal(false);
    }
  };

  useEffect(() => {
    const fetchContract = async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching contract:", error);
      } else {
        setContract(data);
      }
    };

    fetchContract();
  }, [id]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!contract) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("contract_id", contract.id)
        .in("status", ["approved", "rejected"]);

      if (error) {
        console.error("Error fetching notifications:", error);
      } else {
        setNotifications(data);
      }
    };

    fetchNotifications();
  }, [contract]);

  if (!contract) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex justify-center items-center">
        <h2 className="text-2xl text-[#EE964B]">Contract not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] to-[#FFFFFF] pb-20">
      <Navbar />
      <div className="text-4xl text-orange-600 font-bold text-center p-12">
        {contract.contracttitle} Details
      </div>

      {/* 🔔 Notification Bell */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setShowNotifPanel(!showNotifPanel)}
          className="p-2 rounded-full bg-orange-100 hover:bg-orange-200 relative"
        >
          <Bell className="text-orange-600" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs px-1">
              {notifications.length}
            </span>
          )}
        </button>

        {showNotifPanel && (
          <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-xl border border-gray-200 p-4 z-50">
            <h3 className="text-lg font-bold mb-2 text-[#0D3B66]">
              Notifications
            </h3>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700">{n.message}</span>
                  {n.status === "approved" ? (
                    <CheckCircle
                      className="text-green-600 w-5 h-5 cursor-pointer"
                      onClick={() => handleDismissNotification(n.id)}
                    />
                  ) : (
                    <XCircle
                      className="text-red-600 w-5 h-5 cursor-pointer"
                      onClick={() => handleDismissNotification(n.id)}
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No notifications</p>
            )}
          </div>
        )}
      </div>

      <div className="w-2/3 mx-auto p-10">
        <p className="text-lg">
          <strong>Description:</strong> {contract.description}
        </p>
        <p className="text-lg">
          <strong>Payment Rate :</strong> {contract.paymentrate}
        </p>
        <p className="text-lg">
          <strong>Payment Frequency :</strong> {contract.paymentfrequency}
        </p>
        <p className="text-lg pb-5">
          <strong>Location :</strong> {contract.location}
        </p>

        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
          <div className="flex gap-4">
            <button
              onClick={handlePunch}
              className={`${
                isPunchedIn
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              } text-white font-bold py-2 px-6 rounded-xl transition`}
              disabled={loading}
            >
              {loading ? "Fetching..." : isPunchedIn ? "Punch Out" : "Punch In"}
            </button>

            <button
              onClick={handleScanRFID}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl transition"
              disabled={scanning}
            >
              {scanning ? "Scanning..." : "Scan In"}
            </button>
          </div>

          {rfidValue && (
            <div className="text-sm text-gray-700">
              <strong>RFID UID:</strong> {rfidValue}
            </div>
          )}

          <button
            onClick={handlePunch}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-xl transition"
            disabled={loading}
          >
            Raise a dispute
          </button>
        </div>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <div className="mt-8 text-gray-700">
          <h4 className="font-semibold mb-4">Punch-in Details</h4>

          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border px-4 py-2">Latitude</th>
                <th className="border px-4 py-2">Longitude</th>
                <th className="border px-4 py-2">Location</th>
                <th className="border px-4 py-2">Punch In</th>
                <th className="border px-4 py-2">Punch Out</th>
                <th className="border px-4 py-2">Submit</th>
              </tr>
            </thead>
            <tbody>
              {punchInDetails.length > 0 ? (
                punchInDetails.map((detail, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{detail.latitude}</td>
                    <td className="border px-4 py-2">{detail.longitude}</td>
                    <td className="border px-4 py-2">{detail.locationName}</td>
                    <td className="border px-4 py-2">{detail.punchIn}</td>
                    <td className="border px-4 py-2">
                      {detail.punchOut || "-"}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <button
                        onClick={handleSubmit}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                        disabled={!detail.punchIn || !detail.punchOut}
                      >
                        Submit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="border px-4 py-2 text-center">
                    No Punch-In Data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-10 w-[90%] max-w-md text-center">
              <h2 className="text-2xl font-bold mb-4">Validating GPS...</h2>
              {paymentAmount && payerInfo ? (
                <p className="text-lg mb-6">
                  ✅ Your punches are being validated. <br />
                  You will be paid{" "}
                  <span className="font-semibold text-green-600">
                    ${paymentAmount}
                  </span>{" "}
                  by{" "}
                  <span className="font-semibold text-[#0D3B66]">
                    {payerInfo.user_email}
                  </span>
                  .
                  <br />
                  You will be notified once your punches are approved.
                </p>
              ) : (
                <p className="text-red-500">Unable to fetch payment info.</p>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJobDetails;
