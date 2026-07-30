import { Link } from "react-router";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0D1B2A] border-t border-white/10 pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Column 1 - Logo & Description */}
          <div>
            <div className="text-white font-bold text-xl mb-3">360EVO</div>
            <p className="text-white/70 text-sm mb-2">
              The matchmaking layer for deep-tech innovation.
            </p>
            <p className="text-white/50 text-sm">Chicago, IL</p>
          </div>

          {/* Column 2 - Product */}
          <div>
            <h4 className="text-white font-medium mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/features"
                  className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm"
                >
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
                <Link
                  to="/about"
                  className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm"
                >
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
                <a
                  href="/privacy"
                  className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-white/70 hover:text-[#1D9E75] transition-colors text-sm"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}

        <div className="pt-8 border-t border-white/10">
          <p className="text-white/60 text-sm text-center">
            © {year} 360DMMC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
