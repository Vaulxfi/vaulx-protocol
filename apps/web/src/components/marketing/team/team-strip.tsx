/**
 * Bottom category band. Mirrors `.team-strip` from
 * site/resources/views/team.blade.php (lines 188–204). Ink solid bg,
 * paper text, JetBrains Mono uppercase 11px / 0.18em with teal dot
 * separators between categories.
 */
export function TeamStrip({ items }: { items: readonly string[] }) {
  return (
    <div
      className="text-center font-mono uppercase"
      style={{
        marginTop: "16px",
        padding: "16px 24px",
        background: "var(--vx-text)",
        color: "var(--vx-bg)",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.18em",
      }}
    >
      {items.map((item, i) => (
        <span key={item}>
          {item}
          {i < items.length - 1 ? (
            <span
              aria-hidden
              className="text-[var(--vx-teal)]"
              style={{ display: "inline-block", margin: "0 0.5em" }}
            >
              ·
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
