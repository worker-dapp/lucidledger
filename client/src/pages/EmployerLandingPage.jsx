import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PublicEmployerNavbar from "../components/PublicEmployerNavbar";
import Footer from "../components/Footer";
import img1 from "../assets/feature1.png";
import img2 from "../assets/feature2.png";
import img3 from "../assets/feature3.png";
import img4 from "../assets/feature4.png";

const EmployerLandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  // Note: Redirect logic handled by App.jsx, same as employee landing page

  const handleEmployerLogin = () => {
    localStorage.setItem('pendingRole', 'employer');
    localStorage.setItem('userRole', 'employer');
    window.dispatchEvent(new Event('roleSelected'));
    login();
    // Do NOT navigate - let App.jsx redirect logic handle it after auth
  };

  const features = [
    {
      icon: img3,
      title: "Oracle Verification",
      description: "Choose from GPS, image, weight, time clock, or manual verification methods to ensure work is completed to your standards."
    },
    {
      icon: img2,
      title: "Smart Contract Payments",
      description: "Automated, blockchain-backed payments release funds only when work is verified. Transparent and trustless."
    },
    {
      icon: img1,
      title: "Work Verification",
      description: "Multiple oracle options provide proof of work completion, reducing disputes and ensuring accountability."
    },
    {
      icon: img4,
      title: "Dispute Prevention",
      description: "Clear contract terms and automated verification minimize conflicts. Fair resolution when issues arise."
    }
  ];

  const processSteps = [
    {
      step: "1",
      title: "Post Your Job",
      description: "Create a job listing with clear requirements and select your preferred verification method."
    },
    {
      step: "2",
      title: "Worker Completes Job",
      description: "Hired workers complete the task according to your specifications and contract terms."
    },
    {
      step: "3",
      title: "Oracle Verification",
      description: "Automated oracles verify work completion through GPS, images, time tracking, or your approval."
    },
    {
      step: "4",
      title: "Automated Payment",
      description: "Smart contracts release payment automatically once verification confirms work is complete."
    }
  ];

  const benefits = [
    {
      title: "No More Payment Disputes",
      description: "Smart contracts ensure payments are only released when work is verified, protecting both parties."
    },
    {
      title: "Reduced Administrative Overhead",
      description: "Automated verification and payment processing saves time and reduces paperwork."
    },
    {
      title: "Greater Transparency",
      description: "Blockchain-based records provide an immutable audit trail for all transactions and work verification."
    },
    {
      title: "Quality Assurance Built-In",
      description: "Oracle verification methods ensure work meets your standards before payment is released."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <PublicEmployerNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[#0D3B66] opacity-[0.03]"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230D3B66' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#0D3B66] leading-tight mb-6">
              Hire Verified Workers{" "}
              <br className="hidden sm:block" />
              <span className="text-[#EE964B]">With Greater Transparency</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Post jobs, verify work completion through automated oracles, and pay workers securely with blockchain-backed smart contracts.
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={handleEmployerLogin}
                className="px-10 py-5 bg-[#EE964B] hover:bg-[#d97b33] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg transform hover:-translate-y-0.5"
              >
                Post Your First Job
              </button>
              <button
                onClick={() => navigate('/about-us')}
                className="px-10 py-5 border-2 border-[#0D3B66] text-[#0D3B66] hover:bg-[#0D3B66] hover:text-white font-bold rounded-xl transition-all text-lg"
              >
                Learn More
              </button>
            </div>

            <p className="text-sm text-gray-500">
              No credit card required • Free to post jobs • Only pay when you hire
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D3B66] mb-4">
              Why Employers Choose <span className="text-[#EE964B]">Lucid Ledger</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Blockchain technology and smart oracles create a more transparent, efficient hiring process.
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
              From job posting to automated payment, the entire process is streamlined and transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((item, index) => (
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
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <svg className="w-6 h-6 text-[#EE964B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D3B66] mb-4">
              Advantages Over Traditional Platforms
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how Lucid Ledger's blockchain-based approach transforms the hiring experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#EE964B]/10 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#EE964B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0D3B66] mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Oracle Verification Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D3B66] mb-4">
              Flexible Verification Methods
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the oracle verification method that best fits your job requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Manual Verification",
                description: "Traditional supervisor approval when automated methods aren't suitable.",
                icon: "✅"
              },
              {
                name: "Time Clock Oracle",
                description: "Automated time tracking for hourly work with built-in verification.",
                icon: "⏰"
              },
              {
                name: "Image Oracle",
                description: "Require photo evidence of completed work for visual verification.",
                icon: "📸"
              },
              {
                name: "Weight Oracle",
                description: "Measure and verify quantity or weight-based deliverables.",
                icon: "⚖️"
              },
              {
                name: "GPS Oracle",
                description: "Verify workers arrived at the correct location before releasing payment.",
                icon: "📍"
              },
              {
                name: "Custom Oracles",
                description: "Contact us about building custom verification methods for your industry.",
                icon: "🔧"
              }
            ].map((oracle, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-xl p-6 border border-gray-200 hover:border-[#EE964B]/50 transition-all"
              >
                <div className="text-4xl mb-4">{oracle.icon}</div>
                <h3 className="text-lg font-bold text-[#0D3B66] mb-2">
                  {oracle.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {oracle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#0D3B66] to-[#1a5a94]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Hire Verified Workers?
          </h2>
          <p className="text-lg text-blue-100 mb-10">
            Join forward-thinking employers using blockchain technology to build transparent, efficient hiring practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleEmployerLogin}
              className="px-10 py-5 bg-[#EE964B] hover:bg-[#d97b33] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Post Your First Job
            </button>
            <button
              onClick={() => navigate('/about-us')}
              className="px-10 py-5 bg-white/10 border-2 border-white text-white hover:bg-white hover:text-[#0D3B66] font-bold rounded-xl transition-all text-lg backdrop-blur-sm"
            >
              Learn More About Us
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EmployerLandingPage;
