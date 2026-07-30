import { Link } from "react-router";
import {
  Target,
  BarChart3,
  Lock,
  MessageSquare,
  Layers,
  Users,
  LineChart,
  Calendar,
} from "lucide-react";

export function Features() {
  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            One Platform. Every Piece of the Innovation Pipeline.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            From first profile to funded deal — here's everything built into
            360EVO.
          </p>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto space-y-24">
          {/* Feature 1 — AI Matching Engine */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Target className="text-[#1D9E75]" size={32} />
              </div>
              <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-2">
                AI MATCHING ENGINE
              </p>
              <h3 className="text-3xl font-bold text-white mb-4">
                Matched on Fit, Not Just Keywords
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Scores compatibility between startups and investors/partners
                using stage, sector, technology readiness, and stated thesis —
                surfacing the connections most likely to go somewhere.
              </p>
              <p className="text-[#C9A84C] text-sm">For: All user types</p>
            </div>
            <div className="h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">AI Matching Interface</span>
            </div>
          </div>

          {/* Feature 2 — TRL Scoring */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">TRL Scoring Dashboard</span>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <BarChart3 className="text-[#1D9E75]" size={32} />
              </div>
              <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-2">
                TECHNOLOGY READINESS (TRL) SCORING
              </p>
              <h3 className="text-3xl font-bold text-white mb-4">
                Know Exactly Where You Stand
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Structured scoring of a startup's technology maturity, so
                investors can quickly gauge risk and founders know how to talk
                about their stage.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups, Investors</p>
            </div>
          </div>

          {/* Feature 3 — Secure Data Room */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Lock className="text-[#1D9E75]" size={32} />
              </div>
              <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-2">
                SECURE DATA ROOM
              </p>
              <h3 className="text-3xl font-bold text-white mb-4">
                Share Sensitive Materials, On Your Terms
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Upload pitch decks, IP documentation, and financials into a
                controlled data room — grant and revoke access per viewer, at
                any time.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups, Investors</p>
            </div>
            <div className="h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Secure Data Room</span>
            </div>
          </div>

          {/* Feature 4 — In-Platform Messaging */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Messaging Interface</span>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <MessageSquare className="text-[#1D9E75]" size={32} />
              </div>
              <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-2">
                IN-PLATFORM MESSAGING
              </p>
              <h3 className="text-3xl font-bold text-white mb-4">
                Talk Directly, No Middleman
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Once matched, connect directly inside the platform — no chasing
                email threads or hoping a warm intro comes through.
              </p>
              <p className="text-[#C9A84C] text-sm">For: All user types</p>
            </div>
          </div>

          {/* Feature 5 — Project / Technology Showcase */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Layers className="text-[#1D9E75]" size={32} />
              </div>
              <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-2">
                PROJECT / TECHNOLOGY SHOWCASE
              </p>
              <h3 className="text-3xl font-bold text-white mb-4">
                Your Technology, Presented Properly
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                A structured profile format built for deep tech — not a generic
                company page — so technical differentiation actually comes
                through.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups</p>
            </div>
            <div className="h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Project Showcase Preview</span>
            </div>
          </div>

          {/* Feature 6 — Investor & Partner Directory */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Investor Directory</span>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Users className="text-[#1D9E75]" size={32} />
              </div>
              <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-2">
                INVESTOR & PARTNER DIRECTORY
              </p>
              <h3 className="text-3xl font-bold text-white mb-4">
                See Who's Actually Looking
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Browse investor and partner profiles by sector, stage focus, and
                check size, so outreach starts with fit already confirmed.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups</p>
            </div>
          </div>

          {/* Feature 7 — Analytics Dashboard */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <LineChart className="text-[#1D9E75]" size={32} />
              </div>
              <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-2">
                ANALYTICS DASHBOARD
              </p>
              <h3 className="text-3xl font-bold text-white mb-4">
                See What's Working
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Track profile views, match quality, and engagement over time —
                so you know whether your positioning is landing.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups, Investors</p>
            </div>
            <div className="h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Analytics Dashboard</span>
            </div>
          </div>

          {/* Feature 8 — Events & Community Access */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Events Hub</span>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Calendar className="text-[#1D9E75]" size={32} />
              </div>
              <p className="text-[#1D9E75] text-sm font-semibold tracking-wider mb-2">
                EVENTS & COMMUNITY ACCESS
              </p>
              <h3 className="text-3xl font-bold text-white mb-4">
                Stay in the Room, Not Just the Inbox
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Access to ecosystem events, cohort programming, and community
                updates from 360EVO and its partners.
              </p>
              <p className="text-[#C9A84C] text-sm">For: All user types</p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            See It Work for You.
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
