import { Link } from 'react-router';
import { Calendar, Rocket, Handshake, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    userType: '',
    message: '',
    requestDemo: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Let's Talk Innovation.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Whether you're a startup looking for capital, an investor sourcing deals, or an institution exploring a partnership — we want to hear from you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column - Form */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">Organization / Company Name</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                    placeholder="Your company"
                  />
                </div>

                {/* ✅ FIXED: Using Radix UI Select with dark theme styling */}
                <div>
                  <label className="block text-white mb-2">I am a:</label>
                  <Select
                    value={formData.userType}
                    onValueChange={(value) => setFormData({ ...formData, userType: value })}
                  >
                    <SelectTrigger className="w-full px-4 py-3 bg-white/5 border-white/20 text-white rounded-lg focus:border-[#1D9E75] h-auto data-[placeholder]:text-white/40">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A2A3A] border-white/10 text-white">
                      <SelectItem value="startup" className="focus:bg-white/10 focus:text-white">Startup Founder</SelectItem>
                      <SelectItem value="investor" className="focus:bg-white/10 focus:text-white">Investor</SelectItem>
                      <SelectItem value="university" className="focus:bg-white/10 focus:text-white">University</SelectItem>
                      <SelectItem value="accelerator" className="focus:bg-white/10 focus:text-white">Accelerator</SelectItem>
                      <SelectItem value="corporate" className="focus:bg-white/10 focus:text-white">Corporate</SelectItem>
                      <SelectItem value="other" className="focus:bg-white/10 focus:text-white">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-white mb-2">Message / What are you looking for?</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                    placeholder="Tell us about your needs..."
                    required
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="demo"
                    checked={formData.requestDemo}
                    onChange={(e) => setFormData({ ...formData, requestDemo: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-[#1D9E75]"
                  />
                  <label htmlFor="demo" className="text-white/80 text-sm">
                    I'd like to request a demo
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors font-medium"
                >
                  Send Message →
                </button>

                <p className="text-white/60 text-sm">
                  We respond to all inquiries within 1 business day. For urgent matters, email us directly at{' '}
                  <a href="mailto:hello@360evo.com" className="text-[#1D9E75] hover:underline">
                    hello@360evo.com
                  </a>
                </p>
              </form>
            </div>

            {/* Right Column - Quick Options */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                  <Calendar className="text-[#1D9E75]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Book a Demo</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Schedule a walkthrough of the platform
                </p>
                <Link
                  to="/contact"
                  className="inline-block px-6 py-2.5 border-2 border-white/30 text-white rounded-lg hover:border-white/50 transition-colors"
                >
                  Schedule Now
                </Link>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                  <Rocket className="text-[#1D9E75]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Join the Platform</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Create your account and get started
                </p>
                <Link
                  to="/register"
                  className="inline-block px-6 py-2.5 border-2 border-white/30 text-white rounded-lg hover:border-white/50 transition-colors"
                >
                  Sign Up
                </Link>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                  <Handshake className="text-[#1D9E75]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Partner with 360EVO</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Explore partnership opportunities
                </p>
                <Link
                  to="/contact"
                  className="inline-block px-6 py-2.5 border-2 border-white/30 text-white rounded-lg hover:border-white/50 transition-colors"
                >
                  Learn More
                </Link>
              </div>

              {/* Contact Details */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-[#1D9E75]" size={20} />
                    <a href="mailto:hello@360evo.com" className="text-white hover:text-[#1D9E75] transition-colors">
                      hello@360evo.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-[#1D9E75]" size={20} />
                    <span className="text-white/80">Chicago, Illinois</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}