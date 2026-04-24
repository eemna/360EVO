import { useEffect, useState } from "react";
import { Badge } from "./badge";

interface TRLGaugeProps {
  score: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  size?: number;
}

function getTRLZone(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score >= 7)
    return {
      label: "Mature",
      color: "#16a34a",
      bg: "bg-green-100 text-green-700",
    };
  if (score >= 4)
    return {
      label: "Developing",
      color: "#d97706",
      bg: "bg-amber-100 text-amber-700",
    };
  return { label: "Early", color: "#dc2626", bg: "bg-red-100 text-red-700" };
}

export function TRLGauge({ score, confidence, size = 200 }: TRLGaugeProps) {
  const [animated, setAnimated] = useState(0);
  const zone = getTRLZone(score);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38;
  const strokeW = size * 0.07;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  const startAngle = -210;
  const totalArc = 240;
  const pct = (animated - 1) / 8;
  const fillAngle = startAngle + pct * totalArc;

  function polar(deg: number, r: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(fromDeg: number, toDeg: number, r: number) {
    const s = polar(fromDeg, r);
    const e = polar(toDeg, r);
    const large = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const needleTip = polar(fillAngle, R * 0.72);

  const confBadge: Record<string, string> = {
    HIGH: "bg-green-100 text-green-700 border-green-200",
    MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
    LOW: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size * 0.75}
        viewBox={`0 0 ${size} ${size * 0.75}`}
        overflow="visible"
      >
        {/* Track */}
        <path
          d={arcPath(-210, 30, R)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Red zone 1–3 */}
        <path
          d={arcPath(-210, -130, R)}
          fill="none"
          stroke="#fca5a5"
          strokeWidth={strokeW}
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Amber zone 4–6 */}
        <path
          d={arcPath(-130, -50, R)}
          fill="none"
          stroke="#fcd34d"
          strokeWidth={strokeW}
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Green zone 7–9 */}
        <path
          d={arcPath(-50, 30, R)}
          fill="none"
          stroke="#86efac"
          strokeWidth={strokeW}
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Filled arc */}
        {animated > 1 && (
          <path
            d={arcPath(-210, fillAngle, R)}
            fill="none"
            stroke={zone.color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            style={{ transition: "all 1.1s cubic-bezier(0.16,1,0.3,1)" }}
          />
        )}
        {/* Needle dot */}
        <circle
          cx={needleTip.x}
          cy={needleTip.y}
          r={strokeW * 0.55}
          fill={zone.color}
          style={{ transition: "all 1.1s cubic-bezier(0.16,1,0.3,1)" }}
        />
        <circle
          cx={needleTip.x}
          cy={needleTip.y}
          r={strokeW * 0.9}
          fill={zone.color}
          opacity="0.18"
          style={{ transition: "all 1.1s cubic-bezier(0.16,1,0.3,1)" }}
        />
        {/* Centre score */}
        <text
          x={cx}
          y={cy * 0.88}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "inherit",
            fontSize: size * 0.22,
            fontWeight: 700,
            fill: zone.color,
          }}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy * 0.88 + size * 0.115}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "inherit",
            fontSize: size * 0.072,
            fill: "#9ca3af",
          }}
        >
          / 9 TRL
        </text>
        {/* Tick labels */}
        {[
          { deg: -210, label: "1" },
          { deg: -90, label: "5" },
          { deg: 30, label: "9" },
        ].map((t) => {
          const p = polar(t.deg, R + strokeW * 1.3);
          return (
            <text
              key={t.label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontFamily: "inherit",
                fontSize: size * 0.062,
                fill: "#9ca3af",
              }}
            >
              {t.label}
            </text>
          );
        })}
      </svg>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${confBadge[confidence]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
          {confidence} CONFIDENCE
        </span>
        <Badge className={zone.bg}>{zone.label}</Badge>
      </div>
    </div>
  );
}
