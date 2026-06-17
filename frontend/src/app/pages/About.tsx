import { Link } from "react-router";
import { Target, Lightbulb, Users, Globe } from "lucide-react";

export function About() {
  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            We Built 360EVO Because the Innovation Economy Was Broken.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Too many world-changing technologies never found the capital they
            needed. We decided to fix that.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6 text-lg text-[#0D1B2A]/90 leading-relaxed">
            <p>
              Our team spent years watching brilliant researchers and engineers
              struggle to find investors who understood what they were building.
              Not because the technology wasn't ready — but because the tools to
              connect them didn't exist. AngelList was built for apps. LinkedIn
              was built for job seekers. Nothing was built for the complexity of
              deep-tech.
            </p>
            <p>
              So we built 360EVO — a platform designed from the ground up for
              the language of science, engineering, and research. A place where
              a TRL-6 medical device startup and a deep-tech VC could find each
              other in days, not years. Where due diligence starts with real
              data, not guesswork.
            </p>
            <p>
              360EVO's mission is simple: accelerate the path from breakthrough
              to market. We believe the right technology, connected to the right
              capital, can solve the world's hardest problems — and we're
              building the infrastructure to make that happen.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-[1280px] mx-auto">
          {/* Mission Statement */}
          <div className="mb-16 px-8 py-12 bg-[#1D9E75]/10 border-l-4 border-[#1D9E75] rounded-r-xl">
            <p className="text-2xl text-white font-medium leading-relaxed">
              To accelerate the journey from scientific breakthrough to
              real-world impact — by connecting the right innovators with the
              right capital.
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Target className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Precision Over Volume
              </h3>
              <p className="text-white/70 leading-relaxed">
                We don't believe in broadcasting — we believe in matching. Every
                connection on 360EVO is earned by relevance, not random.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Lightbulb className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Deep-Tech First
              </h3>
              <p className="text-white/70 leading-relaxed">
                We were built for complexity. We speak TRL, IP, and due
                diligence — not viral growth metrics.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Users className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Transparency
              </h3>
              <p className="text-white/70 leading-relaxed">
                No black boxes. Founders know how they're scored. Investors know
                what they're getting. Everyone operates on the same data.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-4">
                <Globe className="text-[#1D9E75]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Ecosystem Thinking
              </h3>
              <p className="text-white/70 leading-relaxed">
                We don't serve one side of the market. We build for the entire
                innovation chain — from lab to portfolio to market.
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
      <section className="py-24 px-6 ">
        <div className="max-w-3xl mx-auto">
          <div className="px-8 py-12 bg-white border-l-4 border-[#C9A84C] rounded-r-xl">
            <p className="text-xl text-[#0D1B2A] leading-relaxed">
              We're based in Chicago because this city is quietly one of the
              most important deep-tech ecosystems in the world — home to Argonne
              National Laboratory, Northwestern, UChicago, UI Labs, and a
              growing community of hardtech investors who are hungry for the
              kind of deals 360EVO surfaces. We're proud to be building here.
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
            Ready to Be Part of Something Bigger?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors"
            >
              Join the Platform
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:border-white/50 transition-colors"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
