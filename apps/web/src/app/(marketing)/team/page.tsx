import type { Metadata } from "next";

import { PitchLine } from "@/components/marketing/home/pitch-line";
import { TeamCallout } from "@/components/marketing/team/team-callout";
import { TeamCard, type TeamMember } from "@/components/marketing/team/team-card";
import { TeamStrip } from "@/components/marketing/team/team-strip";

export const metadata: Metadata = {
  title: "Team — Vaulx",
};

// Team data — kept inline (matches the Laravel pattern; it's static and small).
// Source of truth: site/resources/views/team.blade.php. Synced 2026-05-11.
// Personal names allowed on this surface per CLAUDE.md §2.4 (named exception).
const TEAM: readonly TeamMember[] = [
  {
    name: "George Dimitrov",
    role: "CEO / CTO",
    location: "Vienna, Austria",
    flags: ["\u{1F1E6}\u{1F1F9}", "\u{1F1F2}\u{1F1E9}"],
    bio: "15+ years in European banking operations. Corporate execution, legal and regulatory alignment.",
    tags: ["Banking", "Regulation"],
    email: "george@vaulx.fi",
    linkedin: "https://www.linkedin.com/in/gheorghedimitrov/",
  },
  {
    name: "Marcelo Coelho",
    role: "Chief Operations",
    location: "São Paulo, Brazil",
    flags: ["\u{1F1E7}\u{1F1F7}"],
    bio: "Deep experience in physical security business. 15+ years in Brazilian electronic-security infra business.",
    tags: ["Security", "Custody"],
    email: "marcelo@vaulx.fi",
    linkedin: "https://www.linkedin.com/in/marcelo-coelho-78564236/",
  },
  {
    name: "Rodrigo Coelho",
    role: "Chief Growth",
    location: "São Paulo, Brazil",
    flags: ["\u{1F1E7}\u{1F1F7}"],
    bio: "Institutional network, market entry, and commercial partnerships across Brazil and LATAM.",
    tags: ["Business network", "LATAM"],
    email: "rodrigo@vaulx.fi",
    linkedin: "https://www.linkedin.com/in/rodrigo-coelho-2459a123/",
  },
  {
    name: "Edson Pohren",
    role: "Senior Engineer",
    location: "São Paulo, Brazil",
    flags: ["\u{1F1E7}\u{1F1F7}"],
    bio: "Anchor, Bubblegum, oracle integration. Ensures the on-chain stack is solid.",
    tags: ["Solana", "Anchor"],
    email: "edson@vaulx.fi",
    linkedin: "https://www.linkedin.com/in/edson-pohren-19421ab5/",
  },
  {
    name: "Felipe Veloso",
    role: "DeFi Advisor & Community",
    location: "USA / Brazil",
    flags: ["\u{1F1FA}\u{1F1F8}", "\u{1F1E7}\u{1F1F7}"],
    bio: "DeFi founder (4p.finance). US/BR DeFi network. São Paulo luxury watch market and fiat-crypto rails.",
    tags: ["DeFi", "Distribution"],
    email: "felipe@vaulx.fi",
    linkedin: "https://www.linkedin.com/in/felipealveloso/",
  },
];

const CATEGORY_STRIP = [
  "Banking",
  "Security",
  "Business Network",
  "Solana",
  "DeFi",
] as const;

export default function TeamPage() {
  return (
    <section
      className="py-[3rem]"
      style={{ background: "var(--vx-bg)" }}
    >
      <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">
        {/* HEADER */}
        <div className="mb-3">
          <PitchLine variant="pill">08 · Team</PitchLine>
        </div>
        <h1
          className="mb-3 font-sans font-bold text-[var(--vx-text)]"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            maxWidth: "18ch",
          }}
        >
          Executives, operators, builders, and market{" "}
          <em className="italic font-bold text-[var(--vx-teal)]">access</em>.
        </h1>
        <p
          className="mb-[3rem] text-[var(--vx-text-muted)]"
          style={{ maxWidth: "60ch", fontSize: "1.15rem", lineHeight: 1.6 }}
        >
          The team combines banking, security infrastructure, business network,
          Solana engineering, and live DeFi distribution.
        </p>

        {/* 5 CARDS — 1 / 2 / 3 / 5 cols at <640 / >=640 / >=992 / >=1280 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 min-[992px]:grid-cols-3 xl:grid-cols-5">
          {TEAM.map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </div>

        {/* SOFTER CALLOUT */}
        <TeamCallout
          label="Five non-overlapping axes"
          text="Active commercial conversations with licensed custodians, appraisers, curators, and LP partners across Brazil, LATAM, and the US."
        />

        {/* BOTTOM CATEGORY STRIP */}
        <TeamStrip items={CATEGORY_STRIP} />
      </div>
    </section>
  );
}
