import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import api from "../../services/axios";
import { CheckCircle2 } from "lucide-react";

const INDUSTRIES = [
  "FinTech",
  "HealthTech",
  "AI & Machine Learning",
  "EdTech",
  "CleanTech",
  "SaaS",
  "E-Commerce",
  "AgriTech",
  "PropTech",
  "Blockchain & Crypto",
  "Cybersecurity",
  "IoT",
];
const STAGES = ["IDEA", "PROTOTYPE", "MVP", "GROWTH", "SCALING"];
const TECHS = [
  "React",
  "Python",
  "AI/ML",
  "Blockchain",
  "Cloud",
  "Mobile",
  "IoT",
  "API",
  "TypeScript",
  "Node.js",
  "Docker",
];
const GEO = [
  "North Africa",
  "MENA",
  "Europe",
  "USA",
  "Southeast Asia",
  "Global",
];
const DEAL = ["Equity", "Convertible Note", "SAFE", "Revenue Share", "Grant"];

interface InvestorProfileData {
  industries: string[];
  stages: string[];
  technologies: string[];
  fundingMin: string;
  fundingMax: string;
  currency: string;
  geographicPrefs: string[];
  riskTolerance: "LOW" | "MEDIUM" | "HIGH";
  dealStructures: string[];
   mustHaves: { minTRL?: number; [key: string]: unknown };
  exclusions: { industries?: string[]; [key: string]: unknown };
  investmentThesis: string;
}

const EMPTY: InvestorProfileData = {
  industries: [],
  stages: [],
  technologies: [],
  fundingMin: "",
  fundingMax: "",
  currency: "USD",
  geographicPrefs: [],
  riskTolerance: "MEDIUM",
  dealStructures: [],
  mustHaves: {},
  exclusions: {},
  investmentThesis: "",
};

function ChipToggle({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (v: string) =>
    selected.includes(v)
      ? onChange(selected.filter((x) => x !== v))
      : onChange([...selected, v]);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            selected.includes(o)
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const STEPS = [
  "Industries",
  "Stage & Tech",
  "Funding",
  "Requirements",
  "Geography & Deal",
  "Investment Thesis",
];

export default function InvestorSetupWizard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<InvestorProfileData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: profile } = await api.get("/investor-profile");
        setData({
          industries: profile.industries ?? [],
          stages: profile.stages ?? [],
          technologies: profile.technologies ?? [],
          fundingMin: profile.fundingMin?.toString() ?? "",
          fundingMax: profile.fundingMax?.toString() ?? "",
          currency: profile.currency ?? "USD",
          geographicPrefs: profile.geographicPrefs ?? [],
          riskTolerance: profile.riskTolerance ?? "MEDIUM",
          dealStructures: profile.dealStructures ?? [],
          mustHaves: profile.mustHaves ?? {},
          exclusions: profile.exclusions ?? {},
          investmentThesis: profile.investmentThesis ?? "",
        });
        setHasExisting(true);
      } catch {
        setHasExisting(false);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const set = <K extends keyof InvestorProfileData>(
    key: K,
    val: InvestorProfileData[K],
  ) => setData((d) => ({ ...d, [key]: val }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...data,
        fundingMin: data.fundingMin ? Number(data.fundingMin) : null,
        fundingMax: data.fundingMax ? Number(data.fundingMax) : null,
      };
      if (hasExisting) {
        await api.put("/investor-profile", payload);
      } else {
        await api.post("/investor-profile", payload);
        setHasExisting(true);
      }
      showToast({
        type: "success",
        title: "Profile saved!",
        message: "Your investment preferences have been updated.",
      });
      if (step === STEPS.length - 1) {
        navigate("/app/investor");
      } else {
        setStep((s) => s + 1);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Save failed";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    <div className="space-y-4" key="industries">
      <div>
        <Label className="text-sm font-semibold">
          Which sectors do you invest in?
        </Label>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">
          Select all that apply
        </p>
        <ChipToggle
          options={INDUSTRIES}
          selected={data.industries}
          onChange={(v) => set("industries", v)}
        />
      </div>
    </div>,

    // Step 1: Stage & Tech
    <div className="space-y-6" key="stage-tech">
      <div>
        <Label className="text-sm font-semibold">
          Preferred Startup Stages
        </Label>
        <div className="mt-3">
          <ChipToggle
            options={STAGES}
            selected={data.stages}
            onChange={(v) => set("stages", v)}
          />
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Key Technologies</Label>
        <div className="mt-3">
          <ChipToggle
            options={TECHS}
            selected={data.technologies}
            onChange={(v) => set("technologies", v)}
          />
        </div>
      </div>
    </div>,

    // Step 2: Funding
    <div className="space-y-6" key="funding">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Min Investment ($)</Label>
          <Input
            type="number"
            placeholder="e.g. 50000"
            value={data.fundingMin}
            onChange={(e) => set("fundingMin", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Investment ($)</Label>
          <Input
            type="number"
            placeholder="e.g. 500000"
            value={data.fundingMax}
            onChange={(e) => set("fundingMax", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Risk Tolerance</Label>
        <div className="flex gap-3 mt-2">
          {(["LOW", "MEDIUM", "HIGH"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => set("riskTolerance", r)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                data.riskTolerance === r
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>,
    <div className="space-y-6" key="requirements">
      <div className="space-y-4">
        <Label className="text-sm font-semibold">Must-Have Requirements</Label>
        <p className="text-xs text-gray-500">
          Projects missing these will be penalized (-20 pts)
        </p>
        <div className="space-y-2">
          <Label className="text-xs">Minimum TRL Score (1-9)</Label>
          <Input
            type="number"
            min={1}
            max={9}
            placeholder="e.g. 4 (leave empty for no minimum)"
            value={data.mustHaves?.minTRL?.toString() ?? ""}
            onChange={(e) =>
              set("mustHaves", {
                ...data.mustHaves,
                minTRL: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold">Excluded Industries</Label>
        <p className="text-xs text-gray-500">
          Projects in these industries will score 0
        </p>
        <ChipToggle
          options={INDUSTRIES}
          selected={(data.exclusions?.industries as string[]) ?? []}
          onChange={(v) =>
            set("exclusions", { ...data.exclusions, industries: v })
          }
        />
      </div>
    </div>,

    // Step 4: Geography & Deal
    <div className="space-y-6" key="geo-deal">
      <div>
        <Label className="text-sm font-semibold">Geographic Preferences</Label>
        <div className="mt-3">
          <ChipToggle
            options={GEO}
            selected={data.geographicPrefs}
            onChange={(v) => set("geographicPrefs", v)}
          />
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Deal Structures</Label>
        <div className="mt-3">
          <ChipToggle
            options={DEAL}
            selected={data.dealStructures}
            onChange={(v) => set("dealStructures", v)}
          />
        </div>
      </div>
    </div>,

    // Step 4: Investment Thesis
    <div className="space-y-3" key="thesis">
      <div>
        <Label className="text-sm font-semibold">Your Investment Thesis</Label>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">
          Describe your investment philosophy in detail. This text is passed
          directly to the AI for thesis alignment analysis.
        </p>
        <Textarea
          rows={8}
          placeholder="e.g. I focus on early-stage B2B SaaS companies in MENA that leverage AI to solve operational inefficiencies in traditional industries. I look for founding teams with domain expertise and a clear path to $1M ARR within 18 months..."
          value={data.investmentThesis}
          onChange={(e) => set("investmentThesis", e.target.value)}
          className="resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">
          {data.investmentThesis.length} characters
        </p>
      </div>
    </div>,
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/app/profile/me")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          ← Back to Profile
        </button>
        <h1 className="text-3xl font-semibold text-gray-900">
          {hasExisting ? "Edit Preferences" : "Investor Setup"}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Configure your investment thesis for AI-powered matching
        </p>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-medium transition-all ${
                  step > i
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : step === i
                      ? "border-indigo-600 text-indigo-600 bg-white"
                      : "border-gray-200 text-gray-400 bg-white"
                }`}
              >
                {step > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  step >= i ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                {s}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 transition-all ${step > i ? "bg-indigo-600" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {STEPS[step]}
          </h2>
          <div className="mt-4">{steps[step]}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              ← Back
            </Button>

            <span className="text-xs text-gray-400 font-mono">
              {step + 1} / {STEPS.length}
            </span>

            <div className="flex items-center gap-2">
              {/* Save without advancing */}
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? <LoadingSpinner size="sm" /> : null}
                Save
              </Button>

              {/* Advance to next step  */}
              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue →
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/app/profile/me")}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Done ✓
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
