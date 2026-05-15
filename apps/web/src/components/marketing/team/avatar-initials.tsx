import { cn } from "@/lib/utils";

interface Props {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

const PALETTE = [
  "#0E7C7B",
  "#2BA09E",
  "#0A0A0B",
  "#3A3A40",
  "#6B6B70",
  "#1A1A1D",
] as const;

// PHP `crc32` polyfill — unsigned 32-bit CRC-32 (IEEE 802.3).
function crc32(input: string): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < input.length; i++) {
    let c = (crc ^ input.charCodeAt(i)) & 0xff;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ -1) >>> 0;
}

function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0].charAt(0);
  const last = words[words.length - 1].charAt(0);
  return (first + last).toUpperCase();
}

/**
 * Circular initials avatar. Mirrors site/resources/views/components/
 * avatar-initials.blade.php: initials = first letter of first word +
 * first letter of last word; default colour is a stable-hash pick from
 * the brand-safe palette; explicit `color` overrides.
 */
export function AvatarInitials({ name, size = 80, color, className }: Props) {
  const resolvedColor = color ?? PALETTE[crc32(name) % PALETTE.length];
  const initials = initialsFor(name);
  const fontPx = Math.round(size * 0.36);

  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: resolvedColor,
        color: "#FAFAF7",
        fontFamily: "var(--font-body), 'Outfit', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: `${fontPx}px`,
        letterSpacing: "-0.02em",
        userSelect: "none",
        flexShrink: 0,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
