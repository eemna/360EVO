import { Link } from 'react-router';
import { Target, Microscope, Zap, Shield, MapPin, Lightbulb, Database, MessageSquare, BarChart3, Calendar, Search, ArrowRight, GraduationCap, Building2, TrendingUp  } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Where Deep-Tech Meets Its Investors.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed">
            360EVO uses AI to match deep-tech startups with investors who understand your technology, your stage, and your industry — so you spend less time searching and more time building.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/contact"
              className="px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors inline-block"
            >
              Get Early Access
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:border-white/50 transition-colors inline-block"
            >
              Request a Demo
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/20 flex items-center justify-center">
                <Lightbulb className="text-[#1D9E75]" size={24} />
              </div>
              <span className="text-white/80 text-sm">AI-Powered Matching</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/20 flex items-center justify-center">
                <MapPin className="text-[#1D9E75]" size={24} />
              </div>
              <span className="text-white/80 text-sm">Chicago-Based</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/20 flex items-center justify-center">
                <Microscope className="text-[#1D9E75]" size={24} />
              </div>
              <span className="text-white/80 text-sm">Deep-Tech Focused</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#1D9E75]/20 flex items-center justify-center">
                <Shield className="text-[#1D9E75]" size={24} />
              </div>
              <span className="text-white/80 text-sm">Secure & Private</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#0D1B2A] mb-6">
            The Innovation Gap Is Real.
          </h2>
          <p className="text-lg text-[#0D1B2A]/80 max-w-2xl mx-auto leading-relaxed">
            Thousands of breakthrough technologies never reach the market — not because the science isn't there, but because the right investors never found them. Cold emails go unanswered. Demo days are a lottery. And the platforms designed to help were built for social apps, not deep-tech.
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              360EVO Changes the Equation.
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              We built 360EVO for the complexity of deep-tech — not the simplicity of app startups. Our platform uses AI to score technology readiness, assess investment compatibility, and connect the right parties at the right time. No more cold outreach. No more missed connections.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Target className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Precision Matching
              </h3>
              <p className="text-white/70 leading-relaxed">
                Our AI evaluates technology readiness (TRL), sector alignment, and investment stage to surface only the most relevant connections — for both sides.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Microscope className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Built for Deep-Tech
              </h3>
              <p className="text-white/70 leading-relaxed">
                Unlike general platforms, 360EVO understands the language of science, engineering, and research. From biotech to cleantech to advanced materials.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Zap className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Faster Path to Capital
              </h3>
              <p className="text-white/70 leading-relaxed">
                Stop spending months on outreach. Get matched, communicate securely, and move deals forward — all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Teaser */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-[#1D9E75] text-white flex items-center justify-center flex-shrink-0 font-bold">
                    01
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">Create Your Profile</h3>
                    <p className="text-[#0D1B2A]/70 leading-relaxed">
                      Tell us about your technology, your stage, and what you're looking for. Our AI builds your innovation fingerprint.
                    </p>
                  </div>
                </div>
                <div className="border-l-2 border-dashed border-[#1D9E75]/30 h-8 ml-6"></div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-[#1D9E75] text-white flex items-center justify-center flex-shrink-0 font-bold">
                    02
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">Get Matched</h3>
                    <p className="text-[#0D1B2A]/70 leading-relaxed">
                      Our algorithm surfaces the investors, partners, or startups that are the best fit — based on real compatibility, not keywords.
                    </p>
                  </div>
                </div>
                <div className="border-l-2 border-dashed border-[#1D9E75]/30 h-8 ml-6"></div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1D9E75] text-white flex items-center justify-center flex-shrink-0 font-bold">
                    03
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">Connect & Move Forward</h3>
                    <p className="text-[#0D1B2A]/70 leading-relaxed">
                      Reach out through our secure platform, share your data room, track your conversations, and close deals.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link to="/how-it-works" className="text-[#1D9E75] hover:text-[#1D9E75]/80 inline-flex items-center gap-2 font-medium">
                See the Full Process <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
{/* Who Is 360EVO For */}
<section className="py-24 px-6 bg-[#0D1B2A]">
  <div className="max-w-[1280px] mx-auto">
    <h2 className="text-4xl font-bold text-white text-center mb-12">Who Is 360EVO For?</h2>
    <div className="grid md:grid-cols-2 gap-8">
      <div className="p-8 rounded-xl bg-white/5 border border-white/10">
        <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
          <Microscope className="text-[#1D9E75]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Startups & Researchers</h3>
        <ul className="space-y-2 text-white/70 leading-relaxed">
          <li>• You've built something extraordinary. Finding the right investors shouldn't be this hard.</li>
          <li>• Get matched with investors who already understand your technology and are actively deploying capital in your space.</li>
          <li>• Manage your entire fundraising process in one place — from first contact to due diligence.</li>
        </ul>
      </div>

      <div className="p-8 rounded-xl bg-white/5 border border-white/10">
        <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
          <TrendingUp className="text-[#1D9E75]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Investors</h3>
        <ul className="space-y-2 text-white/70 leading-relaxed">
          <li>• Stop sifting through irrelevant deal flow. Get pre-scored opportunities that match your thesis.</li>
          <li>• Our AI-powered readiness scoring tells you the technology maturity level before you take a meeting.</li>
          <li>• Access a curated pipeline of deep-tech opportunities — before the market does.</li>
        </ul>
      </div>

      <div className="p-8 rounded-xl bg-white/5 border border-white/10">
        <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
          <GraduationCap className="text-[#1D9E75]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Universities & TTOs</h3>
        <ul className="space-y-2 text-white/70 leading-relaxed">
          <li>• Turn research into revenue. Connect your faculty innovations with investors and industry partners who are ready to act.</li>
          <li>• Manage your IP portfolio, track commercialization progress, and access a global innovation network.</li>
        </ul>
      </div>

      <div className="p-8 rounded-xl bg-white/5 border border-white/10">
        <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
          <Building2 className="text-[#1D9E75]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Accelerators & Corporates</h3>
        <ul className="space-y-2 text-white/70 leading-relaxed">
          <li>• Scale your portfolio. 360EVO gives your cohort companies ongoing investor access beyond demo day.</li>
          <li>• Corporate innovation teams: identify emerging technology partners before your competitors do.</li>
        </ul>
      </div>
    </div>
  </div>
</section>
<div className="max-w-[1280px] mx-auto px-6">
  <div className="border-t border-white/10" />
</div>
      {/* Platform Highlights */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Lightbulb className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">AI Matching Engine</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Connects you to the right counterparts based on technology readiness, sector, and stage compatibility.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <BarChart3 className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">Technology Readiness Scoring (TRL)</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Know exactly where your technology stands on the universal 1–9 scale before you pitch.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Database className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">Secure Data Room</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Share pitch decks, financials, and IP documents with full control over who sees what.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <MessageSquare className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">In-Platform Messaging</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Communicate directly with investors or startups without exposing personal contact info.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Search className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">Project Showcase Gallery</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Display your innovations in a structured, professional format built for technical audiences.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Calendar className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">Events & Networking Hub</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Discover and join curated deep-tech events, pitch competitions, and demo days.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <BarChart3 className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">Innovation Dashboard</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Track your matches, conversations, milestones, and activity in one clean interface.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/features" className="text-[#1D9E75] hover:text-[#1D9E75]/80 inline-flex items-center gap-2 font-medium">
              Explore All Features <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-4xl font-bold text-[#0D1B2A] text-center mb-12">
            Simple, Transparent Pricing for Every Stage
          </h2>

          <div className="grid md:grid-cols-5 gap-6">
            <div className="p-6 rounded-xl border-2 border-[#0D1B2A]/10">
              <h3 className="font-bold text-[#0D1B2A] mb-2">Starter</h3>
              <p className="text-sm text-[#0D1B2A]/70 mb-3">Early-stage startups</p>
              <p className="text-2xl font-bold text-[#0D1B2A]">Free</p>
            </div>

            <div className="p-6 rounded-xl border-2 border-[#1D9E75]">
              <div className="inline-block px-3 py-1 bg-[#1D9E75] text-white text-xs rounded-full mb-2">
                Most Popular
              </div>
              <h3 className="font-bold text-[#0D1B2A] mb-2">Growth</h3>
              <p className="text-sm text-[#0D1B2A]/70 mb-3">Scaling startups</p>
              <p className="text-2xl font-bold text-[#0D1B2A]">$199/mo</p>
            </div>

            <div className="p-6 rounded-xl border-2 border-[#0D1B2A]/10">
              <h3 className="font-bold text-[#0D1B2A] mb-2">Investor Scout</h3>
              <p className="text-sm text-[#0D1B2A]/70 mb-3">Angel investors</p>
              <p className="text-2xl font-bold text-[#0D1B2A]">$299/mo</p>
            </div>

            <div className="p-6 rounded-xl border-2 border-[#0D1B2A]/10">
              <h3 className="font-bold text-[#0D1B2A] mb-2">Professional</h3>
              <p className="text-sm text-[#0D1B2A]/70 mb-3">VCs / Institutions</p>
              <p className="text-2xl font-bold text-[#0D1B2A]">$999/mo</p>
            </div>

            <div className="p-6 rounded-xl border-2 border-[#0D1B2A]/10">
              <h3 className="font-bold text-[#0D1B2A] mb-2">Enterprise</h3>
              <p className="text-sm text-[#0D1B2A]/70 mb-3">Corporates / Universities</p>
              <p className="text-2xl font-bold text-[#0D1B2A]">Custom</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/pricing" className="text-[#1D9E75] hover:text-[#1D9E75]/80 inline-flex items-center gap-2 font-medium">
              See Full Pricing <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Your Next Breakthrough Starts Here.
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join the platform built for the innovators who are shaping what comes next.
          </p>
          <Link
            to="/contact"
            className="px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors inline-flex items-center gap-2"
          >
            Get Early Access <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
