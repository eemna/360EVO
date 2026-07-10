import { Link } from "react-router";
import { Mail, MapPin, Rocket, TrendingUp, Building2 } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useSearchParams } from "react-router";

type Persona = "startup" | "investor" | "partner";

export function Contact() {
  const [searchParams] = useSearchParams();
  const initialPersona = (searchParams.get("as") as Persona) || "startup";
  const [persona, setPersona] = useState<Persona>(initialPersona);
  const [submitted, setSubmitted] = useState(false);

  // Startup form state
  const [startupForm, setStartupForm] = useState({
    name: "",
    company: "",
    sector: "",
    stage: "",
    email: "",
    password: "",
  });

  // Investor form state
  const [investorForm, setInvestorForm] = useState({
    name: "",
    firm: "",
    checkSize: "",
    sectorFocus: "",
    email: "",
  });

  // Partner form state
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    organization: "",
    role: "",
    lookingFor: "",
    email: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const switchPersona = (p: Persona) => {
    setPersona(p);
    setSubmitted(false);
  };

  const personaTabs: { key: Persona; label: string; icon: typeof Rocket }[] = [
    { key: "startup", label: "I'm a Startup", icon: Rocket },
    { key: "investor", label: "I'm an Investor", icon: TrendingUp },
    {
      key: "partner",
      label: "I'm a University / Accelerator / Corporate Partner",
      icon: Building2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D1B2A]">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Let's Get You Where You're Going.
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Tell us which side of the table you're on — we'll route you to
            the right next step.
          </p>
        </div>
      </section>

      {/* Persona Tabs */}
      <section className="px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            {personaTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => switchPersona(key)}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 transition-colors text-sm font-medium ${
                  persona === key
                    ? "bg-[#1D9E75]/10 border-[#1D9E75] text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column - Form */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              {submitted ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1D9E75]/20 flex items-center justify-center mx-auto mb-6">
                    <Mail className="text-[#1D9E75]" size={28} />
                  </div>
                  <p className="text-xl text-white leading-relaxed">
                    {persona === "startup"
                      ? "You're in. Check your email to finish setting up your profile."
                      : "Thanks — we review every request personally and typically respond within 2 business days."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Startup Form */}
                  {persona === "startup" && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-white mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={startupForm.name}
                          onChange={(e) =>
                            setStartupForm({
                              ...startupForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={startupForm.company}
                          onChange={(e) =>
                            setStartupForm({
                              ...startupForm,
                              company: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="Your company"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Sector</label>
                        <input
                          type="text"
                          value={startupForm.sector}
                          onChange={(e) =>
                            setStartupForm({
                              ...startupForm,
                              sector: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="e.g. Biotech, Robotics, Climate"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Stage</label>
                        <Select
                          value={startupForm.stage}
                          onValueChange={(value) =>
                            setStartupForm({ ...startupForm, stage: value })
                          }
                        >
                          <SelectTrigger className="w-full px-4 py-3 bg-white/5 border-white/20 text-white rounded-lg focus:border-[#1D9E75] h-auto data-[placeholder]:text-white/40">
                            <SelectValue placeholder="Select your stage" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A2A3A] border-white/10 text-white">
                            <SelectItem
                              value="pre-seed"
                              className="focus:bg-white/10 focus:text-white"
                            >
                              Pre-seed / Idea
                            </SelectItem>
                            <SelectItem
                              value="seed"
                              className="focus:bg-white/10 focus:text-white"
                            >
                              Seed
                            </SelectItem>
                            <SelectItem
                              value="series-a"
                              className="focus:bg-white/10 focus:text-white"
                            >
                              Series A+
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={startupForm.email}
                          onChange={(e) =>
                            setStartupForm({
                              ...startupForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={startupForm.password}
                          onChange={(e) =>
                            setStartupForm({
                              ...startupForm,
                              password: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="Create a password"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors font-medium"
                      >
                        Create My Profile →
                      </button>
                    </form>
                  )}

                  {/* Investor Form */}
                  {persona === "investor" && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <p className="text-white/60 text-sm -mt-2 mb-2">
                        Investor access is reviewed before activation to keep
                        deal flow quality high — it isn't instant.
                      </p>
                      <div>
                        <label className="block text-white mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={investorForm.name}
                          onChange={(e) =>
                            setInvestorForm({
                              ...investorForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Firm</label>
                        <input
                          type="text"
                          value={investorForm.firm}
                          onChange={(e) =>
                            setInvestorForm({
                              ...investorForm,
                              firm: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="Your fund or firm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          Check Size Range
                        </label>
                        <input
                          type="text"
                          value={investorForm.checkSize}
                          onChange={(e) =>
                            setInvestorForm({
                              ...investorForm,
                              checkSize: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="e.g. $250K–$1M"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          Sector Focus
                        </label>
                        <input
                          type="text"
                          value={investorForm.sectorFocus}
                          onChange={(e) =>
                            setInvestorForm({
                              ...investorForm,
                              sectorFocus: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="e.g. Deep tech, Climate, Biotech"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={investorForm.email}
                          onChange={(e) =>
                            setInvestorForm({
                              ...investorForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors font-medium"
                      >
                        Request Access →
                      </button>
                    </form>
                  )}

                  {/* Partner Form */}
                  {persona === "partner" && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-white mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={partnerForm.name}
                          onChange={(e) =>
                            setPartnerForm({
                              ...partnerForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          Organization
                        </label>
                        <input
                          type="text"
                          value={partnerForm.organization}
                          onChange={(e) =>
                            setPartnerForm({
                              ...partnerForm,
                              organization: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="University, accelerator, or company"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Role</label>
                        <input
                          type="text"
                          value={partnerForm.role}
                          onChange={(e) =>
                            setPartnerForm({
                              ...partnerForm,
                              role: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="Your title / role"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          What Are You Looking For?
                        </label>
                        <textarea
                          value={partnerForm.lookingFor}
                          onChange={(e) =>
                            setPartnerForm({
                              ...partnerForm,
                              lookingFor: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="Tell us about the partnership you're exploring..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={partnerForm.email}
                          onChange={(e) =>
                            setPartnerForm({
                              ...partnerForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#1D9E75]"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors font-medium"
                      >
                        Talk to Our Team →
                      </button>
                    </form>
                  )}

                  <p className="text-white/60 text-sm mt-6">
                    Still deciding? Check out{" "}
                    <Link
                      to="/pricing"
                      className="text-[#1D9E75] hover:underline"
                    >
                      Pricing
                    </Link>{" "}
                    or the{" "}
                    <Link to="/faq" className="text-[#1D9E75] hover:underline">
                      FAQ
                    </Link>
                    .
                  </p>
                </>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-[#1D9E75]" size={20} />
                    <a
                      href="mailto:hello@360evo.com"
                      className="text-white hover:text-[#1D9E75] transition-colors"
                    >
                      hello@360evo.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-[#1D9E75]" size={20} />
                    <span className="text-white/80">Chicago, Illinois</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                <h3 className="text-xl font-bold text-white mb-3">
                  Not sure yet?
                </h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  See what's included at every tier, or get answers to common
                  questions before you reach out.
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/pricing"
                    className="inline-block px-6 py-2.5 border-2 border-white/30 text-white rounded-lg hover:border-white/50 transition-colors text-center"
                  >
                    View Pricing
                  </Link>
                  <Link
                    to="/faq"
                    className="inline-block px-6 py-2.5 border-2 border-white/30 text-white rounded-lg hover:border-white/50 transition-colors text-center"
                  >
                    Read the FAQ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}