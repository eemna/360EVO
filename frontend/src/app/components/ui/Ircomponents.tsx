import { useEffect, useState } from "react";

interface IRProgressRingProps {
  score: number;
  size?: number;
}

function irColor(score: number) {
  if (score >= 70) return "#16a34a";
  if (score >= 40) return "#d97706";
  return "#dc2626";
}

export function IRProgressRing({ score, size = 160 }: IRProgressRingProps) {
  const [animated, setAnimated] = useState(0);
  const cx = size / 2;
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const color = irColor(score);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  const dash = (animated / 100) * circ;

  const level = score >= 70 ? "Strong" : score >= 40 ? "Moderate" : "Early";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.07} />
        {/* Fill */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dasharray 1.3s cubic-bezier(0.16,1,0.3,1)" }}
        />
        {/* Score */}
        <text
          x={cx}
          y={cx - size * 0.05}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontFamily: "inherit", fontSize: size * 0.22, fontWeight: 700, fill: color }}
        >
          {animated}
        </text>
        <text
          x={cx}
          y={cx + size * 0.14}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontFamily: "inherit", fontSize: size * 0.075, fill: "#9ca3af" }}
        >
          / 100
        </text>
      </svg>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Investment Readiness · <span style={{ color }}>{level}</span>
      </p>
    </div>
  );
}

interface BreakdownProps {
  breakdown: {
    financial: number;
    market: number;
    team: number;
    traction: number;
    competitive: number;
  };
}

const DIM_META: Record<string, { label: string; weight: string }> = {
  financial:   { label: "Financial",   weight: "25%" },
  market:      { label: "Market",      weight: "25%" },
  team:        { label: "Team",        weight: "20%" },
  traction:    { label: "Traction",    weight: "20%" },
  competitive: { label: "Competitive", weight: "10%" },
};

export function AssessmentBreakdown({ breakdown }: BreakdownProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t); }, []);

  return (
    <div className="space-y-4">
      {Object.entries(breakdown).map(([key, val]) => {
        const color = irColor(val);
        const meta = DIM_META[key];
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                <span className="text-xs text-gray-400">({meta.weight})</span>
              </div>
              <span className="text-sm font-semibold" style={{ color }}>{val}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: mounted ? `${val}%` : "0%",
                  backgroundColor: color,
                  transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}