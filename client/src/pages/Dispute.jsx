import React, { useState } from "react";
import Navbar from "../components/Navbar";

const disputes = [
  { id: "11111", issue: "It is a long established fact that a reader will." },
  {
    id: "11112",
    issue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  { id: "11113", issue: "Pellentesque facilisis nisl nec faucibus interdum." },
  { id: "11113", issue: "Pellentesque facilisis nisl nec faucibus interdum." },
];

const Dispute = () => {
  const [search, setSearch] = useState("");

  const filteredDisputes = disputes.filter((dispute) =>
    dispute.issue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20">
      <Navbar />
      <div className="w-1/2 mx-auto pt-10">
        <input
          type="text"
          placeholder="Search disputes..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full p-5 text-xl mb-4 rounded-2xl shadow-2xl border border-gray-100 bg-white/80 backdrop-blur-lg"
        />
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => (
            <div
              key={dispute.id}
              className="p-5 rounded-2xl shadow-2xl border border-gray-100 bg-white/80 backdrop-blur-lg">
              <h3 className="text-xl font-semibold">
                Dispute ID: {dispute.id}
              </h3>
              <p className="text-gray-600 text-lg">{dispute.issue}</p>
              <div className="mt-3 flex space-x-4">
                <button
                  onClick={() => alert(`Resolving dispute ${dispute.id}`)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer">
                  Resolve
                </button>
                <button
                  onClick={() => alert(`Escalating dispute ${dispute.id}`)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 cursor-pointer">
                  Escalate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dispute;
