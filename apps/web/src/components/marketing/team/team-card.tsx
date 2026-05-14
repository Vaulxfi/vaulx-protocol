import { Linkedin, Mail } from "lucide-react";

import { AvatarInitials } from "./avatar-initials";

export interface TeamMember {
  name: string;
  role: string;
  location: string;
  flags: string[];
  bio: string;
  tags: string[];
  email: string;
  linkedin: string;
}

/**
 * Single team card. Mirrors the inline `.team-card` styles in
 * site/resources/views/team.blade.php (lines 77–165): hairline border
 * surface card with top strip (1.5px teal underline), 96px initials
 * avatar, centred Outfit-700 name, mono uppercase teal role, muted
 * 13px bio, hairline tag chips, and a contact icon row anchored to
 * the bottom with a soft top border.
 */
export function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div
      className="relative flex h-full flex-col"
      style={{
        background: "var(--vx-surface)",
        border: "1px solid var(--vx-border)",
        padding: "24px 20px",
      }}
    >
      {/* TOP STRIP — location + flags, teal underline */}
      <div
        className="flex items-center justify-between font-mono uppercase text-[var(--vx-text-muted)]"
        style={{
          fontSize: "10px",
          letterSpacing: "0.12em",
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "1.5px solid var(--vx-teal)",
        }}
      >
        <span>{member.location}</span>
        <span style={{ fontSize: "16px", letterSpacing: 0 }}>
          {member.flags.join(" ")}
        </span>
      </div>

      {/* AVATAR */}
      <div className="mb-[18px] text-center">
        <AvatarInitials name={member.name} size={96} color="#0E7C7B" />
      </div>

      {/* NAME */}
      <div
        className="text-center font-sans font-bold text-[var(--vx-text)]"
        style={{
          fontSize: "19px",
          letterSpacing: "-0.025em",
          margin: "0 0 4px",
        }}
      >
        {member.name}
      </div>

      {/* ROLE */}
      <div
        className="text-center font-mono uppercase text-[var(--vx-teal)]"
        style={{
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.10em",
          margin: "0 0 16px",
        }}
      >
        {member.role}
      </div>

      {/* BIO */}
      <p
        className="text-[var(--vx-text-muted)]"
        style={{
          fontSize: "13px",
          lineHeight: 1.55,
          margin: "0 0 14px",
        }}
      >
        {member.bio}
      </p>

      {/* TAGS */}
      {member.tags.length > 0 ? (
        <div className="mb-[14px] flex flex-wrap gap-[6px]">
          {member.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono uppercase text-[var(--vx-text-muted)]"
              style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.10em",
                padding: "3px 7px",
                border: "1px solid var(--vx-border)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* CONTACT */}
      <div
        className="mt-auto flex items-center gap-[10px]"
        style={{
          paddingTop: "12px",
          borderTop: "1px solid var(--vx-border-soft)",
        }}
      >
        {member.linkedin ? (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`LinkedIn — ${member.name}`}
            className="inline-flex h-[30px] w-[30px] items-center justify-center border border-[var(--vx-border)] text-[var(--vx-text-muted)] transition-colors duration-150 ease-glide hover:border-[var(--vx-teal)] hover:text-[var(--vx-teal)]"
          >
            <Linkedin className="h-[14px] w-[14px]" />
          </a>
        ) : null}
        {member.email ? (
          <a
            href={`mailto:${member.email}`}
            aria-label={`Email — ${member.name}`}
            className="inline-flex h-[30px] w-[30px] items-center justify-center border border-[var(--vx-border)] text-[var(--vx-text-muted)] transition-colors duration-150 ease-glide hover:border-[var(--vx-teal)] hover:text-[var(--vx-teal)]"
          >
            <Mail className="h-[14px] w-[14px]" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
