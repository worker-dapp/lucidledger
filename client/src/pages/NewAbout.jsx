import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import Navbar from "../components/Navbar";

// Animated section component
const AnimatedSection = ({ children, className = "" }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className={`transition-opacity duration-1000 ${
        inView ? "opacity-100" : "opacity-0"
      } ${className}`}>
      {children}
    </section>
  );
};

const AboutPage = () => {
  const [scrollY, setScrollY] = useState(0);

  const verificationMethods = [
    {
      icon: "📍",
      title: "Location Verification",
      description: "Real-time location tracking to verify work site attendance",
    },
    {
      icon: "📸",
      title: "Image Verification",
      description: "Photo evidence of completed work and quality checks",
    },
    {
      icon: "⚖️",
      title: "Weight/Quantity",
      description: "Automated measurement of physical outputs and deliverables",
    },
    {
      icon: "🕐",
      title: "Time Tracking",
      description: "Precise logging of work hours and task completion",
    },
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div
          className="absolute inset-0 opacity-10"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158')] bg-cover bg-center"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
            Preventing Wage Theft Through Transparency
          </h1>
          <p className="text-xl md:text-2xl text-blue-100">
            Blockchain-powered platform protecting workers in low- and middle-income countries with automated verification and guaranteed payments
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Problem & Solution */}
        <AnimatedSection className="py-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">The Problem We Solve</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
              <h3 className="text-xl font-semibold mb-3 text-red-900">Traditional Platforms</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✗ Opaque verification processes</li>
                <li>✗ Payment disputes and delays</li>
                <li>✗ No work verification standards</li>
                <li>✗ Exploitation by intermediaries</li>
              </ul>
            </div>
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
              <h3 className="text-xl font-semibold mb-3 text-green-900">Lucid Ledger Solution</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Transparent oracle verification</li>
                <li>✓ Automated escrow payments</li>
                <li>✓ Multi-method work validation</li>
                <li>✓ Direct worker-employer connection</li>
              </ul>
            </div>
          </div>
        </AnimatedSection>

        {/* Resources Section - Moved up for prominence */}
        <AnimatedSection className="py-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Learn More</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="/assets/luicid-ledger-whitepaper.pdf" 
              target="_blank"
              className="flex items-start p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all group">
              <span className="text-4xl mr-4 group-hover:scale-110 transition-transform">📄</span>
              <div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600">White Paper</h3>
                <p className="text-gray-600">Read our comprehensive technical overview and vision for the platform</p>
              </div>
            </a>

            <a 
              href="https://github.com/worker-dapp/lucidledger" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all group">
              <span className="text-4xl mr-4 group-hover:scale-110 transition-transform">💻</span>
              <div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600">GitHub Repository</h3>
                <p className="text-gray-600">Explore our open-source code and contribute to development</p>
              </div>
            </a>

            <a 
              href="https://github.com/worker-dapp/lucidledger/graphs/contributors" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all group">
              <span className="text-4xl mr-4 group-hover:scale-110 transition-transform">👥</span>
              <div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600">Contributors</h3>
                <p className="text-gray-600">Meet the community members building Lucid Ledger</p>
              </div>
            </a>

            <a 
              href="https://discord.gg/Td4XGPGPT8" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all group">
              <span className="text-4xl mr-4 group-hover:scale-110 transition-transform">💬</span>
              <div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600">Discord Community</h3>
                <p className="text-gray-600">Join our Discord server to discuss ideas and get support</p>
              </div>
            </a>
          </div>
        </AnimatedSection>

        {/* How It Works - Oracle Verification */}
        <AnimatedSection className="py-12 bg-gray-50 -mx-4 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-3 text-center">How It Works</h2>
            <p className="text-lg text-gray-600 text-center mb-10">
              Our oracle network provides transparent, automated work verification through multiple methods
            </p>
            
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {verificationMethods.map((method, idx) => (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-4 text-center">{method.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 text-center">{method.title}</h3>
                  <p className="text-sm text-gray-600 text-center">{method.description}</p>
                </div>
              ))}
            </div>

            {/* System Flow Diagram */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-center">Complete System Flow</h3>
              <div className="overflow-x-auto">
                <div className="mermaid-container bg-gray-50 p-6 rounded-lg border-2 border-gray-200 max-h-[600px] overflow-y-auto">
                  <svg viewBox="0 0 800 920" className="mx-auto w-full max-w-2xl" style={{ height: 'auto', maxHeight: '550px' }}>
                    {/* Employer Entry */}
                    <rect x="250" y="10" width="100" height="40" fill="#4A5568" stroke="#2D3748" strokeWidth="2" rx="5"/>
                    <text x="300" y="35" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Employer</text>
                    
                    {/* Worker Entry */}
                    <rect x="450" y="70" width="100" height="40" fill="#4A5568" stroke="#2D3748" strokeWidth="2" rx="5"/>
                    <text x="500" y="95" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">Worker</text>
                    
                    {/* Arrows from Entry Points */}
                    <path d="M 300 50 L 300 100" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 500 110 L 500 140" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    
                    {/* Employer Landing */}
                    <rect x="220" y="100" width="130" height="40" fill="#E2E8F0" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="285" y="125" textAnchor="middle" fill="#2D3748" fontSize="13">Employer Landing</text>
                    
                    {/* Worker Landing */}
                    <rect x="420" y="140" width="130" height="40" fill="#E2E8F0" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="485" y="165" textAnchor="middle" fill="#2D3748" fontSize="13">Worker Landing</text>
                    
                    {/* Recruitment Hub */}
                    <rect x="200" y="200" width="150" height="40" fill="#C3DAFE" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="275" y="225" textAnchor="middle" fill="#2D3748" fontSize="13" fontWeight="bold">Recruitment Hub</text>
                    
                    {/* Job Posting */}
                    <rect x="380" y="280" width="120" height="40" fill="#C6F6D5" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="440" y="305" textAnchor="middle" fill="#2D3748" fontSize="13" fontWeight="bold">Job Posting</text>
                    
                    {/* Arrows to Job Posting */}
                    <path d="M 285 140 L 285 200" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 275 240 L 380 280" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 485 180 L 440 280" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    
                    {/* Application */}
                    <rect x="360" y="360" width="160" height="50" fill="#E2E8F0" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="440" y="380" textAnchor="middle" fill="#2D3748" fontSize="12">Application</text>
                    <text x="440" y="397" textAnchor="middle" fill="#2D3748" fontSize="11">Check Reputation</text>
                    
                    {/* Work Contract */}
                    <rect x="370" y="450" width="140" height="40" fill="#C6F6D5" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="440" y="475" textAnchor="middle" fill="#2D3748" fontSize="13" fontWeight="bold">Work Contract</text>
                    
                    {/* Arrow */}
                    <path d="M 440 320 L 440 360" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 440 410 L 440 450" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    
                    {/* Work Period */}
                    <rect x="380" y="530" width="120" height="40" fill="#C6F6D5" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="440" y="555" textAnchor="middle" fill="#2D3748" fontSize="13" fontWeight="bold">Work Period</text>
                    
                    {/* Arrow */}
                    <path d="M 440 490 L 440 530" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    
                    {/* Escrow System */}
                    <rect x="150" y="610" width="130" height="40" fill="#C3DAFE" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="215" y="635" textAnchor="middle" fill="#2D3748" fontSize="12">Escrow System</text>
                    
                    {/* Oracle Network */}
                    <rect x="50" y="690" width="180" height="60" fill="#C3DAFE" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="140" y="710" textAnchor="middle" fill="#2D3748" fontSize="12" fontWeight="bold">Oracle Network</text>
                    <text x="140" y="728" textAnchor="middle" fill="#2D3748" fontSize="10">GPS/Image/Weight/Time</text>
                    
                    {/* Compliance System */}
                    <rect x="320" y="690" width="140" height="40" fill="#C3DAFE" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="390" y="715" textAnchor="middle" fill="#2D3748" fontSize="11">Compliance System</text>
                    
                    {/* Survey System */}
                    <rect x="500" y="690" width="120" height="40" fill="#C3DAFE" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="560" y="715" textAnchor="middle" fill="#2D3748" fontSize="11">Survey System</text>
                    
                    {/* Worker/Employer DAOs */}
                    <rect x="650" y="530" width="140" height="40" fill="#C3DAFE" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="720" y="555" textAnchor="middle" fill="#2D3748" fontSize="11">Worker/Employer DAOs</text>
                    
                    {/* Arrows from Work Period */}
                    <path d="M 380 550 L 280 610" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 215 650 L 140 690" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 280 630 L 360 690" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 440 570 L 440 690" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 500 550 L 650 550" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    
                    {/* Dispute Resolution */}
                    <rect x="520" y="790" width="160" height="50" fill="#C3DAFE" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="600" y="810" textAnchor="middle" fill="#2D3748" fontSize="12">Dispute Resolution</text>
                    <text x="600" y="827" textAnchor="middle" fill="#2D3748" fontSize="10">Arbitration/Grievance</text>
                    
                    {/* Payment Release */}
                    <rect x="200" y="800" width="140" height="40" fill="#E2E8F0" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="270" y="825" textAnchor="middle" fill="#2D3748" fontSize="12" fontWeight="bold">Payment Release</text>
                    
                    {/* Reputation System */}
                    <rect x="360" y="870" width="160" height="40" fill="#E2E8F0" stroke="#4A5568" strokeWidth="2" rx="5"/>
                    <text x="440" y="895" textAnchor="middle" fill="#2D3748" fontSize="12" fontWeight="bold">Reputation System</text>
                    
                    {/* Final Arrows */}
                    <path d="M 560 730 L 600 790" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 390 730 L 270 800" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 270 840 L 400 870" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    <path d="M 600 840 L 480 870" stroke="#4A5568" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)"/>
                    
                    {/* Arrow marker definition */}
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="#4A5568" />
                      </marker>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Technology Stack */}
        <AnimatedSection className="py-12 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Technology Stack</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">Frontend</h3>
              <p className="text-gray-700 mb-4">
                Modern, accessible user interface built for workers and employers worldwide.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">React</span>
                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">TailwindCSS</span>
                <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">Vite</span>
              </div>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Backend</h3>
              <p className="text-gray-700 mb-4">
                Robust API layer connecting users to blockchain functionality securely.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm">Express.js</span>
                <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm">PostgreSQL</span>
                <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm">Node.js</span>
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-green-900">Blockchain</h3>
              <p className="text-gray-700 mb-4">
                Smart contracts for escrow, payment automation, and dispute resolution with oracle integration.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">Smart Contracts</span>
                <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">Oracles</span>
                <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm">DAOs</span>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Open Source Community */}
        <AnimatedSection className="py-12 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-4 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Open Source & Community-Driven</h2>
            <p className="text-lg text-gray-700 mb-8">
              Lucid Ledger is built in the open. Our code, development process, and governance are transparent and accessible to all.
            </p>
            <div className="flex items-center justify-center gap-4 text-6xl mb-6">
              <span title="Open Source">🔓</span>
              <span title="Community">👥</span>
              <span title="Collaboration">🤝</span>
              <span title="Transparent">🔍</span>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              When workers and employers can verify the code powering their agreements, trust is built into the system itself. Join our community to help shape the future of fair work.
            </p>
          </div>
        </AnimatedSection>

        {/* Call to Action */}
        <AnimatedSection className="py-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-10 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
            <p className="text-xl mb-8 text-blue-100">
              Help us build a future where work verification is transparent, payments are guaranteed, and exploitation is eliminated.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://github.com/worker-dapp/lucidledger"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                Start Contributing
              </a>
              <a 
                href="https://discord.gg/Td4XGPGPT8"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                Join Discord
              </a>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default AboutPage;
