import { Link } from 'react-router';

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
            No complicated setup. No learning curve. Just a clear process from first profile to first connection.
          </p>
        </div>
      </section>

      {/* Startup Journey */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0D1B2A] mb-12 text-center">For Startups & Researchers</h2>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#1D9E75] text-white flex items-center justify-center font-bold text-xl">
                  01
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">Create Your Profile</h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  Sign up, describe your technology, team, sector, and stage. Upload any available materials.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">Profile Builder</span>
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">Project Showcase</span>
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
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">Get AI-Scored</h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  The system evaluates your technology readiness (TRL) and investment compatibility score.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">TRL Scoring Engine</span>
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">AI Analysis</span>
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
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">Receive Matches</h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  You're matched with investors whose thesis, sector focus, and stage preference align with your profile.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">AI Matching Engine</span>
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
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">Start the Conversation</h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  Reach out (or accept inbound) via secure in-platform messaging. Share documents from your data room.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">Messaging</span>
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">Data Room</span>
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
                <h3 className="text-2xl font-bold text-[#0D1B2A] mb-3">Track & Close</h3>
                <p className="text-[#0D1B2A]/70 mb-4 leading-relaxed">
                  Monitor your pipeline, manage follow-ups, and track deal progress from your dashboard.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-sm rounded-full">Innovation Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investor Journey */}
      <section className="py-24 px-6 bg-[#0D1B2A]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">For Investors</h2>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#C9A84C] text-[#0D1B2A] flex items-center justify-center font-bold text-xl">
                  01
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-white mb-3">Build Your Profile</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Define your investment thesis, sector focus, preferred stage, and check size range.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">Investor Profile Builder</span>
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
                <h3 className="text-2xl font-bold text-white mb-3">Browse & Receive</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Get AI-curated deal flow. Browse the project gallery or let matches come to you.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">AI Matching</span>
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">Gallery</span>
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
                <h3 className="text-2xl font-bold text-white mb-3">Evaluate Opportunities</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Review TRL scores, team backgrounds, and project details. Request data room access instantly.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">TRL Scores</span>
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">Data Room</span>
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
                <h3 className="text-2xl font-bold text-white mb-3">Connect Directly</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Reach out via secure messaging. No middlemen, no intro emails — just direct access.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">In-Platform Messaging</span>
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
                <h3 className="text-2xl font-bold text-white mb-3">Track Your Pipeline</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  Manage all your active conversations and deal stages in one dashboard.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-[#C9A84C]/20 text-[#C9A84C] text-sm rounded-full">Investor Dashboard</span>
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
            Ready to Try It Yourself?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="px-8 py-4 bg-[#1D9E75] text-white rounded-xl hover:bg-[#1D9E75]/90 transition-colors"
            >
              Create a Free Account
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-[#0D1B2A]/20 text-[#0D1B2A] rounded-xl hover:border-[#0D1B2A]/40 transition-colors"
            >
              Request a Walkthrough
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
