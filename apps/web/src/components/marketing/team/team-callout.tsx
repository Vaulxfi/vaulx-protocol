/**
 * Left-teal-bordered washed callout. Mirrors `.team-callout` from
 * site/resources/views/team.blade.php (lines 167–186).
 */
export function TeamCallout({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  return (
    <div
      style={{
        marginTop: "48px",
        padding: "22px 28px",
        background: "rgba(43, 160, 158, 0.06)",
        borderLeft: "3px solid var(--vx-teal)",
      }}
    >
      <p
        className="font-mono uppercase text-[var(--vx-teal)]"
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.14em",
          margin: "0 0 4px",
        }}
      >
        {label}
      </p>
      <p
        className="text-[var(--vx-text)]"
        style={{ fontSize: "14px", margin: 0 }}
      >
        {text}
      </p>
    </div>
  );
}
