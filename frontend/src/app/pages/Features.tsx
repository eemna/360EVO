import { Link } from 'react-router';
import { Lightbulb, BarChart3, Image, Database, MessageSquare, LayoutDashboard, Calendar, Search } from 'lucide-react';

export function Features() {
  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Everything You Need to Move Innovation Forward.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            360EVO is a full-stack platform for deep-tech matching, due diligence, and deal flow — purpose-built for the complexity of real innovation.
          </p>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto space-y-24">
          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Lightbulb className="text-[#1D9E75]" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                AI-Powered Matching Engine
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Automatically connects startups and investors based on technology readiness level (TRL), sector, stage, and investment thesis compatibility.
              </p>
              <p className="text-white/70 mb-4 leading-relaxed">
                Eliminates the "spray and pray" approach to fundraising and deal sourcing. Every match is scored and ranked.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups, Investors, Accelerators</p>
            </div>
            <div className="h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">AI Matching Interface</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">TRL Scoring Dashboard</span>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <BarChart3 className="text-[#1D9E75]" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Technology Readiness Level (TRL) Scoring
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Evaluates technology on the NASA-standard 1–9 TRL scale using AI-assisted input and structured questionnaires.
              </p>
              <p className="text-white/70 mb-4 leading-relaxed">
                Gives investors an immediate, objective signal of maturity. Helps startups understand where they stand before approaching capital.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups, Researchers, University TTOs</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Image className="text-[#1D9E75]" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Project Showcase Gallery
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                A structured profile format where startups and researchers present their technology — including description, team, TRL score, sector tags, and attachments.
              </p>
              <p className="text-white/70 mb-4 leading-relaxed">
                First impressions matter. Your project gallery is your digital pitch — always on, always professional.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups, Researchers</p>
            </div>
            <div className="h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Project Gallery Preview</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Secure Data Room</span>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Database className="text-[#1D9E75]" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Secure Data Room
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Upload and share sensitive documents (pitch decks, financials, patent filings, research reports) with granular access control per recipient.
              </p>
              <p className="text-white/70 mb-4 leading-relaxed">
                Due diligence without the email chaos. Know exactly who viewed what, and when.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups, Investors</p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <MessageSquare className="text-[#1D9E75]" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                In-Platform Messaging
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Direct, secure communication between matched parties without exchanging personal contact information.
              </p>
              <p className="text-white/70 mb-4 leading-relaxed">
                Keeps conversations organized, professional, and tracked — all within the context of your deal or project.
              </p>
              <p className="text-[#C9A84C] text-sm">For: All user types</p>
            </div>
            <div className="h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Messaging Interface</span>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Innovation Dashboard</span>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <LayoutDashboard className="text-[#1D9E75]" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Innovation Dashboard
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                A centralized control panel showing active matches, message threads, document activity, TRL scores, and platform notifications.
              </p>
              <p className="text-white/70 mb-4 leading-relaxed">
                No more scattered tabs. Everything needed to manage your innovation pipeline in one place.
              </p>
              <p className="text-[#C9A84C] text-sm">For: All user types</p>
            </div>
          </div>

          {/* Feature 7 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Calendar className="text-[#1D9E75]" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Events & Networking Hub
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Browse, RSVP, and host deep-tech events, pitch nights, demo days, and networking sessions directly on the platform.
              </p>
              <p className="text-white/70 mb-4 leading-relaxed">
                Community is built through events. 360EVO keeps the conversation going beyond the match.
              </p>
              <p className="text-[#C9A84C] text-sm">For: All user types</p>
            </div>
            <div className="h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Events Hub</span>
            </div>
          </div>

          {/* Feature 8 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 h-64 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span className="text-white/30">Investor Directory</span>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-xl bg-[#1D9E75]/20 flex items-center justify-center mb-6">
                <Search className="text-[#1D9E75]" size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Investor Discovery & Directory
              </h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                A searchable, filtered directory of investors on the platform — filterable by sector, stage, geography, and investment thesis.
              </p>
              <p className="text-white/70 mb-4 leading-relaxed">
                Gives startups visibility into who's actively investing and lets investors build their public profile to attract inbound.
              </p>
              <p className="text-[#C9A84C] text-sm">For: Startups, Investors</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            See the Platform In Action.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors"
            >
              Request a Demo
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:border-white/50 transition-colors"
            >
              Start for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
