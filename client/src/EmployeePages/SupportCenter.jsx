import React, { useState } from "react";
import EmployeeNavbar from "../components/EmployeeNavbar";
import Footer from "../components/Footer";

const SupportCenter = () => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Placeholder contracts - will be replaced with API data
  const recentContracts = [];

  const categories = [
    { value: 'no_payment', label: 'No payment' },
    { value: 'long_hours', label: 'Long hours' },
    { value: 'unsafe_work', label: 'Unsafe work conditions' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit to API
    console.log({ selectedContract, category, description, isAnonymous });
    setSubmitted(true);
  };

  const handleNewReport = () => {
    setSubmitted(false);
    setSelectedContract(null);
    setCategory('');
    setDescription('');
    setIsAnonymous(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />
      
      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D3B66] mb-3">
              Get Help with a Job
            </h1>
            <p className="text-lg text-gray-600 italic">
              "If something isn't right, choose the job and tell us what happened."
            </p>
          </div>

          {submitted ? (
            /* Success Message */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-3">
                Your report has been received
              </h2>
              <p className="text-gray-600 mb-6">
                We'll review your submission and follow up with you soon.
              </p>
              <button
                onClick={handleNewReport}
                className="bg-[#EE964B] hover:bg-[#d97b33] text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            <>
              {/* Recent Contracts Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                <h2 className="text-xl font-bold text-[#0D3B66] mb-4">
                  Active and Recent Contracts
                </h2>
                
                {recentContracts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">📋</div>
                    <p className="text-gray-500">No recent contracts found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Your active and recently completed contracts will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentContracts.map((contract) => (
                      <div
                        key={contract.id}
                        onClick={() => setSelectedContract(contract)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedContract?.id === contract.id
                            ? 'border-[#EE964B] bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-[#0D3B66]">{contract.jobName}</h3>
                            <p className="text-sm text-gray-600">{contract.employerName}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              contract.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {contract.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{contract.dateRange}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Report Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-[#0D3B66] mb-6">
                  Report a Problem
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What type of issue are you experiencing?
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What happened?
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
                      placeholder="Please describe the issue in detail..."
                      required
                    />
                  </div>

                  {/* File Upload (placeholder) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach files (optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <div className="text-4xl mb-2">📎</div>
                      <p className="text-sm text-gray-500">
                        Drag and drop files here, or click to browse
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Photos, screenshots, or documents
                      </p>
                    </div>
                  </div>

                  {/* Anonymous Toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-5 h-5 text-[#EE964B] border-gray-300 rounded focus:ring-[#EE964B]"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-700">
                      Send without my name (anonymous report)
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-[#EE964B] hover:bg-[#d97b33] text-white py-3 rounded-lg font-semibold transition-all"
                  >
                    Submit Report
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SupportCenter;

