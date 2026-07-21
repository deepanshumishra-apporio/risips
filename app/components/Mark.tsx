// The risips mark: one unbroken stroke, one green point.
// Geometry straight from the brand sheet — never redrawn by eye.

export function Mark({
  size = 22,
  reversed = false,
  className,
}: {
  size?: number;
  reversed?: boolean;
  className?: string;
}) {
  const dot = reversed ? "var(--green-rev)" : "var(--green)";
  return (
    <svg
      viewBox="-14 -14 194 194"
      width={size}
      height={size}
      className={className}
      aria-label="risips"
      style={{ color: reversed ? "var(--paper)" : "var(--ink)" }}
    >
      <path
        d="M14 106 L14 14 L152 14 L152 152 L64 152 L64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth={28}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={14} cy={152} r={14} fill={dot} />
    </svg>
  );
}

export function Wordmark({
  size = 20,
  reversed = false,
}: {
  size?: number;
  reversed?: boolean;
}) {
  return (
    <span className="rowc gap8">
      <Mark size={size * 1.05} reversed={reversed} />
      <span
        className="wordmark"
        style={{
          fontSize: size,
          color: reversed ? "var(--paper)" : "var(--ink)",
        }}
      >
        risips
      </span>
    </span>
  );
}
