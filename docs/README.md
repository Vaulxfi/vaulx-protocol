# Vaulx documentation

Six docs are authoritative. Everything else is historical context (in [`archive/`](archive/)).

## The 6 canonical docs

| # | Doc | What it is | When you read it |
|---|---|---|---|
| **1** | [`architecture/2026-04-29-vaulx-composable-blocks.md`](architecture/2026-04-29-vaulx-composable-blocks.md) | **CANON.** The architecture model. 41 blocks across 2 rails (Money + Collateral) and 6 layers. Each block carries its **Solution / Partner** name and current **Status**. 4 gates (G1 KYC → G2 Custody → G3 Trilateral → G4 Default). 9 architecture invariants. Brazil adapter manifest. | "What is Vaulx? Who are the partners? What's done?" |
| **2** | [`plans/2026-04-29-vaulx-unified-architecture-design.md`](plans/2026-04-29-vaulx-unified-architecture-design.md) | **DESIGN.** The unified 3-layer architecture: vaulx-site Laravel · Node bridge · 4 Anchor programs. Component disposition per repo. Phase plan A-H including Squads multisig governance. | "How do all the pieces fit together strategically?" |
| **3** | [`plans/2026-04-29-vaulx-merge-execution-spec.md`](plans/2026-04-29-vaulx-merge-execution-spec.md) | **MERGE SPEC.** Functionality-level WHAT-needs-to-exist for May 10. 8 functional areas (A–I) with Definition-of-Done per area. Cross-cutting requirements (auth · money units · architecture invariants). Dependency graph. **Edson + Claude entry point for code work.** | "What does Edson + Claude need to build?" |
| **4** | [`plans/2026-04-29-vaulx-roadmap.md`](plans/2026-04-29-vaulx-roadmap.md) | **ROADMAP.** Phase 1 (1-3 mo) · Phase 2 (3-6 mo) · Phase 3+ (6-12+ mo). Critical-path partnerships, engineering hardening, Kamino V2 institutional track, FIDC retail wrapper, LatAm expansion. | "What comes after the hackathon?" |
| **5** | [`plans/2026-04-29-vaulx-user-journeys-current-vs-ideal.md`](plans/2026-04-29-vaulx-user-journeys-current-vs-ideal.md) | **JOURNEYS.** Per-persona walks. Each persona's current path, gaps vs. production, decisions (KEEP / REMOVE / EVALUATE). Non-negotiables (security/blinding constraints). | "How does a borrower / lender / appraiser experience this?" |
| **6** | [`PARTNERSHIPS.md`](PARTNERSHIPS.md) | **PARTNERSHIPS.** Per-partner tactical action items + decision log. Updated as conversations move. | "Who do we need to call, what's the next step?" |

**Conflict rule:** if any doc disagrees with the canon, **canon wins on architecture**. **Merge spec wins on what-needs-to-exist for May 10**. **Roadmap wins on phase / sequencing**. **Partnerships wins on partner-specific tactical actions**. **Design doc wins on integration shape**.

## For Edson + Claude (code-work entry point)

Read in this order:
1. **`merge-execution-spec.md`** ← start here; Definition-of-Done per functional area
2. **`composable-blocks.md`** ← architecture context; 9 invariants are non-negotiable
3. **`unified-architecture-design.md`** ← strategic shape (3 layers · 8 phases)
4. **`three-way-comparison.md`** ← what's where in each of the three codebases
5. The original γ plan ([`gamma-scope-implementation-plan.md`](plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md)) — superseded but useful as reference impl for porting the EXIF stripper, case-code generator, bounded-override slider patterns from TypeScript to PHP.

## Superseded (kept for traceability)

- [`plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md`](plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md) — original γ plan, targeted only the Next.js codebase. Superseded by the unified architecture design (#2 above) which retargets the build onto vaulx-site Laravel as canonical user product. Kept for diff/history; will be moved to `archive/plans/` after the team call confirms the pivot.
- [`architecture/2026-04-29-vaulx-three-way-comparison.md`](architecture/2026-04-29-vaulx-three-way-comparison.md) — alignment artifact that surfaced the three independent codebases. Useful context for Edson + Marcelo. Will move to `archive/` once decisions in §9 are filled and the unified design is committed-to.

## Repo structure

```
docs/
├── README.md                     ← you are here
├── PARTNERSHIPS.md               ← canonical doc #5
├── STATUS.md                     ← project status snapshot
├── architecture/
│   └── 2026-04-29-vaulx-composable-blocks.md         (canonical doc #1)
│   └── 2026-04-29-vaulx-three-way-comparison.md      (alignment artifact)
├── plans/                         ← live plans
│   ├── 2026-04-29-vaulx-unified-architecture-design.md  (canonical doc #2)
│   ├── 2026-04-29-vaulx-roadmap.md                       (canonical doc #3)
│   ├── 2026-04-29-vaulx-user-journeys-current-vs-ideal.md (canonical doc #4)
│   └── 2026-04-29-vaulx-gamma-scope-implementation-plan.md (SUPERSEDED)
└── archive/                       ← all historical material
    ├── README.md
    ├── plans/                     (10 superseded plans)
    ├── iterations/                (~30 old architecture drafts)
    ├── research/                  (50+ whitepapers, BRDs, decks, briefs)
    ├── screenshots/               (product screenshots)
    ├── derived-docs/              (3 derivative docs folded into canon)
    └── USER_TODO.md               (user-personal historical notes)
```

## Doc-naming convention

- Filenames start with date (`YYYY-MM-DD-`) for traceability.
- Date = the day the doc was first authored or substantively rewritten.
- A new substantive revision creates a new dated file, not an in-place overwrite.

---

Last updated 2026-04-29.
