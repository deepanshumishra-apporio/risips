import type { RiskLevel } from "../lib/types";

// SEBI-style riskometer dial — achromatic (brand: no green in chrome).
// Six segments, a needle pointing at the fund's risk band.

const LEVELS: RiskLevel[] = [
  "Low",
  "Low to Moderate",
  "Moderate",
  "Moderately High",
  "High",
  "Very High",
];

// achromatic ramp: light → ink as risk rises
const SHADES = ["#DAD6CA", "#C4BFB1", "#A8A395", "#847F72", "#565248", "#1A1A18"];

const CX = 110;
const CY = 104;
const R = 82;

function polar(angleDeg: number, radius = R) {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY - radius * Math.sin(rad)] as const;
}

function arc(aStart: number, aEnd: number, radius = R) {
  const [x1, y1] = polar(aStart, radius);
  const [x2, y2] = polar(aEnd, radius);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${radius} ${radius} 0 0 1 ${x2.toFixed(
    1
  )} ${y2.toFixed(1)}`;
}

export function RiskMeter({ risk }: { risk: RiskLevel }) {
  const idx = Math.max(0, LEVELS.indexOf(risk));
  const needleAngle = 180 - (idx + 0.5) * 30;
  const [nx, ny] = polar(needleAngle, R - 16);

  return (
    <div className="col" style={{ alignItems: "center" }}>
      <svg viewBox="0 0 220 128" width="100%" style={{ maxWidth: 260 }}>
        {LEVELS.map((_, i) => {
          const a = 180 - i * 30;
          const b = 180 - (i + 1) * 30;
          return (
            <path
              key={i}
              d={arc(a - 1.2, b + 1.2)}
              stroke={SHADES[i]}
              strokeWidth={13}
              strokeLinecap="butt"
              fill="none"
              opacity={i === idx ? 1 : 0.55}
            />
          );
        })}
        {/* needle */}
        <line
          x1={CX}
          y1={CY}
          x2={nx}
          y2={ny}
          stroke="var(--ink)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r={6} fill="var(--ink)" />
        <circle cx={CX} cy={CY} r={2.4} fill="var(--paper)" />
      </svg>
      <div className="lab" style={{ marginTop: 2 }}>
        Risk-o-meter
      </div>
      <div
        className="h-sora"
        style={{ fontSize: 16, marginTop: 4 }}
      >
        {risk}
      </div>
    </div>
  );
}
