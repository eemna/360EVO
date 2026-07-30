import { Link } from "react-router";
import { Target, Lightbulb, Users, Globe } from "lucide-react";

export function About() {
  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            We Built the Platform We Wished Existed.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            360EVO exists because too much good technology never finds the right
            room.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6 text-lg text-[#0D1B2A]/90 leading-relaxed">
            <p>
              Our team spent years working in the Chicago innovation ecosystem
              and kept seeing the same problem: brilliant technology stuck
              without a clear path to the people who could fund, license, or
              scale it. Meanwhile, investors and corporate innovation teams were
              struggling to find credible, vetted opportunities outside their
              existing networks. 360EVO was built to close that gap — starting
              in Chicago, with the goal of becoming the connective layer for
              deep-tech innovation nationally.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-16 px-8 py-12 bg-[#1D9E75]/10 border-l-4 border-[#1D9E75] rounded-r-xl">
            <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-3">
              OUR MISSION
            </p>
            <p className="text-2xl text-white font-medium leading-relaxed">
              To make deep-tech innovation discoverable — so the best technology
              finds the right capital, partners, and path to market, regardless
              of who the founder already knows.
            </p>
          </div>
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="border-t border-white/10" />
          </div>
          {/* Values Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Target className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Evidence Over Hype
              </h3>
              <p className="text-white/70 leading-relaxed">
                We rank and match on data, not decks with the best design.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Lightbulb className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Access for Everyone
              </h3>
              <p className="text-white/70 leading-relaxed">
                You shouldn't need a warm intro to get seen.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Users className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Built With the Ecosystem
              </h3>
              <p className="text-white/70 leading-relaxed">
                We work directly with founders, investors, and universities to
                shape the platform.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Globe className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Honesty About Where We Are
              </h3>
              <p className="text-white/70 leading-relaxed">
                We're early. We'd rather tell you that than fake traction we
                don't have.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6">
        <div className="border-t border-white/10" />
      </div>

      {/* Team Section */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            Meet the Team
          </h2>
          <p className="text-center text-white/60 mb-12 max-w-2xl mx-auto">
            A focused team with one obsession: connecting the right technology
            to the right capital.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Users className="text-white/40" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                Team Member Name
              </h3>
              <p className="text-[#1D9E75] text-sm font-medium mb-3">
                Co-Founder & CEO
              </p>
              <p className="text-white/60 text-sm leading-relaxed">Brief bio</p>
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="border-t border-white/10" />
      </div>

      {/* Why Chicago */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            Starting Where the Ecosystem Is Underrated.
          </h2>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="px-8 py-12 bg-white border-l-4 border-[#C9A84C] rounded-r-xl">
            <p className="text-xl text-[#0D1B2A] leading-relaxed">
              Chicago and the Midwest produce world-class research and deep-tech
              talent — through institutions like Northwestern, University of
              Chicago, UIUC, and a growing network of accelerators and
              innovation hubs — without the density of capital that coasts have.
              360EVO starts here because the gap is real, and closing it
              matters.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6">
        <div className="border-t border-white/10" />
      </div>

      {/* Closing CTA */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Want to Be Part of the Next Chapter?
          </h2>
          <Link
            to="/register"
            className="px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors inline-block"
          >
            Get Started →
          </Link>
        </div>
      </section>
    </div>
  );
}
