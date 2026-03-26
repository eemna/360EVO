import { useState } from "react";
import { Button } from "./button";
import { LoadingSpinner } from "./LoadingSpinner";
import api from "../../../services/axios";
import { useToast } from "../../../context/ToastContext";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface PitchAnalysis {
  pitchStrengths: string[];
  pitchWeaknesses: string[];
  missingElements: string[];
  overallClarity: number;
  investorAppeal: number;
}

interface PitchAnalysisCardProps {
  projectId: string;
}

function ScorePill({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const color =
    value >= 70 ? "text-green-600 bg-green-50 border-green-200" :
    value >= 40 ? "text-amber-600 bg-amber-50 border-amber-200" :
                  "text-red-600 bg-red-50 border-red-200";

  return (
    <div className={`flex-1 border rounded-xl p-4 text-center ${color}`}>
      <div className="text-3xl font-bold leading-none mb-1">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</div>
    </div>
  );
}

export function PitchAnalysisCard({ projectId }: PitchAnalysisCardProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PitchAnalysis | null>(null);
  const [cached, setCached] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const { data } = await api.post(`/ai/pitch-analysis/${projectId}`);
      setAnalysis(data.data);
      setCached(data.cached ?? false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Pitch analysis failed";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Get AI feedback on pitch clarity and investor appeal.
        </p>
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Analysing...
            </>
          ) : (
            "⚡ Generate Pitch Analysis"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {cached && (
        <span className="text-xs text-gray-400 font-mono">● CACHED</span>
      )}

      {/* Scores */}
      <div className="flex gap-3">
        <ScorePill label="Clarity" value={analysis.overallClarity} />
        <ScorePill label="Investor Appeal" value={analysis.investorAppeal} />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Strengths
          </p>
          <div className="space-y-1.5">
            {analysis.pitchStrengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{s}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Weaknesses
          </p>
          <div className="space-y-1.5">
            {analysis.pitchWeaknesses.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{w}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Missing Elements */}
      {analysis.missingElements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Missing Elements
          </p>
          <div className="space-y-1.5">
            {analysis.missingElements.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{m}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={loading}
        className="text-xs"
      >
        {loading ? <LoadingSpinner size="sm" /> : "↺ Refresh"}
      </Button>
    </div>
  );
}