import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import api from "../../services/axios";
import {
  FileBarChart,
  Sparkles,
  ArrowLeft,
  Printer,
  TrendingUp,
  Users,
  Globe,
  AlertTriangle,
  Building2,
  DollarSign,
  Target,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface DealBrief {
  headline: string;
  companySnapshot: string;
  financialHighlights: string;
  marketOpportunity: string;
  teamStrengths: string;
  keyRisks: string[];
  dueDiligenceFindings: string;
  recommendedNextSteps: string[];
  investorFit: string;
}

interface SavedBrief {
  id: string;
  content: DealBrief;
  generatedAt: string;
  version: number;
}

function SectionCard({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: React.ElementType;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${accent}`}>
            <Icon className="size-3.5 text-white" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function DealBriefPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [brief, setBrief] = useState<SavedBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchBrief = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/data-rooms/${id}/ai/deal-brief`);
      setBrief(data);
    } catch {
      setBrief(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const { data } = await api.post(`/data-rooms/${id}/ai/deal-brief`);
      setBrief(data);
      showToast({
        type: "success",
        title: "Deal brief generated!",
        message: "",
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Generation failed";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header — hidden on print */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1 text-gray-500"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <FileBarChart className="size-5 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              AI Deal Brief
            </h1>
          </div>
          {brief && (
            <span className="text-xs text-gray-400 font-mono">
              v{brief.version} ·{" "}
              {new Date(brief.generatedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {brief && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="size-4" />
                Print / Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={generating}
                className="gap-1"
              >
                {generating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                Regenerate
              </Button>
            </>
          )}
          {!brief && (
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {generating ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {generating ? "Generating..." : "Generate Deal Brief"}
            </Button>
          )}
        </div>
      </div>

      {/* Not generated yet */}
      {!brief && !generating && (
        <Card className="border-2 border-dashed border-indigo-200">
          <CardContent className="py-16 text-center">
            <FileBarChart className="size-10 text-indigo-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Deal Brief Yet
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Generate an AI-powered investor report combining project data, AI
              scores, and document analysis findings.
            </p>
            <Button
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              <Sparkles className="size-4" />
              Generate Deal Brief
            </Button>
          </CardContent>
        </Card>
      )}

      {generating && !brief && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" className="text-indigo-600" />
            <p className="text-sm text-gray-500">
              Analysing project data, documents, and investor thesis...
            </p>
          </CardContent>
        </Card>
      )}

      {/* The Brief — printable */}
      {brief && (
        <div ref={printRef} className="space-y-5">
          {/* Print header */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold">Investor Deal Brief</h1>
            <p className="text-sm text-gray-500">
              Generated {new Date(brief.generatedAt).toLocaleString()}
            </p>
          </div>

          {/* Headline */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl flex-shrink-0">
                  <Sparkles className="size-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
                    Investment Headline
                  </p>
                  <p className="text-lg font-semibold text-indigo-900 leading-relaxed">
                    {brief.content.headline}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investor Fit — highlighted */}
          <Card className="border border-green-200 bg-green-50/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <Target className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
                    Investor Fit
                  </p>
                  <p className="text-sm text-green-800 leading-relaxed">
                    {brief.content.investorFit}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectionCard
              icon={Building2}
              title="Company Snapshot"
              accent="bg-indigo-500"
            >
              <p className="text-sm text-gray-700 leading-relaxed">
                {brief.content.companySnapshot}
              </p>
            </SectionCard>

            <SectionCard
              icon={DollarSign}
              title="Financial Highlights"
              accent="bg-green-500"
            >
              <p className="text-sm text-gray-700 leading-relaxed">
                {brief.content.financialHighlights}
              </p>
            </SectionCard>

            <SectionCard
              icon={Globe}
              title="Market Opportunity"
              accent="bg-blue-500"
            >
              <p className="text-sm text-gray-700 leading-relaxed">
                {brief.content.marketOpportunity}
              </p>
            </SectionCard>

            <SectionCard
              icon={Users}
              title="Team Strengths"
              accent="bg-purple-500"
            >
              <p className="text-sm text-gray-700 leading-relaxed">
                {brief.content.teamStrengths}
              </p>
            </SectionCard>
          </div>

          {/* DD Findings */}
          <SectionCard
            icon={FileBarChart}
            title="Due Diligence Findings"
            accent="bg-gray-500"
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              {brief.content.dueDiligenceFindings}
            </p>
          </SectionCard>

          {/* Key Risks */}
          <Card className="border border-red-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500">
                  <AlertTriangle className="size-3.5 text-white" />
                </div>
                Key Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {brief.content.keyRisks.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-xs font-bold text-red-400 mt-0.5 font-mono flex-shrink-0">
                      0{i + 1}
                    </span>
                    <p className="text-sm text-gray-700">{risk}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Next Steps */}
          <Card className="border border-amber-100 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500">
                  <TrendingUp className="size-3.5 text-white" />
                </div>
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {brief.content.recommendedNextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center pt-2 print:block">
            AI-generated deal brief · 360EVO Platform ·{" "}
            {new Date(brief.generatedAt).toLocaleString()} · v{brief.version}
          </p>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
