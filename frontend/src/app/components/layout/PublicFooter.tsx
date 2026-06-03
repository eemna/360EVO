import { Link } from 'react-router';
import { Linkedin, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0D1B2A] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Column 1 - Logo & Social */}
          <div>
            <div className="text-white font-bold text-xl mb-3">360EVO</div>
            <p className="text-white/70 text-sm mb-4">
              Connecting deep-tech innovation to capital
            </p>
            <div className="flex gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-[#1D9E75] transition-colors"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-[#1D9E75] transition-colors"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Column 2 - Platform */}
          <div>
            <h4 className="text-white font-medium mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Company */}
          <div>
            <h4 className="text-white font-medium mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Legal */}
          <div>
            <h4 className="text-white font-medium mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="/privacy" className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-white/70 hover:text-[#e8eef5]transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/cookies" className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-white/60 text-sm text-center">
            © 2025 360EVO / 360DMMC. All rights reserved. Chicago, Illinois.
          </p>
        </div>
      </div>
    </footer>
  );
}
