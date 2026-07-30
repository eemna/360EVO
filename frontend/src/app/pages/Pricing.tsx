import { useState } from "react";
import { Link } from "react-router";
import { Check, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/Accordion";

const startupPlans = [
  {
    key: "starter",
    name: "Starter",
    audience: "Early-stage / pre-revenue startups",
    monthly: 0,
    features: [
      "Basic profile",
      "Limited matches (3/mo)",
      "Community access",
      "Events",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    key: "growth",
    name: "Growth",
    audience: "Actively fundraising startups",
    monthly: 199,
    features: [
      "Unlimited matches",
      "Data room",
      "AI scoring",
      "Messaging & analytics",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    key: "scale",
    name: "Scale",
    audience: "Growth-stage / Series A+",
    monthly: 499,
    features: [
      "Everything in Growth",
      "Priority placement",
      "Dedicated support",
      "Advanced analytics",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
];

const investorPlans = [
  {
    key: "scout",
    name: "Scout",
    audience: "Angel investors / scouts",
    monthly: 299,
    features: [
      "Deal flow access",
      "AI-scored opportunities",
      "Messaging",
      "Basic filters",
    ],
    cta: "Start Free Trial",
  },
  {
    key: "professional",
    name: "Professional",
    audience: "VC funds / family offices",
    monthly: 999,
    features: [
      "Full deal flow",
      "Advanced filters",
      "Due diligence tools",
      "Team seats (3)",
    ],
    cta: "Start Free Trial",
  },
  {
    key: "institutional",
    name: "Institutional",
    audience: "Large VCs / corporate VC arms",
    monthly: null,
    features: [
      "Custom seat count",
      "API access",
      "White-glove onboarding",
      "SLA",
    ],
    cta: "Talk to Sales",
  },
];

const institutionPlans = [
  {
    key: "university",
    name: "University / TTO",
    audience: "TTOs, research offices",
    features: [
      "IP portfolio tracking",
      "Cohort management",
      "Investor matchmaking",
      "Reporting",
    ],
  },
  {
    key: "accelerator",
    name: "Accelerator",
    audience: "Accelerators & incubators",
    features: [
      "Cohort management",
      "Alumni access",
      "Investor network",
      "Event tools",
    ],
  },
  {
    key: "corporate",
    name: "Corporate",
    audience: "Corporate innovation teams",
    features: [
      "Startup scouting",
      "Innovation radar",
      "Dedicated deal flow pipeline",
    ],
  },
];

function PriceDisplay({
  monthly,
  annual,
}: {
  monthly: number | null;
  annual: boolean;
}) {
  if (monthly === null) {
    return <span className="text-4xl font-bold text-white">Custom</span>;
  }
  if (monthly === 0) {
    return <span className="text-4xl font-bold text-white">Free</span>;
  }
  if (!annual) {
    return (
      <div>
        <span className="text-4xl font-bold text-white">${monthly}</span>
        <span className="text-white/60">/mo</span>
      </div>
    );
  }
  const annualMonthlyEquivalent = Math.round(monthly * 0.8);
  return (
    <div>
      <span className="text-4xl font-bold text-white">
        ${annualMonthlyEquivalent}
      </span>
      <span className="text-white/60">/mo</span>
      <p className="text-white/50 text-sm mt-1">
        Billed ${annualMonthlyEquivalent * 12}/yr
      </p>
    </div>
  );
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Simple Pricing. Serious Results.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-10">
            Whether you're a first-time founder or an institutional investor,
            there's a plan built for your stage.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-2 py-2">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                !annual ? "bg-white text-[#0D1B2A]" : "text-white/60"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                annual ? "bg-white text-[#0D1B2A]" : "text-white/60"
              }`}
            >
              Annual
              <span className="px-2 py-0.5 bg-[#1D9E75] text-white text-xs rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Startup Tiers */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            For Startups
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {startupPlans.map((plan) => (
              <div
                key={plan.key}
                className={`p-8 rounded-xl bg-white/5 relative ${
                  plan.highlight
                    ? "border-2 border-[#1D9E75]"
                    : "border border-white/10"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1D9E75] text-white text-sm rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-white/60 mb-4">{plan.audience}</p>
                <div className="mb-6 min-h-[56px]">
                  <PriceDisplay monthly={plan.monthly} annual={annual} />
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-white/70"
                    >
                      <Check
                        className="text-[#1D9E75] flex-shrink-0 mt-0.5"
                        size={20}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact?as=startup"
                  className={`block text-center px-6 py-3 rounded-lg transition-colors ${
                    plan.highlight
                      ? "bg-[#C9A84C] text-[#0D1B2A] hover:bg-[#D4B55C]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor Tiers */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            For Investors
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {investorPlans.map((plan) => (
              <div
                key={plan.key}
                className="p-8 rounded-xl bg-white/5 border border-white/10"
              >
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-white/60 mb-4">{plan.audience}</p>
                <div className="mb-6 min-h-[56px]">
                  <PriceDisplay monthly={plan.monthly} annual={annual} />
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-white/70"
                    >
                      <Check
                        className="text-[#1D9E75] flex-shrink-0 mt-0.5"
                        size={20}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact?as=investor"
                  className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  {plan.cta}
                  {plan.cta === "Talk to Sales" ? " →" : ""}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional / Partner Tiers */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            For Institutions & Partners
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {institutionPlans.map((plan) => (
              <div
                key={plan.key}
                className="p-8 rounded-xl bg-white/5 border border-white/10"
              >
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-white/60 mb-4">{plan.audience}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">Custom</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-white/70 text-sm"
                    >
                      <Check
                        className="text-[#1D9E75] flex-shrink-0 mt-0.5"
                        size={20}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact?as=partner"
                  className="block text-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Talk to Sales →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6">
        <div className="border-t border-white/10" />
      </div>

      {/* Feature Comparison Table */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white/60 font-medium w-56">
                    Feature
                  </th>
                  {["Starter", "Growth", "Scale", "Scout", "Professional"].map(
                    (tier) => (
                      <th
                        key={tier}
                        className="py-4 px-4 text-center text-white font-semibold"
                      >
                        {tier}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  {
                    feature: "AI Matching",
                    values: ["Limited", "✓", "✓", "✓", "✓"],
                  },
                  {
                    feature: "TRL Scoring",
                    values: ["✗", "✓", "✓", "✓", "✓"],
                  },
                  {
                    feature: "Data Room",
                    values: ["✗", "✓", "✓", "✗", "✓"],
                  },
                  {
                    feature: "Messaging",
                    values: ["Limited", "✓", "✓", "✓", "✓"],
                  },
                  {
                    feature: "Investor/Startup Directory",
                    values: ["✗", "✓", "✓", "✓", "✓"],
                  },
                  {
                    feature: "Analytics",
                    values: ["✗", "Basic", "Advanced", "Basic", "Advanced"],
                  },
                  {
                    feature: "Priority Placement / Support",
                    values: ["✗", "✗", "✓", "✗", "✓"],
                  },
                ].map(({ feature, values }) => (
                  <tr
                    key={feature}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4 text-white/80 font-medium">
                      {feature}
                    </td>
                    {values.map((val, i) => (
                      <td key={i} className="py-4 px-4 text-center">
                        {val === "✓" ? (
                          <Check className="text-[#1D9E75] mx-auto" size={18} />
                        ) : val === "✗" ? (
                          <X className="text-white/20 mx-auto" size={18} />
                        ) : (
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              val === "Limited"
                                ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                                : "bg-white/10 text-white/70"
                            }`}
                          >
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
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem
              value="item-1"
              className="bg-white/5 border border-white/10 rounded-xl px-6"
            >
              <AccordionTrigger className="text-white hover:text-white/80">
                Is there a free trial?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                The Starter plan is free, always — no credit card required. Paid
                plans include a 14-day free trial.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-2"
              className="bg-white/5 border border-white/10 rounded-xl px-6"
            >
              <AccordionTrigger className="text-white hover:text-white/80">
                Can I change plans later?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Yes. Upgrade or downgrade anytime; changes apply at the next
                billing cycle.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-3"
              className="bg-white/5 border border-white/10 rounded-xl px-6"
            >
              <AccordionTrigger className="text-white hover:text-white/80">
                What counts as a "match"?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                A confirmed, AI-generated connection between a startup and an
                investor or partner, based on compatibility scoring.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-4"
              className="bg-white/5 border border-white/10 rounded-xl px-6"
            >
              <AccordionTrigger className="text-white hover:text-white/80">
                Do you take a success fee?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                No standard success fee applies to Starter, Growth, or Scale.
                Any success-based fee on Institutional plans is disclosed and
                negotiated upfront.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-5"
              className="bg-white/5 border border-white/10 rounded-xl px-6"
            >
              <AccordionTrigger className="text-white hover:text-white/80">
                Is my data secure?
              </AccordionTrigger>
              <AccordionContent className="text-white/70">
                Yes. Data is encrypted in transit and at rest. You choose who
                can view your profile and materials, and can revoke access at
                any time.
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
            Not Sure Which Plan Is Right for You?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              to="/contact?as=partner"
              className="px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors"
            >
              Talk to the Team →
            </Link>
            <Link
              to="/contact?as=startup"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:border-white/50 transition-colors"
            >
              Start Free →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
