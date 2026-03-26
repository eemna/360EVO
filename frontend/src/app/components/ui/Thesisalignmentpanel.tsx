import { useState } from "react";
import { Button } from "./button";
import { LoadingSpinner } from "./LoadingSpinner";
//import { Badge } from "../components/ui/badge";
import api from "../../../services/axios";
import { useToast } from "../../../context/ToastContext";
import { ChevronDown } from "lucide-react";

interface ThesisAlignment {
  alignmentScore: number;
  alignmentSummary: string;
  thesisMatches: string[];
  thesisMismatches: string[];
  recommendedQuestions: string[];
}

interface ThesisAlignmentPanelProps {
  projectId: string;
}

function alignColor(score: number) {
  if (score >= 70) return "#16a34a";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

function AlignmentRing({ score, size = 80 }: { score: number; size?: number }) {
  const cx = size / 2;
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = alignColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.09} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.09}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text
        x={cx}
        y={cx}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: "inherit", fontSize: size * 0.22, fontWeight: 700, fill: color }}
      >
        {score}
      </text>
    </svg>
  );
}

export function ThesisAlignmentPanel({ projectId }: ThesisAlignmentPanelProps) {
  const [loading, setLoading] = useState(false);
  const [alignment, setAlignment] = useState<ThesisAlignment | null>(null);
  const [cached, setCached] = useState(false);
  const [openQ, setOpenQ] = useState<number | null>(null);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const { data } = await api.post(`/ai/thesis-alignment/${projectId}`);
      setAlignment(data.data);
      setCached(data.cached ?? false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to generate thesis alignment";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!alignment) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Generate an AI-powered analysis of how this project aligns with your investment thesis.
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
            "⚡ Generate Thesis Alignment"
          )}
        </Button>
      </div>
    );
  }

  const color = alignColor(alignment.alignmentScore);

  return (
    <div className="space-y-6">
      {cached && (
        <span className="text-xs text-gray-400 font-mono">● CACHED</span>
      )}

      {/* Score + summary */}
      <div className="flex items-start gap-4">
        <AlignmentRing score={alignment.alignmentScore} />
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color }}>
            Alignment Score: {alignment.alignmentScore}/100
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {alignment.alignmentSummary}
          </p>
        </div>
      </div>

      {/* Matches / Mismatches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Thesis Matches
          </p>
          <div className="space-y-2">
            {alignment.thesisMatches.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{m}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Gaps
          </p>
          <div className="space-y-2">
            {alignment.thesisMismatches.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{m}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DD Questions accordion */}
      {alignment.recommendedQuestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Due Diligence Questions
          </p>
          <div className="space-y-2">
            {alignment.recommendedQuestions.map((q, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenQ(openQ === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span>Q{i + 1}. {q.slice(0, 65)}{q.length > 65 ? "..." : ""}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${openQ === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openQ === i && (
                  <div className="px-4 pb-3 text-sm text-gray-600 bg-gray-50">{q}</div>
                )}
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
        {loading ? <LoadingSpinner size="sm" /> : "↺ Refresh Analysis"}
      </Button>
    </div>
  );
}