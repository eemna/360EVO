import { Link } from 'react-router';
import { Check, X} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/Accordion';

export function Pricing() {
  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Simple Pricing. Serious Results.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Whether you're a first-time founder or an institutional investor, 360EVO has a plan built for your stage.
          </p>
        </div>
      </section>

      {/* Startup Tiers */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">For Startups</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <p className="text-white/60 mb-4">Early-stage / pre-revenue startups</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">Free</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Basic profile</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Limited matches (3/mo)</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Community access</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Events</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Growth */}
            <div className="p-8 rounded-xl bg-white/5 border-2 border-[#1D9E75] relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1D9E75] text-white text-sm rounded-full">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Growth</h3>
              <p className="text-white/60 mb-4">Actively fundraising startups</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$199</span>
                <span className="text-white/60">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Unlimited matches</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Data room</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>AI scoring</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Messaging & analytics</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block text-center px-6 py-3 bg-[#C9A84C] text-[#0D1B2A] rounded-lg hover:bg-[#D4B55C] transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Scale */}
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Scale</h3>
              <p className="text-white/60 mb-4">Growth-stage / Series A+</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$499</span>
                <span className="text-white/60">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Everything in Growth</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Priority placement</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Advanced analytics</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Investor Tiers */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">For Investors</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Scout */}
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Scout</h3>
              <p className="text-white/60 mb-4">Angel investors / scouts</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$299</span>
                <span className="text-white/60">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Deal flow access</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>AI-scored opportunities</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Messaging</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Basic filters</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Professional */}
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
              <p className="text-white/60 mb-4">VC funds / family offices</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$999</span>
                <span className="text-white/60">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Full deal flow</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Advanced filters</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Due diligence tools</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Team seats (3)</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Institutional */}
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Institutional</h3>
              <p className="text-white/60 mb-4">Large VCs / corporate VC arms</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Custom seat count</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>API access</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>White-glove onboarding</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>SLA</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Tiers */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">For Institutions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* University */}
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">University / TTO</h3>
              <p className="text-white/60 mb-4">TTOs, research offices</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>IP portfolio management</span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Cohort tracking</span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Investor matchmaking</span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Reporting</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Talk to Sales
              </Link>
            </div>

            {/* Accelerator */}
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Accelerator</h3>
              <p className="text-white/60 mb-4">Accelerators & incubators</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Cohort management</span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Alumni access</span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Investor network</span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Event tools</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Talk to Sales
              </Link>
            </div>

            {/* Corporate */}
            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-2">Corporate</h3>
              <p className="text-white/60 mb-4">Corporate innovation teams</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Startup scouting</span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Innovation radar</span>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-sm">
                  <Check className="text-[#1D9E75] flex-shrink-0 mt-0.5" size={20} />
                  <span>Proprietary deal flow pipeline</span>
                </li>
              </ul>
              <Link
                to="/contact"
                className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
<div className="max-w-[1280px] mx-auto px-6">
  <div className="border-t border-white/10" />
</div>
{/* Feature Comparison Table */}
<section className="py-12 px-6">
  <div className="max-w-[1280px] mx-auto">
    <h2 className="text-3xl font-bold text-white mb-8 text-center">Feature Comparison</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-4 px-4 text-white/60 font-medium w-48">Feature</th>
            {["Starter", "Growth", "Scale", "Scout", "Professional"].map((tier) => (
              <th key={tier} className="py-4 px-4 text-center text-white font-semibold">{tier}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {[
            { feature: "AI Matching",         values: ["Limited", "✓", "✓", "✓", "✓"] },
            { feature: "TRL Scoring",          values: ["✗", "✓", "✓", "✓", "✓"] },
            { feature: "Data Room",            values: ["✗", "✓", "✓", "✗", "✓"] },
            { feature: "In-Platform Messaging",values: ["Limited", "✓", "✓", "✓", "✓"] },
            { feature: "Project Showcase",     values: ["✓", "✓", "✓", "✗", "✗"] },
            { feature: "Investor Directory",   values: ["✗", "✓", "✓", "✓", "✓"] },
            { feature: "Events Access",        values: ["✓", "✓", "✓", "✓", "✓"] },
            { feature: "Analytics Dashboard",  values: ["✗", "Basic", "Advanced", "Basic", "Advanced"] },
            { feature: "Priority Placement",   values: ["✗", "✗", "✓", "✗", "✓"] },
            { feature: "Dedicated Support",    values: ["✗", "✗", "✓", "✗", "✓"] },
          ].map(({ feature, values }) => (
            <tr key={feature} className="hover:bg-white/5 transition-colors">
              <td className="py-4 px-4 text-white/80 font-medium">{feature}</td>
              {values.map((val, i) => (
                <td key={i} className="py-4 px-4 text-center">
                  {val === "✓" ? (
                    <Check className="text-[#1D9E75] mx-auto" size={18} />
                  ) : val === "✗" ? (
                    <X className="text-white/20 mx-auto" size={18} />
                  ) : (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      val === "Limited" ? "bg-[#C9A84C]/20 text-[#C9A84C]" : "bg-white/10 text-white/70"
                    }`}>
                      {val}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</section>
<div className="max-w-[1280px] mx-auto px-6">
  <div className="border-t border-white/10" />
</div>
      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-white/5 border border-white/10 rounded-xl px-6">
              <AccordionTrigger className="text-white hover:text-white/80">
                Is there a free trial?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Yes — the Starter plan is free forever with no credit card required. Paid plans come with a 14-day free trial.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white/5 border border-white/10 rounded-xl px-6">
              <AccordionTrigger className="text-white hover:text-white/80">
                Can I switch plans?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Absolutely. Upgrade or downgrade at any time. Changes take effect at the next billing cycle.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white/5 border border-white/10 rounded-xl px-6">
              <AccordionTrigger className="text-white hover:text-white/80">
                What counts as a "match"?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                A match is a confirmed AI-generated connection between a startup and an investor (or partner) based on compatibility scoring.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white/5 border border-white/10 rounded-xl px-6">
              <AccordionTrigger className="text-white hover:text-white/80">
                Do you take a success fee?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                For certain tiers, 360EVO charges a success fee on completed introductions that lead to investment. This is disclosed upfront per plan.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white/5 border border-white/10 rounded-xl px-6">
              <AccordionTrigger className="text-white hover:text-white/80">
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Yes. All data is encrypted in transit and at rest. You control who sees your documents and can revoke access at any time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
<div className="max-w-[1280px] mx-auto px-6">
  <div className="border-t border-white/10" />
</div>
      {/* Closing CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Not sure which plan is right for you?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              to="/contact"
              className="px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors"
            >
              Talk to the Team
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:border-white/50 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
