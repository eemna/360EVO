import { Link } from "react-router";

export function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            From Sign-Up to Funded — Here's How 360EVO Works.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            No complicated setup. No learning curve. Just a clear process from
            first profile to first connection.
          </p>
        </div>
      </section>

      {/* Startup Journey */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0D1B2A] mb-12 text-center">
            For Startups
          </h2>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#1D9E75] text-white flex items-center justify-center font-bold text-xl">
                  01
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">
                  Create Your Profile
                </h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  Sign up, describe your technology, team, sector, and stage.
                  Upload any available materials.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">
                    Profile Builder
                  </span>
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">
                    Project Showcase
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-8 border-l-2 border-dashed border-[#1D9E75]/30 h-8"></div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#1D9E75] text-white flex items-center justify-center font-bold text-xl">
                  02
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">
                  Get AI-Scored
                </h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  The platform evaluates your technology readiness (TRL) and
                  investor-compatibility score.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">
                    TRL Scoring
                  </span>
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">
                    AI Matching
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-8 border-l-2 border-dashed border-[#1D9E75]/30 h-8"></div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#1D9E75] text-white flex items-center justify-center font-bold text-xl">
                  03
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">
                  Get Matched
                </h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  You're surfaced to investors and partners whose stated thesis
                  fits your stage and sector.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">
                    AI Matching
                  </span>
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">
                    Investor Directory
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-8 border-l-2 border-dashed border-[#1D9E75]/30 h-8"></div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#1D9E75] text-white flex items-center justify-center font-bold text-xl">
                  04
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">
                  Connect Directly
                </h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  Message matched investors directly inside the platform — no
                  cold email required.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">
                    In-Platform Messaging
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-8 border-l-2 border-dashed border-[#1D9E75]/30 h-8"></div>

            {/* Step 5 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#1D9E75] text-white flex items-center justify-center font-bold text-xl">
                  05
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">
                  Share Securely
                </h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  Grant data room access to serious conversations, revoke it
                  anytime.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">
                    Secure Data Room
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investor Journey */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            For Investors
          </h2>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#C9A84C] text-[#0D1B2A] flex items-center justify-center font-bold text-xl">
                  01
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Set Your Thesis
                </h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Define sector, stage, and check-size preferences during
                  onboarding.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">
                    Profile Builder
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-8 border-l-2 border-dashed border-[#C9A84C]/30 h-8"></div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#C9A84C] text-[#0D1B2A] flex items-center justify-center font-bold text-xl">
                  02
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Receive Scored Deal Flow
                </h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  See startups AI-matched to your thesis, each with a TRL and
                  compatibility score.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">
                    AI Matching
                  </span>
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">
                    TRL Scoring
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-8 border-l-2 border-dashed border-[#C9A84C]/30 h-8"></div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#C9A84C] text-[#0D1B2A] flex items-center justify-center font-bold text-xl">
                  03
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Review Structured Data
                </h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Skip the inbox triage — every profile follows the same
                  structured format.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">
                    Project Showcase
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-8 border-l-2 border-dashed border-[#C9A84C]/30 h-8"></div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#C9A84C] text-[#0D1B2A] flex items-center justify-center font-bold text-xl">
                  04
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Message Directly
                </h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Reach out to startups that fit, inside the platform.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">
                    In-Platform Messaging
                  </span>
                </div>
              </div>
            </div>

            <div className="ml-8 border-l-2 border-dashed border-[#C9A84C]/30 h-8"></div>

            {/* Step 5 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#C9A84C] text-[#0D1B2A] flex items-center justify-center font-bold text-xl">
                  05
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Track Your Pipeline
                </h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Use the analytics dashboard to monitor engagement across your
                  deal flow.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">
                    Analytics Dashboard
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#0D1B2A] mb-8">
            See How It Works for Your Side of the Table.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact?as=startup"
              className="px-8 py-4 bg-[#1D9E75] text-white rounded-xl hover:bg-[#1D9E75]/90 transition-colors"
            >
              Get Started Free →
            </Link>
            <Link
              to="/contact?as=investor"
              className="px-8 py-4 border-2 border-[#0D1B2A]/20 text-[#0D1B2A] rounded-xl hover:border-[#0D1B2A]/40 transition-colors"
            >
              Request Investor Access →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
