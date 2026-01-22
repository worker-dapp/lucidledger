import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Lucid Ledger</h3>
            <p className="text-sm text-gray-400">
              Transparent work verification through blockchain technology
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/about-us" className="hover:text-white transition-colors">About</a></li>
              <li><a href="/employers" className="hover:text-white transition-colors">For Employers</a></li>
              <li><a href="/" className="hover:text-white transition-colors">For Workers</a></li>
              <li><a href="/resolve-disputes" className="hover:text-white transition-colors">For Mediators</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/assets/luicid-ledger-whitepaper.pdf" target="_blank" className="hover:text-white transition-colors">
                  White Paper
                </a>
              </li>
              <li>
                <a href="https://github.com/worker-dapp/lucidledger" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://github.com/worker-dapp/lucidledger/graphs/contributors" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Contributors
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://discord.gg/Td4XGPGPT8" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                  <span>💬</span> Discord
                </a>
              </li>
              <li>
                <a href="https://github.com/worker-dapp/lucidledger/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Report Issues
                </a>
              </li>
              <li>
                <a href="https://github.com/worker-dapp/lucidledger/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Contributing
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>© 2026 Lucid Ledger. Open source project. All rights reserved.</p>
          <p className="mt-2">
            Built with transparency, powered by community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
