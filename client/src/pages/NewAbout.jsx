import React, { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import Navbar from "../components/Navbar";

// A component for animated sections that fade in when scrolled into view
const AnimatedSection = ({ children, className = "" }) => {
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className={`transition-opacity duration-1000 ease-in-out ${
        inView ? "opacity-100" : "opacity-0"
      } ${className}`}>
      {children}
    </section>
  );
};

const AboutPage = () => {
  // State to track scroll position for parallax effects
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  const flowSteps = [
    {
      title: "Entry Points",
      items: ["Employer", "Worker"],
    },
    {
      title: "Contract Creation",
      items: [
        "Contract Factory",
        "Requirements & Configuration",
        "Job Posting",
      ],
    },
    {
      title: "Work Period",
      items: ["Escrow System", "Oracle Verification", "Compliance Monitoring"],
    },
    {
      title: "Resolution",
      items: ["Dispute Resolution", "Payment Release"],
    },
  ];
  const techCards = [
    [
      "Front-End Design",
      "Progressive Web App built with React designed for low-bandwidth environments and basic smartphones.",
    ],
    [
      "Blockchain Implementation",
      "Smart contracts implementing interfaces for worker and employer interactions, payments, and dispute resolution.",
    ],
    [
      "Security Measures",
      "Multi-signature escrow wallets, timelock mechanisms, and fraud detection systems to protect worker assets.",
    ],
  ];

  // Update scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#0D3B66] ">
      <Navbar />
      {/* Hero Section with Parallax */}
      <div
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden text-[#0D3B66]">
        <div
          className="absolute inset-0 z-0"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            opacity: 1 - scrollY / 700,
          }}>
          <div className="absolute inset-0 "></div>
          <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1601071761197-9c1f3625e61d')] bg-cover bg-center"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            LUCID LEDGER
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-[#0D3B66]">
            A decentralized application designed to create, manage, and monitor
            fair working conditions through smart contracts
          </p>
        </div>
      </div>

      {/* About Section */}
      <div className="container mx-auto px-4  ">
        <AnimatedSection className="mb-32">
          <h2 className="text-4xl font-bold mb-8 text-center">Our Vision</h2>
          <div className="max-w-3xl mx-auto text-lg text-[#0D3B66] space-y-6">
            <p>
              Lucid Ledger offers a revolutionary approach to addressing labor
              exploitation through blockchain technology. Our decentralized
              application creates a transparent ecosystem where workers,
              employers, and other stakeholders can engage in fair, verifiable,
              and equitable work arrangements without relying on exploitative
              intermediaries.
            </p>
            <p>
              We aim to reimagine traditional labor relationships through a
              comprehensive system that addresses persistent challenges in
              global labor markets by combining technological innovation with
              carefully designed economic incentives.
            </p>
          </div>
        </AnimatedSection>

        {/* Core Components Section */}
        <AnimatedSection className="mb-32">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16 px-20">
            <div className="flex-1 ">
              <h2 className="text-3xl font-bold mb-6 text-[#EE964B]">
                Core Components
              </h2>
              <ul className="space-y-4 text-[#0D3B66]">
                {["Work Contracts", "Contract Factory", "DAOs"].map(
                  (title, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F4D35E] text-[#0D3B66] flex items-center justify-center font-bold mr-3 mt-1">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl">{title}</h3>
                        <p>
                          {title === "Work Contracts"
                            ? "Smart contracts that manage relationships between workers and employers, handling payments, verification, grievances, and more."
                            : title === "Contract Factory"
                            ? "The main entry point for contract creation, providing templates, configuration options, and stakeholder validation."
                            : "Decentralized Autonomous Organizations for workers and employers to govern the system and ensure fair representation."}
                        </p>
                      </div>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="flex-1 h-full">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-1 rounded-lg shadow-xl">
                <div className="bg-gray-900 rounded-lg p-6">
                  <pre className="text-gray-300 overflow-auto">
                    <code>
                      {`// Sample WorkContract code
contract WorkContract {
  address worker;
  address employer;
  uint256 paymentAmount;
  bool workVerified;
  
  event WorkCompleted(
    address indexed worker,
    uint256 paymentAmount
  );

  function verifyWork() public {
    require(msg.sender == employer);
    workVerified = true;
    // Release payment...
  }
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* System Interaction */}
        <AnimatedSection className="mb-32">
          <h2 className="text-3xl font-bold mb-8 text-center">
            System Interaction
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#FAF0CA] rounded-lg p-6 shadow hover:shadow-lg transition-all">
              <h3 className="text-2xl font-bold mb-4 text-[#EE964B]">
                For Workers
              </h3>
              <ul className="space-y-2 text-[#0D3B66]">
                <li>• Access job postings with transparent terms</li>
                <li>• Secure payment through escrow system</li>
                <li>• Verification of work using oracle networks</li>
                <li>• Reputation building through completed contracts</li>
                <li>• Access to grievance handling for disputes</li>
                <li>• Participate in worker DAO governance</li>
              </ul>
            </div>
            <div className="bg-[#FAF0CA] rounded-lg p-6 shadow hover:shadow-lg transition-all">
              <h3 className="text-2xl font-bold mb-4 text-[#EE964B]">
                For Employers
              </h3>
              <ul className="space-y-2 text-[#0D3B66]">
                <li>• Create customized work agreements</li>
                <li>• Access vetted workers with verifiable reputation</li>
                <li>• Objective work verification systems</li>
                <li>• Compliance monitoring and reporting</li>
                <li>• Transparent dispute resolution</li>
                <li>• Participate in employer DAO governance</li>
              </ul>
            </div>
          </div>
        </AnimatedSection>

        {/* Flow Diagram */}
        <AnimatedSection className="mb-32">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Lucid Ledger System Flow
          </h2>
          <div className="max-w-4xl mx-auto bg-[#FAF0CA] p-6 rounded-lg space-y-6 text-center">
            {flowSteps.map((step, i) => (
              <div key={i}>
                <div className="mb-4 p-4 bg-[#F4D35E]/40 rounded-lg w-full md:w-2/3 mx-auto">
                  <h3 className="font-bold text-xl text-[#0D3B66]">
                    {step.title}
                  </h3>
                  <div
                    className={`mt-3 grid ${
                      step.items.length > 2 ? "grid-cols-2" : "flex flex-col"
                    } gap-4`}>
                    {step.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-[#0D3B66] p-3 rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                {i < flowSteps.length - 1 && (
                  <div className="w-px h-12 bg-[#0D3B66] mx-auto"></div>
                )}
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Technical Implementation */}
        <AnimatedSection className="mb-32">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Technical Implementation
          </h2>
          <div className="max-w-3xl mx-auto text-lg text-[#0D3B66] space-y-6">
            <p>
              Lucid Ledger incorporates a comprehensive set of layered
              security...
            </p>
            <p>
              Our technical architecture balances accessibility for users...
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {techCards.map(([title, desc], idx) => (
                <div key={idx} className="bg-[#FAF0CA] p-4 rounded-lg shadow">
                  <h3 className="font-bold text-xl mb-3 text-[#EE964B]">
                    {title}
                  </h3>
                  <p className="text-base text-[#0D3B66]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Join Us Section */}
        <AnimatedSection>
          <div className="bg-gradient-to-r from-[#F4D35E] to-[#EE964B] rounded-xl p-8 md:p-12 max-w-4xl mx-auto text-[#0D3B66] my-10">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Join Our Mission
            </h2>
            <p className="text-lg text-center mb-8">
              Help us create a framework for fair work arrangements...
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-[#0D3B66] text-white font-bold rounded-lg hover:bg-opacity-90 transition-colors">
                Get Involved
              </button>
              <button className="px-6 py-3 bg-transparent border-2 border-[#0D3B66] text-[#0D3B66] font-bold rounded-lg hover:bg-[#0D3B66]/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default AboutPage;
