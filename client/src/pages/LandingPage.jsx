import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import Navbar from "../components/Navbar";
import EmployeeNavbar from "../components/EmployeeNavbar";
import Footer from "../components/Footer";
import img1 from "../assets/feature1.png";
import img2 from "../assets/feature2.png";
import img3 from "../assets/feature3.png";
import img4 from "../assets/feature4.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useDynamicContext();
  const [searchQuery, setSearchQuery] = useState("");
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to job search page with query params (no auth required)
    if (searchQuery.trim()) {
      navigate(`/job-search?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/job-search');
    }
  };

  const handleGetStarted = () => {
    // Navigate to job search for anonymous browsing
    navigate('/job-search');
  };

  const features = [
    {
      icon: img3,
      title: "Find Your Next Job",
      description: "Browse thousands of opportunities matched to your skills and location. Apply with one click."
    },
    {
      icon: img2,
      title: "Get Paid Securely",
      description: "Blockchain-backed payments ensure you get paid on time, every time. No more chasing employers."
    },
    {
      icon: img1,
      title: "Voice Your Concerns",
      description: "Report issues confidentially through our built-in grievance mechanism. Your voice matters."
    },
    {
      icon: img4,
      title: "Fair Dispute Resolution",
      description: "Transparent arbitration process protects your rights. Every dispute is handled fairly."
    }
  ];

  // TODO: Uncomment when we have real stats
  // const stats = [
  //   { value: "10,000+", label: "Jobs Posted" },
  //   { value: "5,000+", label: "Workers Hired" },
  //   { value: "98%", label: "Payment Success" },
  //   { value: "24/7", label: "Support Available" }
  // ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {user ? <EmployeeNavbar /> : <Navbar />}
      {user && <div className="h-20" />} {/* Spacer for fixed navbar */}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[#0D3B66] opacity-[0.03]" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230D3B66' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            {/* Beta Notice - Only show in demo mode */}
            {isDemoMode && (
            <div className="mb-8 max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-amber-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      Private Beta - Demonstration Environment
                    </h3>
                    <p className="text-amber-800 leading-relaxed">
                      LucidLedger is currently in private beta. This is a <strong>demonstration environment</strong> to showcase our platform to potential funders and partners.{" "}
                      <strong className="text-amber-900">Do not apply for jobs or post real job listings.</strong> All data on this site is for testing purposes only.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href="mailto:admin@lucidledger.co"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Request Early Access
                      </a>
                      <button
                        onClick={() => navigate('/about-us')}
                        className="inline-flex items-center gap-2 px-4 py-2 border-2 border-amber-600 text-amber-900 hover:bg-amber-100 text-sm font-semibold rounded-lg transition-colors"
                      >
                        Learn More About Our Mission
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#0D3B66] leading-tight mb-6">
              Find Work.{" "}
              <span className="text-[#EE964B]">Get Paid.</span>
              <br className="hidden sm:block" />
              <span className="text-[#0D3B66]">Build Your Future.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              The fair work platform that protects workers. Search jobs, sign contracts, and get paid securely — all in one place.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-3 sm:p-4 border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Job Title/Keyword Input */}
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search jobs by title, keywords, or company"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-[#EE964B] focus:ring-2 focus:ring-[#EE964B]/20 outline-none transition-all text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  {/* Search Button */}
                  <button
                    type="submit"
                    className="px-8 py-4 bg-[#EE964B] hover:bg-[#d97b33] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Search Jobs
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Stats - TODO: Uncomment when we have real data */}
            {/* <div className="mt-12 flex flex-wrap justify-center gap-8 sm:gap-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-[#0D3B66]">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D3B66] mb-4">
              Why Workers Choose <span className="text-[#EE964B]">Lucid Ledger</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We built a platform that puts workers first. Here's how we protect you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-[#EE964B]/30 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 mb-6 relative">
                  <div className="absolute inset-0 bg-[#EE964B]/10 rounded-xl group-hover:bg-[#EE964B]/20 transition-colors" />
                  <img
                    src={feature.icon}
                    alt={feature.title}
                    className="w-full h-full object-contain p-3 relative z-10"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#0D3B66] mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-[#0D3B66] to-[#1a5a94]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              From job search to payday, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Search & Apply",
                description: "Browse jobs that match your skills and location. Apply with just a few taps."
              },
              {
                step: "2",
                title: "Sign Your Contract",
                description: "Review terms, sign digitally, and start working. Everything is transparent and secure."
              },
              {
                step: "3",
                title: "Get Paid",
                description: "Complete your work and receive payment automatically. No delays, no excuses."
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 h-full">
                  <div className="w-12 h-12 bg-[#EE964B] rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-blue-100">
                    {item.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <svg className="w-8 h-8 text-[#EE964B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0D3B66] mb-6">
            Ready to Take Control of Your Career?
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Join thousands of workers who've found fair work through Lucid Ledger.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-[#EE964B] hover:bg-[#d97b33] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Get Started — It's Free
            </button>
            <button
              onClick={() => navigate('/about-us')}
              className="px-8 py-4 border-2 border-[#0D3B66] text-[#0D3B66] hover:bg-[#0D3B66] hover:text-white font-bold rounded-xl transition-all text-lg"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
