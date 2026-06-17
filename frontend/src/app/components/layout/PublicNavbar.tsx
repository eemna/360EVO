import { useState } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D1B2A] border-b border-white/10">
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-white font-bold text-xl">
          360EVO
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/features"
            className="text-white/90 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            to="/how-it-works"
            className="text-white/90 hover:text-white transition-colors"
          >
            How It Works
          </Link>
          <Link
            to="/pricing"
            className="text-white/90 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/about"
            className="text-white/90 hover:text-white transition-colors"
          >
            About
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-white/90 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/contact"
            className="px-6 py-2.5 bg-[#C9A84C] text-[#0D1B2A] rounded-lg hover:bg-[#D4B55C] transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0D1B2A] border-b border-white/10">
          <div className="flex flex-col px-6 py-4 gap-4">
            <Link
              to="/features"
              className="text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/how-it-works"
              className="text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              to="/pricing"
              className="text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              to="/about"
              className="text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In
            </Link>
            <Link
              to="/contact"
              className="px-6 py-2.5 bg-[#C9A84C] text-[#0D1B2A] rounded-lg text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
