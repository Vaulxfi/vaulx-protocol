# Archive

Historical material kept for context. **Not authoritative.** For live docs see [`../README.md`](../README.md).

## What's here

```
archive/
├── plans/         superseded implementation plans (older than 2026-04-29)
├── iterations/    older architecture iteration drafts (HTML + MD versions)
├── research/      whitepapers, BRDs, pitch decks, business model docs, partner briefs
├── screenshots/   product screenshots, walkthroughs, brand assets
└── meetings/      meeting notes (sparse; most early notes are in research/)
```

## Why preserve, not delete

- Traceability: easier to explain "we tried X, didn't work" with the artifact in hand than from memory.
- Onboarding: new contributors can see how the design evolved.
- Audit: regulators and partners may want to see how the architecture was reasoned about.

## What you should NOT do

- Don't link to anything in `archive/` from canonical docs. Canon ([`../architecture/2026-04-29-vaulx-composable-blocks.md`](../architecture/2026-04-29-vaulx-composable-blocks.md)) and live plans ([`../plans/`](../plans/)) are self-contained.
- Don't update files here. If something here is still useful, lift it into a live doc with a fresh date prefix.

## Notable items

- [`research/00_GOLDEN-research-VAULX.md`](research/00_GOLDEN-research-VAULX.md) — the original product research that bootstrapped Vaulx.
- [`research/Vaulx_Edson_PRD.docx`](research/Vaulx_Edson_PRD.docx) and [`research/edson_technical_brief.pdf`](research/edson_technical_brief.pdf) — Edson's foundational technical brief, the basis everything else iterated on.
- [`research/VAULX_Canonical_Spec_v1.md`](research/VAULX_Canonical_Spec_v1.md) — early canonical spec. Superseded by `../architecture/2026-04-29-vaulx-composable-blocks.md`.
- [`plans/2026-04-28-vaulx-civic-drop-sumsub-add-implementation-plan.md`](plans/2026-04-28-vaulx-civic-drop-sumsub-add-implementation-plan.md) — Civic→Sumsub migration plan. The migration shipped (commits `025f832`..`2fba63e`); plan archived for reference.

---

Last updated 2026-04-29.
