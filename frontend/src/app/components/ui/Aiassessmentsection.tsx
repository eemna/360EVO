import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../services/axios";
import { useToast } from "../../../context/ToastContext";
import { TRLGauge } from "./Trlgauge";
import { IRProgressRing, AssessmentBreakdown } from "./Ircomponents";
import { AINarrativePanel } from "./Ainarrativepanel";
import { ThesisAlignmentPanel } from "./Thesisalignmentpanel";
import { PitchAnalysisCard } from "./Pitchanalysiscard";
import { LoadingSpinner } from "./LoadingSpinner";
import { BrainCircuit, TrendingUp, Lightbulb, Sparkles } from "lucide-react";

interface AIAssessment {
  trlScore: number;
  trlConfidence: "HIGH" | "MEDIUM" | "LOW";
  irScore: number;
  irBreakdown: {
    financial: number;
    market: number;
    team: number;
    traction: number;
    competitive: number;
  };
  recommendations: string[];
  executiveSummary: string | null;
  strengthsNarrative: string | null;
  risksNarrative: string | null;
  marketOpportunityNarrative: string | null;
  llmModel: string | null;
  assessedAt: string;
}

interface AIAssessmentSectionProps {
  projectId: string;
  projectStatus: string;
  isAdmin?: boolean;
}

export function TRLBadge({ score }: { score: number }) {
  const cls =
    score >= 7
      ? "bg-green-100 text-green-700 border-green-200"
      : score >= 4
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-red-100 text-red-700 border-red-200";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      TRL {score}
    </span>
  );
}

export default function AIAssessmentSection({
  projectId,
  projectStatus,
  isAdmin = false,
}: AIAssessmentSectionProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assessment, setAssessment] = useState<AIAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isInvestor = user?.role === "INVESTOR";
  const isStartup = user?.role === "STARTUP";
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  const startPolling = () => {
    setIsPolling(true);
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const { data } = await api.get(`/ai/assessment/${projectId}`);
        setAssessment(data);

        if (data.llmModel === "groq/moe-4experts") {
          stopPolling();
        } else if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
        }
      } catch {
        stopPolling();
      }
    }, 3000);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/ai/assessment/${projectId}`);
        setAssessment(data);
      } catch {
        setAssessment(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [projectId]);

  const handleTriggerAssessment = async () => {
    try {
      setTriggering(true);
      const { data } = await api.post(`/ai/assess/${projectId}`);
      setAssessment(data);

      if (data.llmModel !== "groq/moe-4experts") {
        startPolling();
      }

      showToast({
        type: "success",
        title: "Assessment complete!",
        message: "AI narrative is being generated...",
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Assessment failed";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="py-12 text-center">
          <BrainCircuit className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            No AI Assessment Yet
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
            {projectStatus === "APPROVED"
              ? "This project has not been assessed yet."
              : "AI assessment is generated automatically when the project is approved."}
          </p>
          {isAdmin && projectStatus === "APPROVED" && (
            <Button
              onClick={handleTriggerAssessment}
              disabled={triggering}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {triggering ? (
                <>
                  <LoadingSpinner size="sm" />
                  Running Assessment...
                </>
              ) : (
                "Run AI Assessment"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">AI Assessment</h2>
          <TRLBadge score={assessment.trlScore} />
        </div>

        <div className="flex items-center gap-2">
          {isPolling && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
              Generating AI narrative...
            </div>
          )}
          {!isPolling && assessment.llmModel === "groq/moe-4experts" && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <Sparkles className="size-3" />
              Groq MoE · 4 experts
            </div>
          )}

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerAssessment}
              disabled={triggering || isPolling}
              className="text-xs gap-1"
            >
              {triggering ? <LoadingSpinner size="sm" /> : "↺ Re-run"}
            </Button>
          )}
        </div>
      </div>

      {/* TRL + IR + Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>⬡</span> TRL Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <TRLGauge
              score={assessment.trlScore}
              confidence={assessment.trlConfidence}
            />
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Investment Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <IRProgressRing score={assessment.irScore} />
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Dimension Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <AssessmentBreakdown breakdown={assessment.irBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* AI Narrative */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span>◈</span> AI Narrative
            {isPolling && <LoadingSpinner size="sm" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AINarrativePanel
            executiveSummary={assessment.executiveSummary}
            strengthsNarrative={assessment.strengthsNarrative}
            risksNarrative={assessment.risksNarrative}
            marketOpportunityNarrative={assessment.marketOpportunityNarrative}
            llmModel={assessment.llmModel}
          />
        </CardContent>
      </Card>

      {/* Recommendations */}
      {isStartup && assessment.recommendations.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Improvement
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {assessment.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3"
                >
                  <span className="text-xs font-bold text-amber-600 mt-0.5 font-mono flex-shrink-0">
                    0{i + 1}
                  </span>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investor only panels */}
      {isInvestor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>⊕</span> Thesis Alignment
                <span className="ml-auto text-xs font-normal text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
                  INVESTOR ONLY
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ThesisAlignmentPanel projectId={projectId} />
            </CardContent>
          </Card>

          <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>◷</span> Pitch Analysis
                <span className="ml-auto text-xs font-normal text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
                  INVESTOR ONLY
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PitchAnalysisCard projectId={projectId} />
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-gray-400 font-mono">
        Last assessed: {new Date(assessment.assessedAt).toLocaleString()}
      </p>
    </div>
  );
}
