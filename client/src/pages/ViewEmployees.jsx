import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import supabase from '../supabaseClient';

const ViewEmployees = () => {
  const [search, setSearch] = useState("");
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    const fetchContracts = async () => {
      const { data, error } = await supabase.from("contracts").select("*");
      if (error) {
        console.error("Error fetching contracts:", error);
        return;
      }

      const processed = data.map((contract) => {
        let signers = [];

        // If signers is stored as JSON string, try parsing it
        if (typeof contract.signers === 'string') {
          try {
            signers = JSON.parse(contract.signers);
          } catch (e) {
            console.warn(`Could not parse signers for contract ${contract.id}`);
          }
        } else if (Array.isArray(contract.signers)) {
          signers = contract.signers;
        }

        const applicants = Array.isArray(signers)
          ? signers.filter((s) => s.name && s.name.trim() !== "").length
          : 0;

        return {
          ...contract,
          applicants,
        };
      });

      setContracts(processed);
    };

    fetchContracts();
  }, []);

  const filteredContracts = contracts.filter((contract) =>
    contract.contracttitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F2] to-[#FFE8D6]">
      <Navbar />
      <div className='w-1/2 mx-auto pt-10'>
        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-5 text-xl mb-4 rounded-2xl shadow-2xl border border-gray-100 bg-white/80 backdrop-blur-lg"
        />
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="p-5 cursor-pointer rounded-2xl shadow-2xl border border-gray-100 bg-white/80 backdrop-blur-lg"
            >
              <h3 className="text-2xl font-semibold">{contract.contracttitle}</h3>
              {contract.applicants > 0 ? (
                <p className="text-gray-600 text-lg">Applicants: {contract.applicants}</p>
              ) : (
                <p className="text-gray-600 text-lg italic">No one has applied yet</p>
              )}
              <p className="text-gray-600 text-lg">Location: {contract.location}</p>
              <p className="text-gray-600 text-lg">Status: {contract.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewEmployees;
