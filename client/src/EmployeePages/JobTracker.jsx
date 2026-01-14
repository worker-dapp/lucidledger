import React from "react";
import EmployeeNavbar from "../components/EmployeeNavbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const JobTracker = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      <main className="pt-32 pb-12">
        {/* Welcome Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D3B66] mb-4">
              Welcome to your Work Tracker
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Keep track of every step — from finding a job to getting paid.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="font-semibold text-[#0D3B66]">Track Your Contracts</h3>
                  <p className="text-sm text-gray-600">View jobs you've applied for, those in progress, and contracts you've completed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-semibold text-[#0D3B66]">Check Your Status</h3>
                  <p className="text-sm text-gray-600">See the stage of each job and stay on top of next steps.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 className="font-semibold text-[#0D3B66]">Build Your Reputation</h3>
                  <p className="text-sm text-gray-600">See your reputation score grow as you complete work — earn trust and better jobs.</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/job-search')}
              className="bg-[#EE964B] hover:bg-[#d97b33] text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Search for Jobs
            </button>
          </div>
          
          {/* Contracts Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#0D3B66] mb-6">Contracts</h2>
            
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button className="px-4 py-2 border-b-2 border-[#EE964B] text-[#EE964B] font-semibold">
                Open Contracts
              </button>
              <button className="px-4 py-2 text-gray-500 hover:text-[#0D3B66]">
                Completed Contracts
              </button>
            </div>
            
            {/* Empty State */}
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-[#0D3B66] mb-2">No active contracts yet</h3>
              <p className="text-gray-600 mb-4">Once you sign a contract, it will appear here.</p>
              <button
                onClick={() => navigate('/job-search')}
                className="text-[#EE964B] hover:text-[#d97b33] font-semibold"
              >
                Browse available jobs →
              </button>
            </div>
          </div>
          
          {/* Reputation Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">Reputation</h2>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-gray-500">Coming Soon</p>
                <p className="text-sm text-gray-400 mt-2">Your reputation score will be displayed here</p>
              </div>
            </div>
            
            {/* Disputes Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">Disputes</h2>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">⚖️</div>
                <p className="text-gray-500">Coming Soon</p>
                <p className="text-sm text-gray-400 mt-2">Any ongoing disputes will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default JobTracker;

