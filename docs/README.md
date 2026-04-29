# Vaulx documentation

Three docs are authoritative. Everything else is historical context (in [`archive/`](archive/)).

## The 3 canonical docs

| # | Doc | What it is | When you read it |
|---|---|---|---|
| **1** | [`architecture/2026-04-29-vaulx-composable-blocks.md`](architecture/2026-04-29-vaulx-composable-blocks.md) | **CANON.** The architecture model. 41 blocks across 2 rails (Money + Collateral) and 6 layers. Each block carries its **Solution / Partner** name and current **Status** (BUILT / PARTIAL / PLANNED / SHORTLIST / TODO / DEFERRED). 4 gates (G1 KYC → G2 Custody → G3 Trilateral → G4 Default). 9 architecture invariants. Brazil adapter manifest. | "What is Vaulx? Who are the partners? What's done?" |
| **2** | [`plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md`](plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md) | The pre-hackathon γ-scope engineering plan. 25 tasks across 7 phases (A-G). Implements GLOBAL blocks M3, M4, C4, C5, C6 and 16 legacy-route deletions. Each task has TDD steps, code skeletons, verification gates, and commit messages. | "What are we building before May 10?" |
| **3** | [`plans/2026-04-29-vaulx-user-journeys-current-vs-ideal.md`](plans/2026-04-29-vaulx-user-journeys-current-vs-ideal.md) | Per-persona walks. Each persona's current path through the demo, gaps vs. production, and decision (KEEP / REMOVE / EVALUATE). Source for the route-coverage matrix and cut list. | "How does a borrower / lender / appraiser experience this?" |

**Conflict rule:** if any doc disagrees with the canon, the canon wins.

## Repo structure

```
docs/
├── README.md                     ← you are here
├── architecture/                  ← 1 canonical doc
│   └── 2026-04-29-vaulx-composable-blocks.md
├── plans/                         ← 2 live plans
│   ├── 2026-04-29-vaulx-gamma-scope-implementation-plan.md
│   └── 2026-04-29-vaulx-user-journeys-current-vs-ideal.md
└── archive/                       ← all historical material
    ├── README.md
    ├── plans/                     (10 superseded plans)
    ├── iterations/                (~30 old architecture drafts)
    ├── research/                  (50+ whitepapers, BRDs, decks, briefs)
    ├── screenshots/               (product screenshots)
    └── derived-docs/              (3 derivative docs folded into canon)
```

## Doc-naming convention

- Filenames start with date (`YYYY-MM-DD-`) for traceability.
- Date = the day the doc was first authored or substantively rewritten.
- A new substantive revision creates a new dated file, not an in-place overwrite.

---

Last updated 2026-04-29.
