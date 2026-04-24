# Vaulx demo video assets

This folder holds static demo artifacts served from the web app.

## `test-run.mp4` — fallback demo video

**Required before submission.** If the live `/admin/tests` SSE runner fails during judging (network flake, Vercel 300s timeout, localnet missing), the page embeds this recorded run as a fallback.

Target spec: ≤ 4 min, `.mp4` H.264, ≤ 40 MB, 1280×720 or 1920×1080. Silent or narrated — either works.

### Recording instructions

**Option A — screen capture:**

```bash
# macOS — QuickTime Player → File → New Screen Recording → record a terminal
# running `PATH=/Users/gogy/.local/share/solana/install/active_release/bin:$PATH \
#          COPYFILE_DISABLE=1 anchor test`
# Export as H.264 .mp4, trim to just the test run.
```

**Option B — asciinema (smaller, re-playable):**

```bash
brew install asciinema agg
cd /Users/gogy/MyCODE/VAULX
asciinema rec apps/web/public/demo/test-run.cast \
  --command "PATH=/Users/gogy/.local/share/solana/install/active_release/bin:\$PATH COPYFILE_DISABLE=1 anchor test"
# Convert to mp4
agg apps/web/public/demo/test-run.cast apps/web/public/demo/test-run.gif
ffmpeg -i apps/web/public/demo/test-run.gif -pix_fmt yuv420p apps/web/public/demo/test-run.mp4
rm apps/web/public/demo/test-run.gif apps/web/public/demo/test-run.cast
```

**Option C — full demo walkthrough (3-minute hackathon submission video):**

Shoot the 9 moments end-to-end: connect wallet → Civic pass → deposit → mint TRDC → confirm custody → disburse → pay installment → renew → repay. Save as `vaulx-demo.mp4` in this folder. Referenced from the Colosseum submission form.

## Folder layout

- `test-run.mp4` — fallback for the SSE runner
- `vaulx-demo.mp4` — hackathon submission video (3 min)

Both files are gitignored until recorded. The final submission build must include both.
