import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const JobLandingHero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const popularSearches = [
    "Deckhand",
    "Fish Cutter",
    "Seafood Processor",
    "Assembly Technician",
    "Tea Harvester",
    "Rubber Tapper",
    "Palm Oil Harvester",
    "Construction Laborer",
    "Seasonal Farmworker"
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/my-jobs?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handlePopularSearch = (search) => {
    setSearchQuery(search);
    navigate(`/my-jobs?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* First Div - Value Proposition */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#0D3B66] mb-6 leading-tight">
            Your Gateway to New Opportunities
          </h1>
          <p className="text-xl md:text-2xl text-[#EE964B] mb-12 max-w-4xl mx-auto leading-relaxed">
            Find fair work. Get paid on time. Stay safe and protected.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:bg-gray-100 hover:shadow-lg transition-all">
            <div className="text-[#EE964B] text-3xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-[#0D3B66] mb-3">Find Jobs Without Middlemen</h3>
            <p className="text-gray-600 leading-relaxed">
              Browse real job offers. No fees, no agents, no scams.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:bg-gray-100 hover:shadow-lg transition-all">
            <div className="text-[#EE964B] text-3xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-[#0D3B66] mb-3">Clear Rules, Fair Contracts</h3>
            <p className="text-gray-600 leading-relaxed">
              Every job shows how much you'll earn, when you'll be paid, and what's expected.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:bg-gray-100 hover:shadow-lg transition-all">
            <div className="text-[#EE964B] text-3xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-[#0D3B66] mb-3">Secure Your Pay</h3>
            <p className="text-gray-600 leading-relaxed">
              Your wages are locked in a safe account until the work is done. No more unpaid work.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:bg-gray-100 hover:shadow-lg transition-all">
            <div className="text-[#EE964B] text-3xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-[#0D3B66] mb-3">Grow Your Reputation</h3>
            <p className="text-gray-600 leading-relaxed">
              Good work helps you build a trusted record. Get better jobs and more respect.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:bg-gray-100 hover:shadow-lg transition-all">
            <div className="text-[#EE964B] text-3xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold text-[#0D3B66] mb-3">Speak Up Safely</h3>
            <p className="text-gray-600 leading-relaxed">
              Share feedback or report problems without fear. Stay protected with private surveys and support.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:bg-gray-100 hover:shadow-lg transition-all">
            <div className="text-[#EE964B] text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-[#0D3B66] mb-3">Start Your Journey</h3>
            <p className="text-gray-600 leading-relaxed">
              Join thousands of workers who've found better opportunities through our platform.
            </p>
          </div>
        </div>
      </div>

      {/* Second Div - Job Search Tool */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D3B66] mb-4">
              Find your next job.
            </h2>
            <p className="text-gray-600 text-lg">
              Search thousands of opportunities across all industries
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search jobs, keywords, companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-[#EE964B] focus:outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-[#EE964B] hover:bg-[#d97b33] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <span>🔍</span>
                Search Jobs
              </button>
            </div>
          </form>

          {/* Popular Searches */}
          <div>
            <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">
              Popular searches:
            </h3>
            <div className="flex flex-wrap gap-3">
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handlePopularSearch(search)}
                  className="bg-gray-100 hover:bg-[#EE964B] hover:text-white text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-all border border-gray-200 hover:border-[#EE964B]"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobLandingHero;
