# Vaulx documentation

This directory holds the project-guiding documentation. **Two docs are authoritative; everything else is supporting context or historical.**

## Authoritative

| Doc | Purpose | When to read |
|---|---|---|
| [`architecture/2026-04-29-vaulx-composable-blocks.md`](architecture/2026-04-29-vaulx-composable-blocks.md) | **CANONICAL ARCHITECTURE TRUTH.** The 41-block matrix, two rails (Money + Collateral), four gates (G1 KYC → G2 Custody → G3 Trilateral → G4 Default), architecture invariants, Brazil adapter manifest, per-block status. | "What is Vaulx?" — read this first |
| [`plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md`](plans/2026-04-29-vaulx-gamma-scope-implementation-plan.md) | The pre-hackathon γ-scope implementation plan. 25 tasks across 7 phases. Implements GLOBAL blocks M3, M4, C4, C5, C6. | "What are we building before May 10?" |

**Conflict rule:** if any other doc disagrees with the canonical composable-blocks doc, the canon wins. Other docs get corrected to match.

## Supporting context (read on demand)

| Doc | When you'd open it |
|---|---|
| [`plans/2026-04-29-vaulx-user-journeys-current-vs-ideal.md`](plans/2026-04-29-vaulx-user-journeys-current-vs-ideal.md) | Per-persona walkthrough of the L2 product layer. Useful when designing a specific screen. |
| [`architecture/2026-04-29-vaulx-architecture-snapshot.md`](architecture/2026-04-29-vaulx-architecture-snapshot.md) | What's deployed today — system overview, sequence diagrams, real-vs-mocked table. Useful for engineer onboarding. |
| [`architecture/2026-04-29-vaulx-business-flow-and-partners.md`](architecture/2026-04-29-vaulx-business-flow-and-partners.md) | Partnerships-team view. "Who do we need to call, and when?" |
| [`architecture/2026-04-29-vaulx-team-architecture-dashboard-proposal.md`](architecture/2026-04-29-vaulx-team-architecture-dashboard-proposal.md) | Proposed internal cockpit UI for tracking block status. Future build. |

## Historical / iterations / research

Everything in [`archive/`](archive/) is preserved for context but not load-bearing. See [`archive/README.md`](archive/README.md) for what's there and why.

```
docs/
├── README.md                    ← you are here
├── architecture/                 ← canonical architecture docs (4 files)
├── plans/                        ← live implementation plans (2 files)
└── archive/                      ← history: superseded plans, old architecture
                                    iterations, research, BRDs, screenshots
```

## Doc-naming convention

- File names start with date (`YYYY-MM-DD-`) for traceability.
- Date = the date the doc was first authored or last substantively rewritten.
- A new substantive revision creates a new dated file rather than overwriting.
- Live docs live in `architecture/` or `plans/`. Old versions move to `archive/`.

---

Last updated 2026-04-29.
