import { Link } from "react-router";
import {
  Target,
  Microscope,
  Zap,
  Shield,
  MapPin,
  Lightbulb,
  Database,
  MessageSquare,
  BarChart3,
  Calendar,
  Search,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Lock,
} from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Where Deep Tech Meets the People Who Fund It.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed">
            360EVO uses AI-driven matching to connect deep-tech startups with
            the investors, universities, and corporate innovators who are
            actually looking for them — starting in Chicago and the Midwest.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/register"
              className="px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors inline-block font-semibold"
            >
              Get Started Free
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:border-white/50 transition-colors inline-block font-semibold"
            >
              Request Investor Access
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

      {/* THE PROBLEM */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1280px] mx-auto text-center">
          <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-3">
            THE PROBLEM
          </p>
          <h2 className="text-4xl font-bold text-[#0D1B2A] mb-6">
            Great Technology Still Dies in Obscurity.
          </h2>
          <p className="text-lg text-[#0D1B2A]/80 max-w-2xl mx-auto leading-relaxed">
            Startups spend months cold-emailing investors who aren't a fit.
            Investors sift through hundreds of decks to find the handful
            worth a meeting. Universities sit on IP with no clear path to
            commercialization. Everyone is looking — almost no one is
            finding each other efficiently.
          </p>
        </div>
      </section>

      {/* THE SOLUTION — 3 Pillars */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-3">
              HOW 360EVO SOLVES IT
            </p>
            <h2 className="text-4xl font-bold text-white">
              One Platform. Three Things That Actually Move Deals Forward.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Target className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                AI-Driven Matching
              </h3>
              <p className="text-white/70 leading-relaxed">
                We score compatibility between startups and investors on
                stage, sector, and technology readiness — not just keywords.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Shield className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Verified Intelligence
              </h3>
              <p className="text-white/70 leading-relaxed">
                Every profile is structured and evidence-based, so you spend
                time on real signal, not guesswork.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Zap className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                A Shared Language
              </h3>
              <p className="text-white/70 leading-relaxed">
                Startups, investors, universities, and corporate innovation
                teams finally work from the same data and the same process.
              </p>
            </div>
          </div>
        </div>
      </section>

{/* PERSONA SPLIT */}
<section className="py-24 px-6 bg-[#0D1B2A]">
  <div className="max-w-[1280px] mx-auto">
    <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-3 text-center">
      BUILT FOR EVERY SIDE OF THE ECOSYSTEM
    </p>
    <h2 className="text-4xl font-bold text-white text-center mb-16">
      Who Is 360EVO For?
    </h2>
    <div className="grid md:grid-cols-3 gap-8">
      {/* Startups */}
      <div className="p-8 rounded-xl bg-white/5 border border-white/10 flex flex-col">
        <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
          <Microscope className="text-[#1D9E75]" size={28} />
        </div>
        <p className="text-[#1D9E75] text-xs font-semibold tracking-wider mb-2">
          FOR STARTUPS
        </p>
        <h3 className="text-xl font-bold text-white mb-3">
          Get Discovered by Investors Who Are Actually Looking for You.
        </h3>
        <ul className="space-y-2 text-white/70 leading-relaxed mb-6 flex-1">
          <li>
            • AI-matched to relevant investors based on stage and sector
          </li>
          <li>
            • One profile, ready to share — no more chasing warm intros
          </li>
        </ul>
<Link
  to="/contact?as=startup"
  className="text-[#1D9E75] font-semibold hover:underline inline-flex items-center gap-1"
>
  Create Your Free Profile <ArrowRight size={16} />
</Link>
      </div>

      {/* Investors */}
      <div className="p-8 rounded-xl bg-white/5 border border-white/10 flex flex-col">
        <div className="w-14 h-14 rounded-xl bg-[#C9A84C]/20 flex items-center justify-center mb-4">
          <TrendingUp className="text-[#C9A84C]" size={28} />
        </div>
        <p className="text-[#C9A84C] text-xs font-semibold tracking-wider mb-2">
          FOR INVESTORS
        </p>
        <h3 className="text-xl font-bold text-white mb-3">
          Deal Flow That's Already Been Filtered for Fit.
        </h3>
        <ul className="space-y-2 text-white/70 leading-relaxed mb-6 flex-1">
          <li>• AI-scored opportunities matched to your thesis</li>
          <li>
            • Structured data on every startup — no more digging through
            decks for basics
          </li>
        </ul>
<Link
  to="/contact?as=investor"
  className="text-[#C9A84C] font-semibold hover:underline inline-flex items-center gap-1"
>
  Request Investor Access <ArrowRight size={16} />
</Link>
      </div>

      {/* Universities & Corporate Innovation Teams */}
      <div className="p-8 rounded-xl bg-white/5 border border-white/10 flex flex-col">
        <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
          <GraduationCap className="text-[#1D9E75]" size={28} />
        </div>
        <p className="text-[#1D9E75] text-xs font-semibold tracking-wider mb-2">
          FOR UNIVERSITIES & CORPORATE INNOVATION TEAMS
        </p>
        <h3 className="text-xl font-bold text-white mb-3">
          Turn Research and Innovation Into Real Commercial Outcomes.
        </h3>
        <ul className="space-y-2 text-white/70 leading-relaxed mb-6 flex-1">
          <li>
            • Track IP and cohorts, connect them directly to capital and
            industry partners
          </li>
        </ul>
<Link
  to="/contact?as=partner"
  className="text-[#1D9E75] font-semibold hover:underline inline-flex items-center gap-1"
>
  Talk to Our Team <ArrowRight size={16} />
</Link>
      </div>
    </div>
  </div>
</section>

      <div className="max-w-[1280px] mx-auto px-6">
        <div className="border-t border-white/10" />
      </div>

      {/* FEATURES TEASER */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto">
          <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-3 text-center">
            WHAT'S INSIDE THE PLATFORM
          </p>
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Everything You Need, Nothing You Don't.
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Lightbulb className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">
                Matched on Fit, Not Just Keywords
              </h4>
              <p className="text-white/70 text-sm leading-relaxed">
                AI Matching Engine — connects you to the right counterparts
                based on stage, sector, and technology readiness.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <BarChart3 className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">
                Know Exactly Where You Stand
              </h4>
              <p className="text-white/70 text-sm leading-relaxed">
                TRL Scoring — structured scoring of technology maturity on
                the 1–9 scale.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Database className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">
                Share Sensitive Materials, On Your Terms
              </h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Secure Data Room — grant and revoke access per viewer, at
                any time.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <MessageSquare className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">
                Talk Directly, No Middleman
              </h4>
              <p className="text-white/70 text-sm leading-relaxed">
                In-Platform Messaging — connect directly once matched, no
                chasing email threads.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Search className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">
                Your Technology, Presented Properly
              </h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Project Showcase — a structured profile format built for
                deep tech, not a generic company page.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <Calendar className="text-[#1D9E75] mb-3" size={32} />
              <h4 className="text-white font-bold mb-2">
                Stay in the Room, Not Just the Inbox
              </h4>
              <p className="text-white/70 text-sm leading-relaxed">
                Events & Community Access — ecosystem events, cohort
                programming, and updates.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/features"
              className="text-[#C9A84C] hover:text-[#D4B55C] inline-flex items-center gap-2 font-medium"
            >
              See All Features <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
      
{/* How It Works Teaser */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1280px] mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-[#0D1B2A] mb-14 text-center">
              From Sign-Up to First Connection in Three Steps.
            </h2>
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-[#1D9E75] text-white flex items-center justify-center flex-shrink-0 font-bold">
                    01
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">
                      Create Your Profile
                    </h3>
                    <p className="text-[#0D1B2A]/70 leading-relaxed">
                      Tell us about your technology, your stage, and what
                      you're looking for.
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
                    <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">
                      Get AI-Matched
                    </h3>
                    <p className="text-[#0D1B2A]/70 leading-relaxed">
                      Our algorithm surfaces the investors, partners, or
                      startups that are the best fit — based on real
                      compatibility, not keywords.
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
                    <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">
                      Connect Directly
                    </h3>
                    <p className="text-[#0D1B2A]/70 leading-relaxed">
                      Reach out through our secure platform, share your data
                      room, and move forward.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                to="/how-it-works"
                className="text-[#1D9E75] hover:text-[#1D9E75]/80 inline-flex items-center gap-2 font-medium"
              >
                See the Full Process <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
{/* PRICING TEASER */}
<section className="py-24 px-6 bg-[#0D1B2A]">
  <div className="max-w-2xl mx-auto text-center">
    <h2 className="text-4xl font-bold text-white mb-4">
      Simple Pricing. No Surprises.
    </h2>
    <p className="text-white/70 mb-2">
      Start free as a startup. Investors and partners get a plan built
      for how they source deals.
    </p>
    <p className="text-[#C9A84C] font-semibold text-lg mb-8">
      Free to start · Plans from $199/mo.
    </p>
    <Link
      to="/pricing"
      className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:border-white/50 transition-colors inline-flex items-center gap-2"
    >
      See Full Pricing <ArrowRight size={20} />
    </Link>
  </div>
</section>
 <div className="max-w-[1280px] mx-auto px-6">
        <div className="border-t border-white/10" />
      </div>
      {/* TRUST SECTION */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Built by People Who've Sat on Both Sides of the Table.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <MapPin className="text-[#1D9E75]" size={22} />
              </div>
              <p className="text-white/70 leading-relaxed">
                Founder-led, built in Chicago's innovation ecosystem — not a
                generic SaaS bolted onto a database.
              </p>
            </div>
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Lock className="text-[#1D9E75]" size={22} />
              </div>
              <p className="text-white/70 leading-relaxed">
                Data privacy by design — you control who sees your profile
                and materials.
              </p>
            </div>
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Target className="text-[#1D9E75]" size={22} />
              </div>
              <p className="text-white/70 leading-relaxed">
                Structured, evidence-based matching — not a directory, not
                cold-scraped LinkedIn data.
              </p>
            </div>
          </div>
        </div>
      </section>
 <div className="max-w-[1280px] mx-auto px-6">
        <div className="border-t border-white/10" />
      </div>
{/* FINAL CTA BAND */}
<section className="py-24 px-6 bg-[#0D1B2A]">
  <div className="max-w-3xl mx-auto text-center">
    <h2 className="text-4xl font-bold text-white mb-8">
      Ready to Get Discovered — or Discover What's Next?
    </h2>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link
        to="/contact?as=startup"
        className="px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors inline-flex items-center justify-center gap-2 font-semibold"
      >
        Get Started Free <ArrowRight size={20} />
      </Link>
      <Link
        to="/contact?as=investor"
        className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:border-white/50 transition-colors font-semibold"
      >
        Request Investor Access
      </Link>
    </div>
  </div>
</section>
    </div>
  );
}