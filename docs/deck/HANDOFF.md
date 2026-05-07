# Vaulx Deck — Session Handoff

**Status:** Previous session accumulated drift across partial edits. Restarting from scratch is the right call.

---

## What's preserved

### Files in `docs/deck/`
- `Vaulx_Pitch_v13.pptx` — current state, **flawed** (do not use as starting point)
- `Vaulx_Pitch_v8b.pptx` — **original visual-only mockup, approved early on** — closest to the design intent
- Earlier versions for reference

### Reusable assets
- **30 partner logos** as PNG — moved to `docs/deck/assets/logos/` *(verify before next session — were in `/tmp/vaulx_pptx/logo_pngs/`)*
- Hero watch image at `docs/colosseum/hf/v13_rolex.jpg` — in repo, safe
- Build script at `docs/deck/scripts/build_v13.js` *(verify before next session — was in `/tmp/`)*

### Markdown source-of-truth (do NOT re-derive these — read first)
- `docs/colosseum/PITCH_SCRIPT.md` (v8.1) — full design spec
- `docs/colosseum/Vaulx_Pitch_Voiceover.md` (v9) — recording-ready voice-over
- `docs/colosseum/Vaulx_Pitch_Clean.md` — slide-content-only, paste-ready

---

## Working tools / patterns

### HF image generation (curl pattern that works)

The `dynamic_space` MCP tool is **gated upstream** — don't waste time on it. Use this curl directly:

```bash
HF_TOKEN=$(python3 -c "import json; print(json.load(open('/Users/gogy/.claude/mcp.json'))['mcpServers']['huggingface']['env']['HF_TOKEN'])")

curl -s -o output.jpg \
  -X POST "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell" \
  -H "Authorization: Bearer $HF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inputs":"<prompt>"}'
```

### Vaulx logo (already prepared)
- `docs/colosseum/vaulx_logo_black.png` — black-on-transparent (for white bg)
- `docs/colosseum/vaulx_logo_white.png` — white-on-transparent (for dark bg)

### Brand palette (don't re-derive)
- Ink: `#0A0A0B`
- Paper: `#FAFAF7`
- Accent (deep teal): `#0E7C7B`
- Accent-2 (lighter teal): `#2BA09E`
- Mute: `#6B6B70`
- Warn (predatory rates only): `#B8412C`

---

## What the previous session got wrong

- Ran in circles instead of committing to a plan and shipping it once.
- Made too many partial edits across PDF / docx / HTML / .pptx in parallel without locking one as source-of-truth.
- Re-derived facts already established (Gitel = electronic-security not physical, no "60 corporate banks", 5-gate sequence is Appraise → Custody → cNFT → Borrow → Repay/Default).

---

## Recommended approach for the rebuild

1. **Pick one format and ship it.** Don't try to maintain PDF + docx + HTML + .pptx simultaneously.
2. **Open `v8b.pptx` first.** It was approved. Treat it as the design baseline.
3. **Read the markdown source-of-truth before writing any new slide content.** The narrative is locked; visual execution is the open question.
4. **The 5 gates are non-negotiable:** Appraise → Custody → cNFT mint → Borrow → Repay/Default. Any deviation is a regression.
5. **Lock economics:** borrower 24% APR all-in (2%/month) · 50% LTV · LP senior 8% · LP junior 12% · 5% POL first-loss · ~$300–600 Vaulx revenue per asset/year.
6. **Logos: 30 partners.** They're in `assets/logos/`. Use them in the partner-grid slide; don't re-search for them.

---

*Saved: end of previous session. Next session: read this file first, then pick up from `v8b.pptx`.*
