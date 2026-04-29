# VAULX — LINEAR WORKSPACE REBUILD SPEC

**Purpose of this document:** This is the complete specification for rebuilding the Vaulx project tracking in a **NEW Linear workspace** (separate from George's "Anchorant" workspace to avoid any IP/claim mixing). A fresh Claude Sonnet agent, given this file + Linear MCP access, should be able to recreate the entire structure in one session.

**Date drafted:** Apr 19, 2026
**Drafted by:** Claude Opus 4.7 (via George's Anchorant workspace — to be archived after migration)
**Receiving agent:** Sonnet in new Vaulx workspace

---

## 0. Handoff Summary (for the receiving agent)

You are taking over project setup for a Solana RWA credit protocol. The founder/CEO is **George (Gheorghe Dimitrov)**. He's building this with 4 others (Marcelo, Rodrigo, Felipe, Edson) and has ~22 days until the Colosseum Frontier Hackathon submission deadline (May 11, 2026).

The previous agent set up a version of this project in George's "Anchorant" workspace. That was a mistake — George does not want any mixing between his Anchorant company and this new venture. This spec exists so you can recreate the project clean in its own workspace.

**Your job in order:**
1. Verify the new workspace exists and you're connected
2. Create the Team (if not done by George already)
3. Create the Project with description below
4. Create 4 Milestones (Phase A/B/C/D)
5. Create 10 Labels (5 owner + 4 stream + 1 CRITICAL)
6. Create 54 Issues per Section 5 below
7. Report back with project URL + issue count

**What you should NOT do:**
- Don't add tasks that aren't in this spec without asking George first
- Don't assign issues to Marcelo/Rodrigo/Felipe/Edson as users — they're not yet in the workspace. Use `owner:X` labels.
- Don't use `:icon:` param on `save_project` (fails validation — leave icon null)
- Don't invent or guess facts; Section 2 (Strategic Intelligence) has the verified ones

---

## 1. What This Project Is

**One-line:** Solana-native P2P crowdlending protocol that accepts physical luxury assets (watches, jewelry, vehicles, art) as on-chain collateral via compressed-NFT custody proofs.

**The team:**
- **George (Gheorghe Dimitrov)** — CEO, face of project, EU fundraising, writing. Based in Vienna. 15 years EU banking (UniCredit, Erste, RBI corridor), Italian finance education.
- **Marcelo Coelho** — Co-founder, COO. CEO of Gitel (brazilian security/custody company operating nationally). São Paulo. This is the custody moat.
- **Rodrigo Coelho** — Co-founder, Head of Ops Brazil. Marcelo's operational partner at Gitel. São Paulo.
- **Felipe** — Strategic Advisor (US-based). Runs a crypto rails company that processes ~80% of São Paulo luxury watch transactions. Deep Solana ecosystem + US VC network.
- **Edson** — Lead Solana developer. Anchor / Bubblegum / Rust.

**External relationships already warm:**
- **Mercado do Bitcoin CEO** — briefed, reacted positively. Brazil crypto exchange, 25M users. Meeting to schedule post-submission.
- **Felipe's Discord community + his VC network** (US + BR)
- **KuCoin former CEO** based in Vienna — meeting target for George

**Immediate goal:** Submit to Colosseum Frontier Hackathon by May 10, 2026 (1-day buffer before May 11 deadline). Secondary goal: use submission as credibility to raise $500K–$2M seed in the 60-90 days following.

---

## 2. Strategic Intelligence (DYOR-verified Apr 19, 2026)

*Use this as the factual basis for pitch/whitepaper claims, not the project docs alone.*

### 2.1 Colosseum Frontier Hackathon — verified facts
- **Dates:** Apr 6, 2026 → May 11, 2026 (5 weeks). Registration open now.
- **Structure this year:** No tracks. All projects compete in general pool.
- **Cash prizes:**
  - Grand Champion: $30,000
  - Next 20 startups: $10,000 each
  - Best university team: $10,000
  - Best public-goods project: $10,000
- **Accelerator:** 10+ winning teams invited. Each receives **$250,000 pre-seed** (not a grant — equity investment, typically 7% per previous cohorts). Mentorship + SF office access + Demo Day pitch to top crypto VCs.
- **Total fund deployment:** $2.5M+ from Colosseum's venture fund into winning startups.
- **Required submissions:**
  1. GitHub repo showing code created during the hackathon
  2. Video pitch deck (presentation + recorded pitch)
  3. Technical demo video (product demo)
  4. Weekly video updates (optional but encouraged — visibility signal)
- **Judging:** Ecosystem leaders + founders + investors. Weight on: code that runs, team-market fit, commercial viability, product clarity.

### 2.2 Competitive landscape on Solana
**Solana lending protocols (crypto collateral only):** Kamino ($3.2B TVL), Save (formerly Solend, $400M+), Marginfi, Jupiter Lend ($1.65B), Loopscale ($124M), Port Finance, Drift.

**Solana RWA lending (tokenized financial assets only, NOT physical):**
- Ondo — US Treasuries
- Credix — tokenized private credit receivables
- Etherfuse — Mexican CETES bonds
- Credible Finance — real estate tokenization
- Elmnts — oil & gas royalties
- Kamino (March 2026) — accepts tokenized stocks (xStocks via Superstate) as collateral

**Last hackathon's RWA winners (Cypherpunk, Dec 2025):**
1. Autonom — RWA-specialized oracle
2. Bore.fi — tokenized SME private equity
3. **Legasi** — "compliant credit layer using Lombard loans" (securities-backed, NOT physical)
4. Pencil Finance — student loans onchain
5. Watchtower — asset-backed financing for space infrastructure

**Key finding:** No Solana protocol originates loans against physical luxury goods. Closest semantic adjacency is Legasi (Lombard = securities collateral, not physical). Off-chain luxury lenders (Borro, Suttons & Robertsons, TradFi pawn channel) are 100% centralized and pre-internet in UX. **Vaulx's positioning is genuinely white-space on Solana.** This is the single strongest narrative hook.

### 2.3 BRL stablecoin market — critical reality check
The previous project docs overstated BRL stablecoin maturity. Actual state as of Apr 2026:

- **BRZ (Transfero):** ~$13.6M total on-chain globally across all chains. Smaller on Solana alone.
- **BRLV (Crown, Paradigm-backed):** ~$19M circulating, but RWA.xyz shows only 2 on-chain holders — suspicious liquidity signal.
- **BBRL (Banco Braza):** Deployed on XRPL and Polygon. **NOT on Solana.**
- **BRD:** Newer (Feb 2026). Brazil sovereign debt token.
- **Total BRL stablecoin circulation on-chain:** ~$20M globally. Tiny.

**Regulatory context:**
- Feb 2, 2026: new BACEN (Brazilian Central Bank) rules took effect classifying stablecoin transactions as forex operations. Issuers subject to forex supervision.
- This is **favorable** for a protocol that partners with a licensed SCD/pawn operator (BaaS path in Module 6).
- This is **unfavorable** for any plan to issue a proprietary BRL stablecoin.

**Pitch reframe:**
- ❌ "We ride existing BRL stablecoin liquidity" → factually thin
- ✅ "Vaulx brings real, recurring loan demand to the nascent Solana BRL stablecoin ecosystem. BRZ integrated at launch. Multi-BRL routing is a roadmap item. USDC is the primary denomination for hackathon demo."

### 2.4 Brazilian credit market — key stats for pitch
- Selic base rate: 14.75% (reduced from 15% in March 2026 — first cut in 2 years)
- Revolving credit card rates: ~436% per year (Feb 2026)
- 80.6M Brazilians in formal default (49.3% of adult population, Nov 2025 Serasa)
- Brazil luxury goods market: $3.58B (2024) → projected $5.63B (2026)
- Luxury watch segment: $629M (2024) → $795M (2033)
- TradFi pawn channel (the only mass-market pawn option): 900 branches for 5,570 municipalities. In-person only. 85% LTV max.
- UBS: 433K Brazilians are millionaires, growing

These are verifiable and should anchor the "problem" section of the pitch/whitepaper.

---

## 3. Workspace Setup

### 3.1 Team creation (George does this manually in Linear UI before agent runs)
- Team name: `Vaulx` (or current locked brand name — *see Section 4 on rebrand*)
- Identifier: `GFI` (3-letter prefix for issue IDs)
- Privacy: Private team

### 3.2 Project creation (agent does this)

```
name: "Vaulx (rebrand pending)"
team: "Vaulx"
lead: George (or "me" when running as George)
priority: 1 (Urgent)
startDate: 2026-04-19
targetDate: 2026-05-10
color: #5E6AD2
```

**Project description (full markdown):**

```markdown
## What This Is
Solana-native P2P crowdlending protocol. Accepts physical luxury assets (watches, jewelry, vehicles, art) as on-chain collateral via compressed-NFT custody proofs. First DeFi protocol of its kind on any chain. Launching in Brazil (warmest market, strongest team fit), scalable globally.

## The 3 Battle Lines (22 days)
1. **SHIP** — Edson delivers a working Devnet loan cycle (5 instructions, not 14)
2. **STORY** — George produces 4 submission assets: pitch video, demo video, 10-slide deck, 2-page exec summary
3. **MOAT** — Marcelo locks a custody/SCD partner LOI (1 page, signed or committed)

Everything else = Phase D (post-May 11, during the VC round).

## Team
- George (CEO, Vienna) — face, EU fundraising, writing
- Marcelo (COO, Gitel, SP) — custody moat, BR operations, co-CEO
- Rodrigo (Head of Ops BR, Gitel, SP) — operational execution
- Felipe (Strategic Advisor, US) — crypto rails, Solana contacts, VC intros
- Edson (Lead Dev) — Solana / Anchor / Bubblegum

## Key External Relationships
- Mercado do Bitcoin CEO — briefed, positive. Post-submission meeting.
- Felipe's Solana + US VC network
- KuCoin former CEO in Vienna

## Success Definitions
- **Hackathon success:** shortlisted into Colosseum accelerator → $250K pre-seed
- **Real success:** credibility to raise $500K–$2M seed in 60-90 days post-submission
- **Failure mode:** submit slides without running code = auto-eliminated

## Standup Cadence
Every 2 days, 30 min HARD cap, all 5 on Zoom. Written summary to WhatsApp within 1h.
```

### 3.3 Milestones (4)

| Name | Target date | Description |
|---|---|---|
| **Phase A — Lock Foundation** | 2026-04-27 | Equity call, rebrand complete (domains/emails/socials live), Edson scaffold + 2 instructions, lawyer identified, Fidix first call, pitch script v1, Module 4/6 fixed |
| **Phase B — Build & Write** | 2026-05-05 | Full Devnet cycle (4 more instructions + tests), white paper content-complete, Fidix LOI or memo, pitch script v2, Felipe review 1 |
| **Phase C — Record & Submit** | 2026-05-10 | Demo video, pitch video, dApp minimal, white paper PDF v4, deck + exec summary, X/LinkedIn updates, **SUBMIT May 10** |
| **Phase D — VC Round & Scale** | 2026-06-30 | MB CEO meeting, EU + US VC outreach, BRL stablecoin partner calls, token memo, entity decision, seed structure, hiring plan, KuCoin Vienna |

### 3.4 Labels (10)

**Owner labels (assigned via label until users invited):**

| Name | Color | Description |
|---|---|---|
| `owner:George` | `#F2C94C` | CEO, EU |
| `owner:Edson` | `#26B5CE` | Lead Solana Dev |
| `owner:Marcelo` | `#5E6AD2` | Co-founder, COO, Gitel |
| `owner:Rodrigo` | `#BB87FC` | Co-founder, Head of Ops BR |
| `owner:Felipe` | `#EB5757` | Strategic Advisor, US |

**Stream labels:**

| Name | Color | Description |
|---|---|---|
| `stream:SHIP` | `#26B5CE` | Line 1: Working Devnet loan cycle. The code that makes or breaks submission. |
| `stream:STORY` | `#F2C94C` | Line 2: 4 submission assets — pitch video, demo video, deck, exec summary. |
| `stream:MOAT` | `#5E6AD2` | Line 3: Custody/SCD partner LOI — the commercial moat. |
| `stream:VC` | `#BB87FC` | Phase D — investor outreach, MB CEO, VC mapping, seed structure. |

**Priority flag:**

| Name | Color | Description |
|---|---|---|
| `CRITICAL` | `#EB5757` | Cannot miss. Blocks other work if not done on time. Check daily. |

(Note: earlier Anchorant build had more stream labels. Consolidated here — equity/rebrand/legal/gov/BRL work is distributed across SHIP/STORY/MOAT/VC by actual function.)

---

## 4. Rebrand Status (read before creating issues)

**Current state:** Codename "Vaulx" — not the final name. Team consensus is to rebrand before submission.

**Research completed:** 38 candidates analyzed on 8 TLDs + 2 Web3 TLDs + 3 trademark registries + crypto conflicts + Google SERP + socials + brand quality. Full data in `/mnt/project/final_merged.csv` and `/mnt/project/REPORT.md`.

**Top 3 from research (any of these is defensible):**
1. **Vaulx** — brand /10 = 7, opportunity 79. Vault-adjacent premium feel, reinforces custody moat. Clean TM/crypto/Google. .com taken, 7/8 other TLDs clean.
2. **Throve** — brand /10 = 8 (highest), opportunity 75. Treasure-trove, English-rooted. .com taken, Thrive Market / Thrive Capital SEO noise.
3. **Boltfi** — brand /10 = 7, opportunity 76.5. Bolt = speed + lock. All 3 socials free. Weaker custody tie.

**NOT in the research:** "Vaulto" (appeared in earlier chat notes) — skip unless re-running checks.

**Claude's recommendation to George (for information only):** **Vaulx**. Reinforces moat every time the name is said. But this is a team decision by Apr 22 per the issue below.

---

## 5. Issues List — 54 total

*Format: each issue includes all fields the Linear `save_issue` tool needs. Rebuild agent: create these in order within each phase.*

### PHASE A — LOCK FOUNDATION (23 issues, due Apr 27)

---

**A-01. Invite Marcelo, Rodrigo, Felipe, Edson to Linear workspace**
- Owner: George | Priority: 1 (Urgent) | Due: 2026-04-20
- Labels: `CRITICAL`, `owner:George`
- Milestone: Phase A
- Description:
```
**What:** Send Linear invitations to all 4 team members so they can be properly assigned to issues.

**Why:** Every "owner:X" label is a workaround. Real assignments unlock @mentions, notifications, accountability.

**Steps:**
1. Linear → Settings → Members → Invite
2. Emails (collect first): Marcelo Coelho, Rodrigo Coelho, Felipe, Edson
3. Role: **Member** for cofounders (Marcelo, Rodrigo, Edson). **Guest** for Felipe (advisor, restricted visibility optional).
4. Share workspace URL + project link in WhatsApp after they accept.
5. Once they're in, reassign existing issues from labels to real users.

**Acceptance:** All 4 in Linear:list_users, can be @mentioned and assigned.
```

---

**A-02. 🔒 LOCK Edson: compensation + hours + hard-stop in writing**
- Owner: George | Priority: 1 | Due: 2026-04-22
- Labels: `CRITICAL`, `owner:George`, `stream:SHIP`
- Milestone: Phase A
- Description:
```
**The #1 blocker for the entire project. Resolve before anything else.**

**Why critical:** Edson is load-bearing. Every other task assumes he's shipping. Without written commitment, the project is an idea.

**30-min 1:1. Three questions:**
1. Cash + small equity (2-4%) OR equity-only (larger share, 6-10%)? His pick.
2. Realistic weekly hours through May 10 — honestly?
3. Personal hard-stop if life interferes — what's the escalation?

**Before the call:** A-03 (term sheet) should be ready.

**Acceptance:** Written agreement (email or Google Doc) specifying path, equity %, cash if any, weekly hours, deliverable-based milestones for Phase B/C, hard-stop clause. Edson replies to confirm. Copy Marcelo.

**If he hedges:** activate A-04 (backup dev contingency) same day. Do not wait.
```

---

**A-03. Draft Edson compensation term sheet — 2 clean paths**
- Owner: George | Priority: 1 | Due: 2026-04-21
- Labels: `CRITICAL`, `owner:George`
- Milestone: Phase A
- Description:
```
**1-page term sheet with two compensation paths to present in the A-02 lock call.**

**Path A — Cash + small equity:**
- Cash: R$[X,000]/month through May 10 OR lump sum R$[Y,000] at submission
- Equity: 2-4%, 2-year vest no cliff (contractor + equity bonus structure)
- Hours: 20-25h/week through May 10
- Post-hackathon: reassess

**Path B — Equity-only (founder track):**
- Equity: 6-10%, 4-year vest, 1-year cliff (founder-level)
- No cash during hackathon
- Full co-founder title + product voice
- Hours: 20-25h/week sprint + continued post-hackathon
- Reduced salary post-seed

**Both paths include:**
- Deliverables tied to 5 Devnet instructions
- Hard-stop: 48h notice + handover clause
- IP assignment to future entity
- 6-month post-departure non-compete

**Acceptance:** 1-page PDF ready for A-02 call. Ask Claude to draft if helpful.
```

---

**A-04. Draft equity proposal framework (ranges for all 5)**
- Owner: George | Priority: 1 | Due: 2026-04-20
- Labels: `CRITICAL`, `owner:George`
- Milestone: Phase A
- Description:
```
**1-pager with proposed equity ranges + vesting for all 5. The baseline you walk into every 1:1 with.**

**Starting framework:**

| Person | Role | Equity | Vesting |
|---|---|---|---|
| George | CEO, face, fundraising | 22–28% | 4yr/1yr cliff |
| Marcelo | Co-founder, COO, Gitel IP | 22–28% | 4yr/1yr cliff |
| Rodrigo | Co-founder, Head of Ops BR | 8–12% | 4yr/1yr cliff |
| Felipe | Advisor OR co-founder (his pick) | 3–5% adv / 12–15% co-fdr | 2yr no cliff / 4yr 1yr |
| Edson | Lead Dev | 6–10% (eq-only) or 2–4% (+cash) | matches path |
| ESOP pool | Future hires | 10% | n/a |
| Colosseum (if invested) | Pre-seed | 7% | n/a |

**Hard rules:**
- Rodrigo gets his own named %. "Included in Marcelo" = diligence problem at Series A.
- Felipe picks ONE structure. Advisor gets advisor terms; founder gets founder terms. No hybrid.
- Marcelo's Gitel IP contribution (custody know-how + network) acknowledged in writing.

**Acceptance:** 1-page Google Doc with shareable link. Claude can draft.
```

---

**A-05. Identify 2-3 backup Solana devs (contingency plan)**
- Owner: Felipe | Priority: 1 | Due: 2026-04-23
- Labels: `CRITICAL`, `owner:Felipe`, `stream:SHIP`
- Milestone: Phase A
- Description:
```
**Private list of 2-3 Solana/Anchor devs who could step in if Edson can't deliver. Do NOT approach them yet.**

**Why:** Edson is single point of failure. If A-02 goes sideways or he slips milestones, we need <72h fallback, not 2 weeks of searching.

**Where to look:**
- Felipe's crypto rails team / contractors
- Solana Brazil ecosystem Discord (Superteam BR)
- Previous Colosseum hackathon winner alumni
- Rust/Anchor freelancers on Toptal / Arc / direct

**Capture per candidate:**
- Name, contact, Anchor/Solana experience (repos, prior projects)
- Current availability (48h activation?)
- Cash rate (hourly or sprint-based 2-3 weeks)
- Equity expectation

**Acceptance:** Private doc with 2-3 candidates. NOT contacted. Ready to activate on trigger.

**Trigger to contact:** A-02 goes poorly OR Edson misses 2 consecutive milestones without valid reason.
```

---

**A-06. 1:1 equity pre-negotiations with Marcelo, Rodrigo, Felipe**
- Owner: George | Priority: 1 | Due: 2026-04-22
- Labels: `CRITICAL`, `owner:George`
- Milestone: Phase A
- Description:
```
**3 separate 30-min 1:1s to pre-align on equity before the group call. Call ratifies, doesn't negotiate.**

**1:1 with Marcelo (Apr 21):**
- Your proposal: 22–28% for both of you as co-founders
- Gitel IP valuation discussion
- His view on Rodrigo's explicit % (must be separate from his)
- His view on Felipe path (advisor vs co-founder)
- His view on Edson compensation
- Who speaks when at group call

**1:1 with Rodrigo (Apr 21):**
- Confirm he's a CO-FOUNDER, not "Marcelo's extension"
- Proposal: 8–12%, 4yr/1yr cliff
- Role: Head of Ops BR — SP events, appraiser network, Solana House
- Time realistic: ~8h/week given Gitel
- Voice on operations; final call on tech/product stays George+Edson

**1:1 with Felipe (Apr 22):**
- Path A Advisor: 3–5%, 2yr no cliff, 5-10h/week, no operational deliverables, can stay in his company, title "Strategic Advisor"
- Path B Co-founder: 12–15%, 4yr/1yr cliff, 20+h/week, named product role
- **If he wants founder equity without founder commitment → push back firmly.** Terms match the role.

**Acceptance:** Verbal alignment from all 3. Any range adjustments noted for group call. Claude can draft conversation scripts if useful.
```

---

**A-07. Equity group call convened, held, ratified**
- Owner: Marcelo (convenes) + All 5 (attends) | Priority: 1 | Due: 2026-04-23
- Labels: `CRITICAL`, `owner:Marcelo`
- Milestone: Phase A
- Description:
```
**90-min Zoom with all 5. Ratify the framework pre-aligned in 1:1s (A-06).**

**Prep (Marcelo, 48h before):**
- Calendar invite to all 5
- Agenda distributed (George drafts)
- Equity Google Doc draft attached

**Agenda (90 min):**
1. [10 min] George opens: context, goal = informal framework, NOT final legal
2. [15 min] Round-robin: each person states preferred structure, no interruptions
3. [30 min] Discussion: %, vesting, Rodrigo explicit share, Felipe path, Edson comp
4. [15 min] Marcelo + George propose final split
5. [10 min] Round-table informal approval
6. [10 min] Next steps: George drafts summary same-day

**Outcomes required:**
- Each person's equity % (range or final)
- Each person's vesting terms
- Rodrigo's explicit share (not bundled)
- Felipe's chosen path
- Edson's chosen path
- ESOP pool reserved (10%)
- Colosseum allocation if invested (7%)

**Acceptance:** Written summary circulated same day in WhatsApp. All 5 acknowledge (reply or 👍).
```

---

**A-08. Equity Google Doc drafted + signed by all 5**
- Owner: George (drafts) + All (sign) | Priority: 1 | Due: 2026-04-27
- Labels: `CRITICAL`, `owner:George`
- Milestone: Phase A
- Description:
```
**Turn call outcomes into a formal-but-informal signed agreement.**

**Why:** Verbal = worthless at Series A diligence. Signed Google Doc preserves intent before formal cap table exists.

**Doc structure:**
1. Preamble: founders' agreement, non-binding legally but binding in spirit
2. Parties: 5 named with full legal names + roles
3. Equity table: % per person (range or final)
4. Vesting: per person, start = Apr 23 or entity formation
5. ESOP pool: 10% reserved, Board-governed (future)
6. Colosseum allocation: 7% if invested
7. IP assignment: all pre-existing project work assigned to future entity
8. Non-compete: 6 months post-departure
9. Dispute process: mediation first
10. "Replaced by formal shareholders' agreement upon entity formation"

**Signatures:** electronic (Google Docs typed name + date, or DocuSign) by Apr 27 EOD.

**Acceptance:** All 5 signatures present by Apr 27, 23:59 UTC.
```

---

**A-09. 🎯 Brand name: top-3 shortlist + final decision**
- Owner: George | Priority: 1 | Due: 2026-04-22
- Labels: `CRITICAL`, `owner:George`, `stream:STORY`
- Milestone: Phase A
- Description:
```
**Narrow to 3, then pick 1. By Apr 22 end of day. No extended debate.**

**Shortlist (from the 38-candidate research in REPORT.md):**

| Name | Brand /10 | Why | Risk |
|---|---|---|---|
| **Vaulx** | 7 | Vault-adjacent, premium, reinforces custody moat. Best semantic fit. | .com taken (7/8 other TLDs clean) |
| **Throve** | 8 | Treasure-trove, English-rooted, highest brand score | .com taken, Thrive Market/Thrive Capital SEO noise |
| **Boltfi** | 7 | Bolt = speed + lock, all 3 socials free | -fi suffix dated, weak custody tie |

"Vaulto" from earlier notes is NOT in research. Skip.

**Process:**
- Share shortlist with Felipe for VC-facing gut check
- 30-min team Zoom or WhatsApp vote
- Each person: 1 vote + 1 reason
- Ties broken by George as CEO
- No re-discussion after decision

**Claude's recommendation:** Vaulx. Vault semantic reinforces the actual moat every time someone says the name. Throve has VC SEO noise (Thrive Capital).

**After decision (same day):**
- Announce in WhatsApp
- Move IMMEDIATELY to domains/socials/handle grabs (A-10, A-11)

**Acceptance:** Final name in WhatsApp by Apr 22, 23:59 UTC.
```

---

**A-10. Domain + email infrastructure live**
- Owner: George | Priority: 1 | Due: 2026-04-24
- Labels: `CRITICAL`, `owner:George`, `stream:STORY`
- Milestone: Phase A
- Description:
```
**Consolidated infrastructure setup. Everything needed so that emails work and domains are owned.**

**1. Registrar (Apr 23):**
- Cloudflare Registrar recommended (at-cost pricing, no upsells, free WHOIS privacy). Alternative: Porkbun, Namecheap.
- Create account, 2FA enabled, recovery codes saved in password manager

**2. Domains purchased (Apr 24), 2-year registration each:**
- [ ] .com (or best alt if taken — e.g. .io as primary)
- [ ] .io
- [ ] .xyz
- [ ] .fi
- [ ] .co
- [ ] .finance
- [ ] .com.br
- [ ] .eu
- [ ] Auto-renew ON, WHOIS privacy ON
- Budget ~$200-400 for 2 years across 8 TLDs

**3. Web3 handles (Apr 24):**
- [ ] .sol via SNS (sns.id) — $20-100 depending on length
- [ ] .solana via Freename (freename.io)
- Point both to project's Solana wallet

**4. Google Workspace Business Starter (Apr 24), ~$35/mo for 5 seats:**
- Create workspace, primary domain = best TLD from #2
- Verify domain ownership (TXT record)
- DNS auth (all 4 required):
  - MX records (Google's 5 servers)
  - SPF: `v=spf1 include:_spf.google.com ~all`
  - DKIM: generate in Admin Console, publish TXT
  - DMARC: `v=DMARC1; p=quarantine; rua=mailto:postmaster@[brand].com`
- User accounts: george@, marcelo@, rodrigo@, felipe@, edson@
- Group aliases: info@, hello@, legal@
- Consistent HTML email signature template deployed to all 5

**Acceptance:**
- All 8 domains live in registrar
- 2 Web3 handles owned
- All 5 can send/receive
- mail-tester.com score = 10/10
- DNS auth all green
```

---

**A-11. Social presence claimed (all platforms)**
- Owner: George | Priority: 1 | Due: 2026-04-24
- Labels: `CRITICAL`, `owner:George`, `stream:STORY`
- Milestone: Phase A
- Description:
```
**Grab all handles simultaneously. Once brand goes public, squatters move fast.**

**Must-have (Apr 24):**
- [ ] **X/Twitter** @[brand] — bio: "Solana RWA protocol. Physical luxury assets as collateral." Pinned post placeholder.
- [ ] **LinkedIn Company Page** — company info, logo, tagline
- [ ] **Discord server** — #general, #dev, #announcements, #community
- [ ] **Telegram** — @[brand] (announcements channel) + @[brand]_chat (community group)
- [ ] **Instagram** @[brand] (defensive, impersonation prevention)

**Nice-to-have (Phase B):**
- [ ] Medium / Mirror (blog)
- [ ] Reddit (reserve r/[brand])
- [ ] YouTube handle (for demo videos)

**Each handle:**
- Consistent bio across platforms
- Profile image = wordmark logo (once delivered)
- Header image = brand banner (once done)
- Bio link → primary domain

**Acceptance:** All must-have handles claimed + basic profile set up. Screenshots in shared Drive.
```

---

**A-12. Logo + 1-page brand guide delivered**
- Owner: George | Priority: 2 | Due: 2026-04-27
- Labels: `owner:George`, `stream:STORY`
- Milestone: Phase A
- Description:
```
**Wordmark logo with variants + 1-page brand guide.**

**Logo brief:**
- Wordmark (text-based) with locked brand name
- Premium, fintech-adjacent. NOT crypto-memecoin.
- Reference brands: Stripe, Ramp, Circle, Mercury
- AVOID: blockchain motifs, rocket ships, excessive gradients
- Deliverables: SVG + PNG transparent (2000px, 500px, 100px) + monochrome black + white + horizontal + stacked layouts
- 2-3 revision rounds

**Where to get it:**
- Fiverr (search "wordmark logo finance", Top Rated filter) — $100-300, ~48h
- OR Looka.com (AI-assisted) — $20-60, faster
- OR Felipe's network (if he has a trusted designer)

**1-page brand guide PDF includes:**
- Logo variants + clearspace + minimum sizes + don'ts
- Color palette: 2 primary, 2 secondary, 3 neutrals (HEX + RGB)
- Typography: headline + body + monospace (with Google Fonts links)
- Tone of voice: 3 bullets

**Suggested palette (premium fintech):**
- Primary: deep navy #0A1628 OR forest #1A3A2E
- Accent: gold #D4AF37 (luxury) OR teal #14B8A6 (fintech)
- Neutrals: off-white #FAFAF9, slate #64748B, black #0F172A

**Suggested fonts:**
- Headlines: Inter / Sohne / Neue Haas Grotesk
- Body: Inter / IBM Plex Sans
- Mono: JetBrains Mono / IBM Plex Mono

**Acceptance:** All logo variants + brand guide PDF in shared Drive. All 5 have access.
```

---

**A-13. Minimal landing page live**
- Owner: George | Priority: 2 | Due: 2026-04-27
- Labels: `owner:George`, `stream:STORY`
- Milestone: Phase A
- Description:
```
**Live on primary domain. Every pitch/deck/email points here — it's the public front door.**

**Content (MVP):**
- Hero: wordmark + 1-line tagline ("Solana-native credit protocol. Physical luxury assets as collateral.")
- 3-sentence explainer (problem → solution → who for)
- Email capture (ConvertKit / Mailchimp free tier)
- Social links: X, Telegram, Discord, GitHub
- Footer: copyright, "Built on Solana" badge, favicon

**Stack options:**
- Carrd.co ($19/yr) — simplest, fine for v0 ← RECOMMENDED for speed
- Framer ($15/mo) — upgrade post-hackathon
- Next.js + Vercel — skip until Phase D (Edson has no bandwidth)

**Acceptance:** Live on primary domain with HTTPS. Mobile responsive. Email capture tested.
```

---

**A-14. Colosseum: rules documented + 5 accounts + project entry created**
- Owner: George | Priority: 1 | Due: 2026-04-22
- Labels: `CRITICAL`, `owner:George`
- Milestone: Phase A
- Description:
```
**Consolidated Colosseum setup. Don't leave any of these hanging.**

**1. Read Frontier Hackathon rules (Apr 20):**
- https://colosseum.com/frontier
- blog.colosseum.com/announcing-the-solana-frontier-hackathon
- Colosseum Discord #announcements
- Document: deadline (May 11, verify hour/TZ), required artifacts (GitHub repo + pitch video + demo video), judging criteria, eligibility, disqualification triggers, prize structure ($30K grand + 20x$10K + accelerator $250K for 10+ teams).
- NOTE: NO TRACKS this year. General competition.
- 1-page summary shared in team workspace.

**2. All 5 individual Colosseum accounts (Apr 21):**
- Register yourself at colosseum.com
- Collect emails, send registration link + 24h deadline to Marcelo, Rodrigo, Felipe, Edson
- Verify all 5 confirmed — screenshots in shared doc
- Note: Colosseum profile may require bio, wallet address, GitHub — have them fill these

**3. Project entry created (Apr 22):**
- colosseum.com → Create New Project/Submission
- Name: locked brand (or "Vaulx" placeholder, rename)
- 1-line tagline
- Team members invited
- GitHub repo URL (placeholder, update after Edson creates)
- Project treasury Solana wallet address
- Save as draft — iterate until final

**Acceptance:** All 5 accounts confirmed + project entry live + rules summary shared.
```

---

**A-15. GitHub org + initial repo + team invited**
- Owner: George | Priority: 1 | Due: 2026-04-22
- Labels: `CRITICAL`, `owner:George`
- Milestone: Phase A
- Description:
```
**GitHub organization under the new brand. Edson's code lives here, not his personal account.**

**Why:** Without an org, Edson's work is in his personal GitHub = IP risk at Series A diligence.

**Steps:**
1. Create GitHub Organization (free tier)
   - Name: locked brand
   - Contact email: george@[brand].com (Google Workspace)
2. Enable 2FA requirement org-wide
3. Invite members:
   - Edson → Owner (needs push access)
   - George → Owner
   - Marcelo → Member (read)
   - Rodrigo → Member (read)
   - Felipe → Member (read)
4. Create initial repo (empty, README only) — Edson will populate
5. Add LICENSE file (MIT recommended — Apache 2.0 if you foresee token-related patent concerns)

**Acceptance:** Org created, all 5 invited, 2FA enforced, initial public repo exists.
```

---

**A-16. Team comms infrastructure (WhatsApp + Zoom standup + shared Drive/Notion)**
- Owner: George | Priority: 1 | Due: 2026-04-21
- Labels: `CRITICAL`, `owner:George`
- Milestone: Phase A
- Description:
```
**3 channels for 3 different purposes. Decided and live by Apr 21.**

**1. WhatsApp group — real-time conversation:**
- Name: "Vaulx Core" (rename after brand locks)
- All 5 added
- Pinned message: "Decisions → Linear. Code → GitHub. Conversation → here."
- Links: Linear project, GitHub org (once exists)
- Standup time confirmed
- All 5 keep notifications ON

**2. Zoom recurring standup — structured alignment:**
- Every 2 days, 30 min HARD cap
- Format: round-robin — each person: what I did, what I'm doing, what's blocking me
- No debate in standup (→ 1:1 or WhatsApp async)
- Written summary to WhatsApp within 1h
- Timezone: 14:00 CEST / 09:00 BRT / 08:00 EST (suggested)
- Calendar invite to all 5

**3. Shared Drive or Notion — async docs:**
- Folders: 01_Standup_Notes, 02_White_Paper, 03_Legal, 04_Partnerships, 05_Investor, 06_Decisions_Log
- Decisions Log = every meaningful decision with date + who + rationale (diligence gold later)
- All 5 have access

**Acceptance:** All 3 channels live. First standup scheduled Apr 21.
```

---

**A-17. Edson: Anchor scaffold + README + ARCHITECTURE.md**
- Owner: Edson | Priority: 1 | Due: 2026-04-25
- Labels: `CRITICAL`, `owner:Edson`, `stream:SHIP`
- Milestone: Phase A
- Description:
```
**The foundation. Everything else builds on this.**

**Repo structure:**
```
/
├── Anchor.toml
├── Cargo.toml
├── programs/[brand]-protocol/
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs              (program entry)
│       ├── state.rs            (Vault, LenderPosition, TRDC accounts)
│       ├── instructions/
│       │   ├── initialize_vault.rs
│       │   ├── deposit_capital.rs
│       │   ├── create_ccb_trdc.rs
│       │   ├── confirm_custody.rs
│       │   ├── disburse_ccb.rs
│       │   ├── repay_ccb.rs
│       │   └── mod.rs
│       ├── errors.rs
│       └── constants.rs
├── tests/full_lifecycle.ts
├── app/                         (React frontend — Phase C)
├── README.md
└── ARCHITECTURE.md
```

**README must include:** project name + tagline, 1-paragraph description, tech stack, quickstart (clone/build/deploy), Devnet program IDs, license.

**ARCHITECTURE.md must include:** account model (Vault, LenderPosition, TRDC cNFT, Treasury PDA), instruction flow (deposit → origination → custody → disburse → repay), CPI relationships, security invariants.

**Dependencies (Cargo.toml):**
- anchor-lang = "0.30"
- anchor-spl = "0.30"
- mpl-bubblegum = "1.4"
- spl-account-compression = "0.4"

**Acceptance:** Repo pushed to GitHub org (public). `anchor build` succeeds. `anchor test` runs (even empty). Program deployed to Devnet with ID. README + ARCHITECTURE.md committed.
```

---

**A-18. Edson: `initialize_vault` + `deposit_capital` on Devnet**
- Owner: Edson | Priority: 1 | Due: 2026-04-27
- Labels: `CRITICAL`, `owner:Edson`, `stream:SHIP`
- Milestone: Phase A
- Description:
```
**First 2 of 5 instructions. Proves the vault + lender-side flow.**

### Instruction 1: `initialize_vault`
```rust
pub fn initialize_vault(
    ctx: Context<InitializeVault>,
    vault_id: u64,
    stablecoin_mint: Pubkey,    // USDC or BRZ
    min_deposit: u64,
    target_apy_bps: u16,         // e.g. 1500 = 15%
    max_ltv_bps: u16,            // e.g. 6000 = 60%
    withdrawal_cooldown: i64,    // seconds
) -> Result<()>
```

**Accounts:**
- `vault` PDA (init) seeds: `[b"vault", vault_id.to_le_bytes()]`
- `vault_treasury` PDA (init) — SPL token account owned by vault PDA
- `vault_authority` (signer)
- `stablecoin_mint`, `token_program`, `associated_token_program`, `system_program`, `rent`

**Vault state:** vault_id, authority, stablecoin_mint, treasury, total_deposited, total_shares, active_loans_value, min_deposit, target_apy_bps, max_ltv_bps, withdrawal_cooldown, created_at, bump

**Validation:** max_ltv_bps ≤ 7500 (hard cap 75%), target_apy_bps ≤ 5000, min_deposit > 0

### Instruction 2: `deposit_capital`
```rust
pub fn deposit_capital(ctx: Context<DepositCapital>, amount: u64) -> Result<()>
```

**Accounts:**
- `vault` PDA (mut), `vault_treasury` (mut), `lender_position` PDA (init_if_needed), `lender` (signer), `lender_stablecoin` (mut), `token_program`, `system_program`

**LenderPosition state:** vault, lender, shares, total_deposited, last_deposit_at, bump

**Logic:**
1. Validate amount ≥ vault.min_deposit
2. Calculate shares: if total_shares==0 then shares=amount, else shares = amount * total_shares / total_deposited
3. CPI transfer stablecoin from lender to treasury
4. Update vault: total_deposited += amount, total_shares += shares
5. Update position: shares += new, total_deposited += amount, last_deposit_at = Clock::get()?.unix_timestamp
6. Emit `Deposited { vault, lender, amount, shares }`

**Acceptance:**
- Both instructions deployed to Devnet
- Test: initialize USDC vault, two lenders deposit, verify share math
- Transaction hashes recorded for demo
- Treasury balance visible on Solana Explorer
```

---

**A-19. Marcelo: fintech/banking lawyer identified + first call booked**
- Owner: Marcelo | Priority: 2 | Due: 2026-04-26
- Labels: `owner:Marcelo`, `stream:MOAT`
- Milestone: Phase A
- Description:
```
**BR fintech lawyer with SCD/CCB/VASP experience. Book a call, get fee estimate.**

**Why:** Every legal/regulatory question downstream routes through this relationship. Without a lawyer, the legal section of the white paper is guesswork.

**Criteria:**
- Brazilian fintech law experience (not generalist)
- Ideally: prior SCD license application, CCB issuance frameworks, VASP assessments
- Responsive (can do initial call within 1 week)
- Reasonable initial fee estimate (< R$ 15K for scoping)

**Sources:**
- Marcelo's Gitel banking relationships (warm intros)
- NeosLegal (Colosseum hackathon partner — offers $10K legal services to one winner; worth evaluating but not their only choice)
- Pinheiro Neto, Mattos Filho, Demarest — big firms but may be over-resourced for pre-seed

**First call topics:**
- Scope SCD license vs BaaS with existing SCD
- CCB issuance framework (fastest path)
- VASP registration assessment
- LGPD (Brazilian data protection)
- Pawn partner regulatory basis
- Fee estimate for Phase A-B engagement

**Acceptance:** Call booked (calendar), fee estimate received in writing.
```

---

**A-20. Marcelo: Fidix / custody operator — first exploratory call**
- Owner: Marcelo | Priority: 1 | Due: 2026-04-27
- Labels: `CRITICAL`, `owner:Marcelo`, `stream:MOAT`
- Milestone: Phase A
- Description:
```
**First commercial call with Fidix or a Fidix-equivalent authorized pawn/custody operator. Regulatory basis + revenue share + timeline.**

**Why critical:** Without a custody partner, the protocol is slideware. Fidix provides authorization to hold physical collateral + regulatory cover to originate credit against it.

**Prep:**
- Warm intro through Gitel banking network if possible
- Identify 2-3 alternative candidates in case Fidix says no
- Draft 1-page "what we want to discuss"

**Topics:**
1. Regulatory basis — SCD or pawn-specific regulation? Which CMN resolution?
2. Operating model — can they issue CCBs on behalf of fintech partner (BaaS)?
3. Revenue share — % of origination fee? Flat fee per loan?
4. Capital flow — who holds lender capital?
5. Timeline LOI → pilot loan (months)
6. KYC/AML — their responsibility or ours?
7. Custody physical — theirs or Gitel's? (preserve Gitel moat)
8. Exclusivity — willing or working with competitors?

**Acceptance:** 30-45 min call held. Notes in Decisions Log. Verbal interest OR clear "no" — either is useful. If yes: follow-up for LOI (Phase B). If no: trigger alternative outreach same week.
```

---

**A-21. Pitch script v1 draft (300 words)**
- Owner: George | Priority: 2 | Due: 2026-04-26
- Labels: `owner:George`, `stream:STORY`
- Milestone: Phase A
- Description:
```
**2-minute pitch script, 300 words. Structure Problem → Why Now → Product → Team → Ask.**

**Structure:**
- **Hook (1 sentence, 15 words):** the problem in one punch
- **Why Now (2 data points from Section 2.4 DYOR):** Selic 14.75%, revolving credit 436%, 80M defaulters, $5B luxury market — pick two
- **What We Built (2 sentences):** the protocol + the custody moat (Gitel) + first-of-kind on Solana
- **Team (1 sentence per person, 5 sentences):** George 15yr EU banking, Marcelo custody infrastructure operator, Rodrigo BR operations, Felipe crypto rails (processes 80% of SP watch transactions), Edson Solana protocol engineer
- **Ask (1 sentence):** Colosseum accelerator + pre-seed to complete MVP + launch pilot

**Claude's note:** The "first Solana protocol for physical luxury collateral" positioning is your strongest line — DYOR confirms white space. Lead with it, not Brazil. Brazil is the go-to-market, not the identity.

**Send to Felipe for ruthless edit. Second draft Apr 30 after standup feedback. Record Phase C (May 8-9).**

**Acceptance:** Script shared in Drive. Felipe marked it up. Under 300 words.
```

---

**A-22. White paper: Module 4 rewrite + Module 6 prize framing correction**
- Owner: George | Priority: 2 | Due: 2026-04-27
- Labels: `owner:George`, `stream:STORY`
- Milestone: Phase A
- Description:
```
**Two targeted edits to existing white paper modules. Not full polish — that's Phase B/C.**

**Module 4 (Team) rewrite:**
- Add Rodrigo's EXPLICIT role (not bundled with Marcelo) — per equity agreement
- Felipe location CORRECTED: US-based, not Brazil
- Add MB CEO relationship as strategic asset
- Strengthen: team-market fit for a PHYSICAL RWA protocol is rare (custody operator + EU banker + crypto rails + Solana dev). Lead with this.

**Module 6 (Ask and Roadmap) correction:**
- Previous version assumed $250K direct grant. WRONG.
- Corrected framing (per DYOR Section 2.1):
  - $30K cash Grand Champion + 20 additional $10K cash prizes
  - 10+ teams accepted into accelerator, each gets $250K pre-seed (Colosseum's venture fund investment)
  - $2.5M+ total fund deployment
  - Colosseum is the funnel, not the ceiling. Real money comes from the seed round the accelerator unlocks.
- Budget breakdown ($250K pre-seed usage) can remain directionally — update with any new numbers.

**Acceptance:** Both modules updated in working Google Doc. Diff visible. Ready for Phase B polish.
```

---

**A-23. Felipe: weekly standup attendance + review slots committed**
- Owner: Felipe | Priority: 2 | Due: 2026-04-21
- Labels: `owner:Felipe`
- Milestone: Phase A
- Description:
```
**Explicit commitment from Felipe: what he'll do during the sprint.**

**Minimum commitment expected:**
- Attend every 2-day standup (or send written async update if can't make it)
- Pitch script reviews: 2 rounds minimum (v1 Apr 28, v2 May 4)
- White paper review: 1 round in Phase B (May 5), 1 final in Phase C (May 9)
- US VC warm intro prep (names, not outreach) — hold for Phase D
- Backup Solana dev shortlist (A-05)

**NOT committed (Phase D, post-submission):**
- Crown/Transfero BRL stablecoin calls
- Discord community presentations
- Full VC outreach motion

**Acceptance:** Felipe acknowledges this scope in WhatsApp. Calendar blocks set for standups. Clear on what's in vs out of scope for sprint.
```

---

### PHASE B — BUILD & WRITE (12 issues, due May 5)

---

**B-01. Edson: `create_ccb_trdc` — cNFT mint via Bubblegum**
- Owner: Edson | Priority: 1 | Due: 2026-05-01
- Labels: `CRITICAL`, `owner:Edson`, `stream:SHIP`
- Milestone: Phase B
- Description:
```
**Mint the Tokenized Real-world Debt Collateral (TRDC) as a compressed NFT via Metaplex Bubblegum v2.**

```rust
pub fn create_ccb_trdc(
    ctx: Context<CreateCcbTrdc>,
    appraised_value: u64,        // CAV in stablecoin smallest unit
    ltv_bps: u16,                 // requested LTV, must be ≤ vault.max_ltv_bps
    principal: u64,               // principal = appraised_value * ltv_bps / 10000
    interest_rate_bps: u16,       // monthly rate
    maturity_ts: i64,             // unix seconds
    asset_uri: String,            // IPFS hash of appraisal + custody receipt
    custody_node: Pubkey,         // the custodian address (hardcoded for demo)
) -> Result<()>
```

**Accounts:**
- `vault` (mut)
- `trdc` PDA (init) seeds: `[b"trdc", borrower.key().as_ref(), trdc_nonce.to_le_bytes()]`
- `borrower` (signer)
- `merkle_tree` (Bubblegum account, mut — pre-created)
- `tree_authority` (pda of tree)
- `leaf_owner` = vault PDA (cNFT goes to vault, not borrower)
- `bubblegum_program`
- `compression_program`
- `noop_program`

**TRDC state:**
```rust
#[account]
pub struct Trdc {
    pub vault: Pubkey,
    pub borrower: Pubkey,
    pub custody_node: Pubkey,
    pub appraised_value: u64,
    pub principal: u64,
    pub interest_rate_bps: u16,
    pub ltv_bps: u16,
    pub maturity_ts: i64,
    pub status: TrdcStatus,       // enum: PendingCustody | Active | Repaid | Defaulted
    pub origination_ts: i64,
    pub asset_uri: String,
    pub cnft_asset_id: Pubkey,    // Bubblegum asset ID
    pub bump: u8,
}
```

**Logic:**
1. Validate `ltv_bps ≤ vault.max_ltv_bps`
2. Validate `principal == appraised_value * ltv_bps / 10000`
3. Validate `maturity_ts > now + 30_days_min`
4. Mint cNFT via Bubblegum CPI. Metadata:
   - name: "TRDC #{trdc_nonce}"
   - symbol: "TRDC"
   - uri: asset_uri
   - creators: [vault authority]
   - seller_fee_basis_points: 0
5. Set TRDC status = `PendingCustody`
6. Emit `TrdcCreated { trdc, cnft_asset_id, borrower, principal }`

**IMPORTANT:** Do NOT disburse principal yet. That only happens after `confirm_custody` + `disburse_ccb` (B-02).

**Acceptance:**
- Instruction works on Devnet
- Test: mint a TRDC, verify cNFT exists on Solana Explorer (Digital Asset Standard lookup)
- TRDC account shows status = PendingCustody
- Transaction hash recorded
```

---

**B-02. Edson: `confirm_custody` + `disburse_ccb` (CPI-gated payout)**
- Owner: Edson | Priority: 1 | Due: 2026-05-03
- Labels: `CRITICAL`, `owner:Edson`, `stream:SHIP`
- Milestone: Phase B
- Description:
```
**Two instructions. `confirm_custody` gates `disburse_ccb`. Neither works alone — CPI validation critical.**

### `confirm_custody`
```rust
pub fn confirm_custody(ctx: Context<ConfirmCustody>) -> Result<()>
```

**Accounts:**
- `trdc` (mut)
- `custody_node` (signer) — must match trdc.custody_node (hardcoded for demo)

**Logic:**
1. Validate `trdc.status == PendingCustody`
2. Validate signer == trdc.custody_node
3. Update `trdc.status = Active`
4. Emit `CustodyConfirmed { trdc, custody_node, timestamp }`

### `disburse_ccb`
```rust
pub fn disburse_ccb(ctx: Context<DisburseCcb>) -> Result<()>
```

**Accounts:**
- `vault` (mut)
- `vault_treasury` (mut)
- `trdc` (mut)
- `borrower_stablecoin` (mut — receives funds)
- `vault_authority` (signer — program authority, not human)
- `token_program`

**Logic (CPI VALIDATION IS THE SECURITY GATE):**
1. Validate `trdc.status == Active` (not PendingCustody, not Repaid, not Defaulted)
2. Validate `vault_treasury.amount >= trdc.principal` (sufficient liquidity)
3. CPI transfer `trdc.principal` from vault_treasury to borrower_stablecoin
4. Update vault: `active_loans_value += trdc.principal`
5. Set `trdc.origination_ts = Clock::get()?.unix_timestamp` if not set
6. Emit `Disbursed { trdc, borrower, principal, timestamp }`

**Security invariant:** money leaves vault ONLY after custody confirmed. This is THE load-bearing security property of the entire protocol.

**Acceptance:**
- Both instructions deployed
- Test 1: try disburse on status=PendingCustody → must fail
- Test 2: confirm_custody then disburse → must succeed
- Test 3: double-disburse attempt → must fail (status now Active but principal already sent, or re-check)
- Transaction hashes recorded
```

---

**B-03. Edson: `repay_ccb` — full cycle closes**
- Owner: Edson | Priority: 1 | Due: 2026-05-05
- Labels: `CRITICAL`, `owner:Edson`, `stream:SHIP`
- Milestone: Phase B
- Description:
```
**Borrower repays principal + interest. TRDC marked Repaid. Lender yield distribution conceptually handled (simple pro-rata for demo).**

```rust
pub fn repay_ccb(ctx: Context<RepayCcb>, repay_amount: u64) -> Result<()>
```

**Accounts:**
- `vault` (mut)
- `vault_treasury` (mut)
- `trdc` (mut)
- `borrower` (signer)
- `borrower_stablecoin` (mut — source of repayment)
- `token_program`

**Logic:**
1. Validate `trdc.status == Active`
2. Calculate required repayment:
   ```
   months_elapsed = (now - trdc.origination_ts) / SECONDS_PER_MONTH
   interest = trdc.principal * trdc.interest_rate_bps * months_elapsed / 10000
   total_owed = trdc.principal + interest
   ```
3. Validate `repay_amount >= total_owed`
4. CPI transfer `repay_amount` from borrower to vault_treasury
5. Update vault: `active_loans_value -= trdc.principal`, `total_deposited += interest` (yield accrues to vault shares pro-rata — this is how lenders earn)
6. Update trdc: `status = Repaid`
7. (Optional for hackathon: burn the cNFT via Bubblegum CPI, or simply mark status. Skip burn for demo speed — Bubblegum burn is finicky.)
8. Emit `Repaid { trdc, borrower, principal, interest, timestamp }`

**Acceptance:**
- Instruction deployed
- Test: complete full lifecycle (init → deposit → create → confirm → disburse → repay) in one test file
- Verify lender share value increased pro-rata after repayment
- FULL CYCLE WORKS END-TO-END ON DEVNET
- Transaction hashes recorded for demo video
```

---

**B-04. Edson: Anchor test suite covering full lifecycle + error paths**
- Owner: Edson | Priority: 1 | Due: 2026-05-05
- Labels: `CRITICAL`, `owner:Edson`, `stream:SHIP`
- Milestone: Phase B
- Description:
```
**TypeScript Anchor tests that prove the protocol works and is secure.**

**Test file:** `tests/full_lifecycle.ts`

**Tests required:**
1. **Happy path:** init vault → 2 lenders deposit → borrower creates TRDC → custody confirms → disburse → borrower repays → verify final state
2. **Security path — disburse without custody confirm:** must fail
3. **Security path — disburse after repay:** must fail
4. **Math path — share calculation across multiple deposits:** verify pro-rata
5. **Boundary path — LTV above max:** create_ccb_trdc with ltv_bps > vault.max_ltv_bps must fail
6. **Boundary path — insufficient treasury:** disburse with vault_treasury < principal must fail

**Acceptance:**
- All 6 tests pass: `anchor test`
- Screenshots of green tests included in demo video
- Test output saved to README as evidence
```

---

**B-05. White paper: Modules 1/2/3 refreshed**
- Owner: George | Priority: 2 | Due: 2026-05-02
- Labels: `owner:George`, `stream:STORY`
- Milestone: Phase B
- Description:
```
**Three targeted edits. Not from scratch — update existing drafts.**

**Module 1 (The Problem):**
- Add global market sizing section (not just Brazil): US pawn market $8.6B → projected $45.6B (2030). EU secondary. Brazil as first market + proof point, not as the whole story.

**Module 2 (Why Now):**
- Refresh with Apr 2026 Solana RWA data (DYOR Section 2.2):
  - No Solana protocol does physical luxury collateral today (whitespace)
  - Kamino's March 2026 tokenized stocks as collateral (mainstream RWA acceptance)
  - Cypherpunk hackathon RWA winners (adjacent, not competing)
- Add Feb 2026 BACEN stablecoin-as-forex regulation (favorable to BaaS path)

**Module 3 (The Product):**
- Add a plain-English opener (first 200 words, non-technical): "You own a $50K Rolex. Banks won't lend against it. Vaulx does. Here's how..." Make a non-crypto reader grasp the product before any tech terms.
- Keep the technical depth below for VCs/judges who want it.

**Acceptance:** 3 modules updated in Google Doc. Revision tracking on. Felipe review happens in B-12.
```

---

**B-06. White paper: Module 5 consolidated + BRL stablecoin section**
- Owner: George | Priority: 2 | Due: 2026-05-03
- Labels: `owner:George`, `stream:STORY`
- Milestone: Phase B
- Description:
```
**Module 5 (Business Model + Moat) has two versions in the project docs. Pick one, consolidate, add pawn partner cost from Marcelo's Fidix call.**

**Section additions:**

**1. Unit economics (consolidated):**
- Origination fee: 4-6% of principal
- Monthly interest: ~3% (below 5% TradFi, vs 436% revolving credit)
- Custody cost: 0.5-1% of asset value (Marcelo's research — Brazilian custodians typically charge this)
- Pawn partner revenue share: TBD from Fidix call — leave as placeholder [X%]
- Protocol take: target 1.5-2.5% after pawn partner + custody costs

**2. BRL stablecoin section (NEW — per DYOR correction):**
- Current state: BRL stablecoin liquidity on Solana is nascent (<$15M circulating BRZ on-chain globally). BRLV in suspicious state per RWA.xyz.
- Our approach: USDC-denominated loans at launch (deep, reliable). BRZ integration from day 1 as demonstration. Multi-BRL routing (Crown BRLV, Transfero BRZ, future BACEN-compliant alternatives) = roadmap.
- Opportunity framing: "Vaulx brings real, recurring loan demand to the nascent Solana BRL stablecoin ecosystem." Partnership wedge, not liquidity dependency.

**3. Moat (reinforced):**
- Custody = Gitel's national infrastructure. Replicating this = 18-24 months + millions in capex.
- Team-market fit: custody operator + EU banker + crypto rails + Solana dev. No competitor has this mix.
- Regulatory partnership: SCD BaaS path (validated with lawyer, Phase B).

**Acceptance:** Module 5 is ONE document. BRL stablecoin section is honest (not overselling). Ready for Felipe review.
```

---

**B-07. Pitch script v2 — after Felipe + team edits**
- Owner: George | Priority: 2 | Due: 2026-05-03
- Labels: `owner:George`, `stream:STORY`
- Milestone: Phase B
- Description:
```
**Second draft. Incorporate Felipe's edits from A-21 + any team feedback from standups.**

**Test the script:**
- Read aloud 3x. Time it — must land under 2:00.
- Record yourself once on phone camera. Watch it. Brutal self-edit.
- Ask Felipe: does it hook in the first 15 seconds?

**Common v1 → v2 improvements:**
- Cut filler words ("so", "basically", "essentially")
- Sharper verbs ("we built" not "we've developed")
- Lead with the strongest claim (likely: "first Solana protocol for physical luxury assets" per DYOR)
- Team bios: one sentence each, max. 5 sentences = 35-40 words total.

**Acceptance:** Script v2 locked. Recording rehearsal Apr 28-May 1.
```

---

**B-08. Marcelo + lawyer: SCD/CCB/VASP basis clarified**
- Owner: Marcelo | Priority: 2 | Due: 2026-05-03
- Labels: `owner:Marcelo`, `stream:MOAT`
- Milestone: Phase B
- Description:
```
**Written memo from the lawyer clarifying the regulatory path. Input to Module 5's legal section.**

**Questions to answer:**
1. **CCB issuance via BaaS** — fastest path? Can existing SCD partner issue CCBs on behalf of Vaulx pre-SCD-license?
2. **SEP vs SCD** — SEP has R$15K per-loan cap (too low for luxury collateral). SCD requires R$1M capital. Timeline for each license?
3. **VASP registration** — do we need one? (Holding stablecoin in vault → likely yes eventually)
4. **Pawn partner regulatory basis** — under which resolution does Fidix operate? CMN 4,656? Pawn-specific?
5. **LGPD compliance** — KYC data handling requirements
6. **Token legal classification** — CVM 88/2022 — if/when we launch a token, how is it classified? (Phase D topic but scoping memo now)

**Acceptance:** 1-page memo from lawyer. Answers above, cost estimate for full engagement. Feeds Module 5 legal section.
```

---

**B-09. Marcelo: custody partner LOI signed OR strategy memo**
- Owner: Marcelo | Priority: 1 | Due: 2026-05-05
- Labels: `CRITICAL`, `owner:Marcelo`, `stream:MOAT`
- Milestone: Phase B
- Description:
```
**The critical commercial item. Deliver ONE of:**

**Option A (strong):** Signed 1-page LOI from Fidix (or alternative) stating:
- Intent to partner on a pilot program (5-10 loans over 90 days post-launch)
- Revenue share range (e.g., 30-40% of origination fee)
- Custody arrangement (Gitel or theirs — clarify)
- Non-binding on either side until full agreement signed post-accelerator

**Option B (fallback):** 1-page partnership strategy memo naming:
- 3 specific operators currently in dialog with terms under discussion
- Expected timeline to LOI (mostly post-submission but credibility is in the conversation, not the paper)
- Regulatory basis from lawyer memo (B-08)

**Either version is usable in the pitch deck.** Option A is much stronger; Option B is survivable.

**Acceptance:** PDF stored in shared Drive. Referenced in white paper Module 5 + deck Team/Moat slide.
```

---

**B-10. Marcelo: 1 appraiser LOI in São Paulo**
- Owner: Marcelo | Priority: 3 | Due: 2026-05-05
- Labels: `owner:Marcelo`, `stream:MOAT`
- Milestone: Phase B
- Description:
```
**1 letter of intent from a certified luxury goods appraiser in São Paulo.**

**Why:** The appraisal layer is part of the moat (per Module 3). Demonstrating one signed appraiser = proof the operational layer is real.

**Criteria:**
- Certified in luxury watches (Rolex, Patek, AP) OR GIA-certified for jewelry
- Operates in São Paulo
- Willing to use Vaulx's triangulated appraisal protocol (digital pre-screen + on-site + liquidity discount)
- Reasonable fee (R$215-450 per appraisal, borrower-paid)

**Sources:**
- Felipe's luxury watch network (his company processes 80% of SP watch transactions)
- São Paulo jewelers' association
- Gitel's existing banking network (appraisers already used by banks)

**Acceptance:** Signed LOI (1 page, non-binding). Named appraiser in Module 3 + deck Team slide.
```

---

**B-11. Felipe: Discord community soft-preview + feedback**
- Owner: Felipe | Priority: 3 | Due: 2026-05-03
- Labels: `owner:Felipe`, `stream:STORY`
- Milestone: Phase B
- Description:
```
**Soft preview to Felipe's Discord community (NOT public launch). Gather feedback on positioning and pitch.**

**Format:** Informal post or voice AMA in Felipe's trusted Discord (crypto rails community). NOT full public announcement — that's Phase D.

**Goals:**
- Test-market the pitch narrative
- Validate positioning claims ("first physical luxury collateral on Solana")
- Gather 3-5 early testers willing to use the Devnet demo
- Flush out obvious objections before judges see them

**Output:**
- Written summary of feedback in Decisions Log
- List of common questions → address in FAQ / pitch / deck

**Acceptance:** Soft preview done. Feedback documented. 3+ early-tester emails collected.
```

---

**B-12. Felipe: white paper + pitch review #1**
- Owner: Felipe | Priority: 2 | Due: 2026-05-05
- Labels: `owner:Felipe`, `stream:STORY`
- Milestone: Phase B
- Description:
```
**First full review. Ruthless edits, not cheerleading.**

**Review artifacts:**
- White paper all 6 modules (updated through B-05, B-06)
- Pitch script v2 (B-07)

**Felipe's lens:**
- Does it read like a VC-investable thesis or a student essay?
- Are the claims defensible? (He knows Solana ecosystem — will catch weak claims)
- Team credibility section — does his contribution land correctly?
- BRL stablecoin framing — is it honest about maturity?
- Custody moat — is it emphasized enough?

**Output:** Marked-up Google Doc with specific comments. Not vague "this could be better" — concrete "cut this line, replace with X".

**Acceptance:** Review complete by May 5 EOD. George integrates by May 7 for Phase C.
```

---

### PHASE C — RECORD & SUBMIT (9 issues, due May 10-11)

---

**C-01. Edson: minimal React dApp (wallet + loan form + vault view)**
- Owner: Edson | Priority: 2 | Due: 2026-05-08
- Labels: `owner:Edson`, `stream:SHIP`
- Milestone: Phase C
- Description:
```
**Frontend for the demo video. NOT production. Must look credible on screen.**

**Stack:** Next.js + Tailwind + @solana/wallet-adapter + Anchor client

**3 screens only:**

**1. Lender view:**
- Connect wallet button (Phantom, Backpack, Solflare)
- "Vault balance: $X" + "Your shares: Y (= $Z)"
- "Deposit" form: amount input → submit → sees transaction confirmation

**2. Borrower view:**
- Connect wallet
- "Request loan" form: asset type, appraised value, requested principal (shows computed LTV)
- "Your active loans" list
- "Repay" button per loan

**3. Public dashboard:**
- Total TVL (sum of all vaults)
- Active loans count + total value
- Recent transactions list (last 10 from Anchor events)

**Deploy:**
- Vercel free tier
- Link to subdomain app.[brand].com
- Point to Devnet (not mainnet)

**Acceptance:** dApp live, wallet connect works, can execute full cycle (deposit → create TRDC → confirm → disburse → repay) from UI. Recorded for demo video.
```

---

**C-02. Demo video recorded (3-4 min)**
- Owner: Edson (operates) + George (narrates) | Priority: 1 | Due: 2026-05-08
- Labels: `CRITICAL`, `owner:Edson`, `owner:George`, `stream:STORY`
- Milestone: Phase C
- Description:
```
**Technical demo video. Shows the protocol actually working on Devnet.**

**Structure (3-4 min):**
- [0:00-0:15] Open: protocol name + 1-line value prop on screen
- [0:15-0:45] Problem restated (brief — judges already read the pitch)
- [0:45-1:30] Lender deposits USDC into vault (Edson executes in dApp, George narrates)
- [1:30-2:30] Borrower requests loan, custody confirms, funds disburse (show cNFT on Solana Explorer)
- [2:30-3:15] Borrower repays, lender yield visible (show share value change)
- [3:15-3:45] Show Anchor test suite passing (green checks on screen)
- [3:45-4:00] Close: "Running on Devnet today. Mainnet after audit post-seed." + GitHub link + contact

**Tools:**
- Screen recording: Loom or OBS
- Editing: Descript (free tier for 4 min)
- Voiceover: George records separately if sync is hard

**Acceptance:** MP4 file, 3-4 min, 1080p minimum, uploaded to project YouTube (unlisted) + saved to Drive.
```

---

**C-03. Pitch video recorded (2 min, George on camera)**
- Owner: George | Priority: 1 | Due: 2026-05-09
- Labels: `CRITICAL`, `owner:George`, `stream:STORY`
- Milestone: Phase C
- Description:
```
**2-minute pitch. George on camera. From pitch script v2 (B-07).**

**Production quality:**
- Natural daylight or ring light. No backlit window.
- Clean background: whiteboard with sparse brand element OR neutral wall
- Audio: phone airpods are fine IF room is quiet. Otherwise use a proper mic (Rode SmartLav ~€70).
- Dress: collared shirt, no logo. "Founder casual" not "3-piece suit" not "hoodie".
- Look at camera lens (NOT the screen — practice this, it's harder than it looks)

**Shoot:**
- Aim for single take if possible (higher energy). Otherwise 2-3 cuts max.
- Record 3-5 takes back to back; pick best.
- Teleprompter optional (BigVu, iPhone + prompter app). Memorized script reads more natural.

**Edit:**
- Light cuts only. No background music (distracts from content at this length).
- Subtle opener card (1.5 sec): logo + tagline
- Subtle end card (2 sec): contact + website + social handles

**Acceptance:** MP4, 2:00 max (go 1:55), 1080p min. Uploaded to YouTube (unlisted) + Drive.
```

---

**C-04. White paper v4.0 final PDF**
- Owner: George | Priority: 1 | Due: 2026-05-09
- Labels: `CRITICAL`, `owner:George`, `stream:STORY`
- Milestone: Phase C
- Description:
```
**Consolidated PDF. All 6 modules integrated. Branded cover + TOC + clean typography.**

**Integration checklist:**
- [ ] Module 1 (Problem) — refreshed in B-05
- [ ] Module 2 (Why Now) — refreshed in B-05
- [ ] Module 3 (Product) — plain-English opener added in B-05
- [ ] Module 4 (Team) — rewritten in A-22
- [ ] Module 5 (Business + Moat) — consolidated in B-06
- [ ] Module 6 (Ask + Roadmap) — prize framing corrected in A-22
- [ ] Felipe review 1 integrated (B-12)
- [ ] Marcelo review 2 integrated (C-06)
- [ ] Felipe review 2 integrated (C-06)

**Production:**
- Typography: Inter or IBM Plex (consistent with brand guide from A-12)
- Cover page: logo + title + date + team names
- TOC with page numbers
- Footer: page numbers + project name
- Source: Google Doc → export to PDF (or LaTeX if George prefers). 20-30 pages.

**Acceptance:** PDF in shared Drive. Clean. Professional. Ready to submit.
```

---

**C-05. 10-slide investor deck + 2-page exec summary**
- Owner: George | Priority: 1 | Due: 2026-05-09
- Labels: `CRITICAL`, `owner:George`, `stream:STORY`
- Milestone: Phase C
- Description:
```
**Two artifacts for Phase D VC use. Not for hackathon submission — for what comes after.**

### 10-slide deck

Structure (one slide = one idea):
1. **Title:** brand + tagline + "Solana Frontier Hackathon 2026"
2. **Problem:** Selic 14.75%, 80M defaulters, $5B luxury market, no on-chain pawn
3. **Solution:** Solana RWA protocol for physical luxury collateral
4. **Product:** 5-layer architecture (custody → cNFT → vault → disbursement → recovery). One slide visual.
5. **Why Now:** White space on Solana (no competitor), stablecoin + RWA maturing, Brazilian credit crisis
6. **Market:** Brazil $5B luxury + 80M credit-excluded + global pawn $45B by 2030
7. **Moat:** Gitel custody + team-market fit + regulatory partnership (Fidix LOI)
8. **Traction:** hackathon build (live Devnet), MB CEO relationship, appraiser LOI, 5 team members with 15 years BR/EU banking + Solana
9. **Team:** 5 faces with 1-line credentials
10. **Ask:** Colosseum accelerator + $500K-$2M seed to follow. Use of funds.

**Format:** PDF + PPTX (Google Slides → export both). 16:9. Brand-consistent.

### 2-page exec summary

Condensed white paper for busy VCs who won't read the full doc.

**Format:**
- Page 1: problem + solution + market + ask (data-dense)
- Page 2: team + moat + traction + contact

**Target:** 1,200 words total. Scannable: subheadings, bullets, 1-2 charts max.

**Acceptance:** All 3 files (deck PDF, deck PPTX, exec summary PDF) in Drive. Ready for Phase D VC outreach.
```

---

**C-06. Marcelo + Felipe final reviews**
- Owner: Marcelo (operations), Felipe (strategy) | Priority: 2 | Due: 2026-05-09
- Labels: `owner:Marcelo`, `owner:Felipe`, `stream:STORY`
- Milestone: Phase C
- Description:
```
**Final review pass on all submission assets before George submits.**

**Marcelo reviews:** operational/custody sections of white paper + deck. Sanity-check Gitel framing, Fidix partnership claims, regulatory path description.

**Felipe reviews:** full pitch package — pitch video, demo video, deck, white paper. Last-chance edits to tighten VC framing, crypto-native credibility, Solana fit.

**Deadline:** May 9 EOD. George integrates any changes same night for May 10 submission.

**Acceptance:** Both sign off in writing in WhatsApp. All changes integrated.
```

---

**C-07. Weekly public updates: 3 X posts + 1 LinkedIn during sprint**
- Owner: George | Priority: 3 | Due: 2026-05-09
- Labels: `owner:George`, `stream:STORY`
- Milestone: Phase C
- Description:
```
**Colosseum encourages weekly video updates — these are a visibility signal for judges.**

**Post schedule (spread across Phase A/B/C):**
- Week 1 (Apr 26 ± 2 days): "We're building X. Here's the problem we're solving." Short 30-60s video.
- Week 2 (May 3 ± 2 days): "Progress update — Devnet cycle working. Here's what we built." Dev screenshot.
- Week 3 (May 9 ± 2 days): "Submission day. Here's our pitch. Tag @colosseum."

**LinkedIn post (May 9 only):** longer form, professional network — mirror Week 3 X post with more context for non-crypto audience.

**Engagement targets (informal):** 10+ retweets/reposts, 50+ views on videos. Not measured for success — but a signal of real work happening publicly.

**Acceptance:** 3 X posts + 1 LinkedIn post published. Links saved.
```

---

**C-08. 🚀 SUBMIT on Colosseum by May 10**
- Owner: George | Priority: 1 | Due: 2026-05-10
- Labels: `CRITICAL`, `owner:George`
- Milestone: Phase C
- Description:
```
**THE DAY. Upload all final artifacts to colosseum.com. Confirm submission.**

**Checklist before hitting submit:**
- [ ] GitHub repo public + README clean + code committed during hackathon
- [ ] Pitch video (2:00) uploaded
- [ ] Demo video (3-4:00) uploaded
- [ ] Deck PDF uploaded
- [ ] White paper v4.0 PDF uploaded
- [ ] 2-page exec summary uploaded
- [ ] All 5 team members listed + confirmed
- [ ] Project description matches current brand
- [ ] Contact email works (tested)
- [ ] Screenshot every upload step

**Submit by May 10, 23:59 Vienna time (17:59 São Paulo, 14:59 PT)** — gives 24h+ buffer before May 11 deadline (presumably 23:59 PT = 8:59 May 12 Vienna).

**Immediately after submit:**
- Screenshot confirmation email + upload to Drive
- Post on X + LinkedIn: "Submitted. 🏁"
- Send WhatsApp celebration to team
- START Phase D the next day

**Acceptance:** Submission confirmation email received. Cannot be changed after submit.
```

---

**C-09. May 11 buffer day**
- Owner: George | Priority: 4 | Due: 2026-05-11
- Labels: `owner:George`
- Milestone: Phase C
- Description:
```
**Do not use unless absolutely forced. This is the "something broke" buffer.**

**If submission didn't go through on May 10:** use today to fix and resubmit before deadline (typically 23:59 PT).

**If submission was clean:** take the day off. Phase D starts May 12.

**Acceptance:** Submission either confirmed OR re-confirmed after fix.
```

---

### PHASE D — VC ROUND & SCALE (10 issues, May 12 → Jun 30)

---

**D-01. MB CEO (Mercado do Bitcoin) meeting scheduled, held, follow-up**
- Owner: Marcelo + George | Priority: 1 | Due: 2026-05-20
- Labels: `CRITICAL`, `owner:Marcelo`, `stream:VC`
- Milestone: Phase D
- Description:
```
**Most important Phase D meeting. MB CEO already briefed and positive (per team notes).**

**Prep:**
- 2-page exec summary (C-05) + pitch video (C-03) sent 3 days before
- Specific ask clear: strategic partnership? LOI for pilot integration? BRL stablecoin collaboration?
- Research MB's current DeFi/RWA strategy (search "Mercado do Bitcoin 2026")

**During the meeting:**
- George leads (CEO) with Marcelo on the call (credibility + relationship)
- Don't over-pitch — ask questions about their priorities
- End with specific next step (follow-up meeting in 2 weeks, LOI draft, team intro, etc.)

**Follow-up (within 24h):**
- Thank-you email + meeting notes + asked-for artifacts
- Schedule next step from meeting
- Log in Decisions Log

**Acceptance:** Meeting held. Next step documented. This relationship is potentially worth more than any single VC.
```

---

**D-02. 5-10 EU VC targets mapped + 1-pager sent to top 3**
- Owner: George | Priority: 2 | Due: 2026-05-25
- Labels: `owner:George`, `stream:VC`
- Milestone: Phase D
- Description:
```
**EU VC pipeline — George leads (Vienna location, European banking background).**

**Target list (research + prioritize):**
- RWA/DeFi focus: Framework Ventures (BRL history), Paradigm (BRLV investor), Point72 (crypto), Greenfield Capital, Blockwall
- Fintech focus: Speedinvest, Lakestar, Atomico
- Crypto-native EU: Fabric Ventures, Fasanara Capital

**For top 3:**
- Personalized 1-pager send via warm intro (George's network first) or cold email with specific hook
- Reference hackathon submission + demo video link
- Ask: 30-min call in 2-3 weeks

**Criteria for "top 3":**
- Portfolio fit (RWA, lending, Brazil exposure)
- Check size range ($500K-$2M lead)
- Speed of process (some VCs take 6 months, others 3 weeks)

**Acceptance:** Target list of 5-10 in shared Drive. 3 outreach emails sent. At least 1 call scheduled.
```

---

**D-03. US VC warm intros via Felipe (3-5 targets)**
- Owner: Felipe (intros) + George (meetings) | Priority: 2 | Due: 2026-05-25
- Labels: `owner:Felipe`, `owner:George`, `stream:VC`
- Milestone: Phase D
- Description:
```
**Felipe's US VC network. Warm intros only — cold US outreach from EU is weak.**

**Felipe's priorities (he knows these, confirm with him):**
- Paradigm (BRLV stablecoin backer — sector fit)
- Framework Ventures (BRL stablecoin history)
- Multicoin Capital (Solana-native)
- Coinbase Ventures (RWA + physical collateral narrative)
- Pantera (RWA + emerging markets)
- Distributed Global (LatAm)

**Process:**
- Felipe drafts intro emails; George provides 2-page exec summary + pitch video
- George handles all meetings + follow-ups (Felipe's job is the door open, not the close)
- Track in shared VC spreadsheet: intro date → first meeting → next step → partner meeting → term sheet

**Acceptance:** 3-5 warm intros sent by Felipe. At least 2 first-meetings held.
```

---

**D-04. KuCoin former CEO (Vienna) meeting**
- Owner: George | Priority: 3 | Due: 2026-05-25
- Labels: `owner:George`, `stream:VC`
- Milestone: Phase D
- Description:
```
**Vienna-local heavy-hitter meeting. Potential angel or strategic connection.**

**Prep:**
- Research his current activities (post-KuCoin) — what's he investing in?
- In-person coffee or dinner preferred
- Send pitch materials 3 days before
- Specific ask: his network in crypto VC + potential angel check

**Acceptance:** Meeting held. Relationship opened. Follow-up documented.
```

---

**D-05. Outreach: Crown (BRLV) + Transfero (BRZ)**
- Owner: George + Felipe | Priority: 3 | Due: 2026-05-25
- Labels: `owner:George`, `owner:Felipe`, `stream:VC`
- Milestone: Phase D
- Description:
```
**Partnership conversations with the 2 credible BRL stablecoin issuers.**

**Why now (not in sprint):** Integration happens in Phase D once submission is done. But DYOR showed BRLV's on-chain circulation looks suspicious (~2 holders per RWA.xyz) — verify before committing to them as primary partner.

**Crown (BRLV):**
- Paradigm-backed → potentially warm intro via Felipe's Paradigm contacts
- Discussion: integration deal, yield-sharing, co-marketing in Brazil
- Verify on-chain liquidity is real (check RWA.xyz, DeFi Llama)

**Transfero (BRZ):**
- Swiss-based, more established. $13.6M on-chain.
- Discussion: deeper BRZ liquidity on Solana, co-launch partnership

**Acceptance:** Outreach sent to both. Responses logged. Decision on integration priority documented.
```

---

**D-06. Legal entity decision (BR LTDA / US DE C-Corp / Cayman)**
- Owner: George + Marcelo + lawyer | Priority: 2 | Due: 2026-05-30
- Labels: `owner:George`, `stream:VC`
- Milestone: Phase D
- Description:
```
**The jurisdictional question. Different entities suit different strategies.**

**Options:**
- **Brazil LTDA:** local operations, but US/EU investors don't love this
- **Delaware C-Corp:** standard for VC-backed US startups. Parent of BR subsidiary.
- **Cayman exempt:** crypto-native standard. Token-friendly. Regulatory flexibility.

**Decision inputs:**
- Lawyer memo on each option (fee ~R$3-5K)
- Preference of seed round leads (ask VCs before formalizing)
- Tax implications (transfer pricing BR → parent)
- Token strategy (Cayman best if token; Delaware fine if no token)

**Acceptance:** Decision documented in Decisions Log with rationale. Entity formation starts.
```

---

**D-07. Felipe: Discord community full presentation + AMA**
- Owner: Felipe | Priority: 3 | Due: 2026-05-20
- Labels: `owner:Felipe`, `stream:VC`
- Milestone: Phase D
- Description:
```
**Full public launch to Felipe's Discord — now that submission is in and brand is locked.**

**Format:**
- 30-min live presentation + 30-min AMA
- Recorded for YouTube (repurposable content)
- Co-presented with George (CEO on camera, Felipe facilitates)

**Goal:**
- Public credibility in Solana + BR crypto community
- Early user signups for Devnet testing
- Warm introductions to VCs in the community
- Content for social media amplification

**Acceptance:** Presentation held. 50+ attendees (Felipe's community is >> this). Recording uploaded. Follow-up: 5+ VC intros OR 10+ early testers OR both.
```

---

**D-08. Rodrigo: Solana House SP visits + SP crypto event attendance**
- Owner: Rodrigo | Priority: 4 | Due: 2026-06-15
- Labels: `owner:Rodrigo`, `stream:VC`
- Milestone: Phase D
- Description:
```
**Local BR presence. Rodrigo is the only team member with sustained on-the-ground SP availability.**

**Solana House São Paulo:** Kuka and contacts (per team notes). Make 1-2 visits. Warm relationships with local Solana ecosystem. Potential demo space.

**SP crypto events:** Rio Info, Ethereum SP (expanded to Solana), regional hackathons. Attend 2-3 across Phase D. Hand out 1-pagers. Collect business cards.

**Acceptance:** 3+ visits/events attended. Contact list of 10+ ecosystem names. Potential partners/testers/hires noted.
```

---

**D-09. Token utility spec + CVM 88/2022 legal memo**
- Owner: George + Felipe + lawyer | Priority: 3 | Due: 2026-06-15
- Labels: `owner:George`, `owner:Felipe`, `stream:VC`
- Milestone: Phase D
- Description:
```
**If-and-when-we-launch-a-token scoping. NOT a commitment to launch; a readiness to discuss.**

**Token utility draft (suggested per previous plan):**
- Governance (vote on risk parameters, new collateral categories)
- Fee discount (stake to reduce origination fee)
- Staking (earn pro-rata share of protocol revenue)
- NO direct revenue-share (triggers CVM securities treatment)

**Legal memo from BR lawyer on CVM Instrução 88/2022:**
- Under what conditions would this token be classified as security in Brazil?
- Offshore structure (Cayman) implications?
- Timing considerations — pre-seed vs post-seed launch

**Claude's view:** Push token launch to post-seed minimum. Launching a token without product-market fit is a 2021 mistake — plenty of Solana teams died this way. VCs love the OPTION of a token; they don't love a premature launch.

**Acceptance:** Utility spec in writing (1 page). Legal memo in writing (1 page). Decision on launch timeline in Decisions Log.
```

---

**D-10. Seed round structure + Phase 1 hiring plan**
- Owner: George + Felipe | Priority: 2 | Due: 2026-06-30
- Labels: `owner:George`, `owner:Felipe`, `stream:VC`
- Milestone: Phase D
- Description:
```
**Seed round + first hires. Close Phase D with clear pre-series-A roadmap.**

**Seed structure:**
- Target: $500K – $2M
- Instrument: SAFE (simpler than priced round at this stage)
- Valuation cap: $8-12M (per comp analysis in Module 6 + market update post-submission)
- Use of funds: tech ($150K audit + V2), legal + SCD capital (R$1M), team (6-month runway), GTM pilot (BR 200 loans)
- Lead investor target: $300K-500K check, 10-15% equity range

**Phase 1 hiring plan (post-seed close) — JDs drafted for:**
1. **BR growth marketer** — borrower acquisition, SP ground game
2. **Fintech lawyer (retainer)** — ongoing BACEN compliance, SEP/SCD application
3. **Extra Solana dev** — reduce Edson single point of failure

**Acceptance:** Seed deck updated (C-05 evolution), 3 JDs written, first seed investor conversations beginning.
```

---

## 6. Already Created Under Anchorant (for cleanup)

**These issues were created in George's Anchorant workspace before the decision to migrate. They should be archived or deleted after the new workspace is populated.**

**Anchorant project:** "Vaulx (rebrand pending)"
**URL:** https://linear.app/anchorant/project/vaulx-rebrand-pending-3cde032d84fc

**Issues to clean up (ANC-7 through ANC-40):**

| Old ID | Title | Map to new issue |
|---|---|---|
| ANC-7 | Invite Marcelo, Rodrigo, Felipe, Edson to Linear workspace | A-01 (recreated fresh) |
| ANC-8 | 🔒 Lock Edson: compensation + hours + hard-stop in writing | A-02 |
| ANC-9 | Draft Edson compensation term sheet — 2 clean paths | A-03 |
| ANC-10 | Draft equity proposal framework — ranges for all 5 | A-04 |
| ANC-11 | 1:1 equity pre-negotiation with Marcelo | Merged into A-06 |
| ANC-12 | 1:1 equity pre-negotiation with Rodrigo | Merged into A-06 |
| ANC-13 | 1:1 with Felipe — advisor vs co-founder structure | Merged into A-06 |
| ANC-14 | [Felipe] Identify 2–3 backup Solana devs — contingency plan | A-05 |
| ANC-15 | [Marcelo] Schedule & convene 90-min equity group call | Merged into A-07 |
| ANC-16 | Equity group call — ratify framework (all 5) | Merged into A-07 |
| ANC-17 | Draft equity Google Doc + circulate for signature | A-08 |
| ANC-18 | Brand: narrow to top 3 candidates (from 38-name research) | Merged into A-09 |
| ANC-19 | 🎯 Brand name LOCKED — final decision | Merged into A-09 |
| ANC-20 | Read Colosseum Frontier Hackathon rules — document scoring criteria | Merged into A-14 |
| ANC-21 | Colosseum individual accounts — all 5 registered | Merged into A-14 |
| ANC-22 | Colosseum project entry created + team linked | Merged into A-14 |
| ANC-23 | WhatsApp core team group created + rules pinned | Merged into A-16 |
| ANC-24 | Standup cadence — every 2 days Zoom, calendar invites live | Merged into A-16 |
| ANC-25 | GitHub organization created + all 5 invited | A-15 |
| ANC-26 | Shared workspace (Notion or Drive) for team docs | Merged into A-16 |
| ANC-27 | Registrar account set up with 2FA (Cloudflare recommended) | Merged into A-10 |
| ANC-28 | Domains purchased — all 8 TLDs | Merged into A-10 |
| ANC-29 | Web3 handles registered (.sol + .solana) | Merged into A-10 |
| ANC-30 | Social handles secured (X, LinkedIn, Discord, Telegram, IG) | A-11 |
| ANC-31 | Google Workspace + 5 user emails + groups live | Merged into A-10 |
| ANC-32 | Email signature HTML template deployed to all 5 | Merged into A-10 |
| ANC-33 | Logo wordmark commissioned (Fiverr/Looka, $100-300) | Merged into A-12 |
| ANC-34 | Logo delivered — SVG, PNG variants, monochrome, favicon | Merged into A-12 |
| ANC-35 | 1-page brand guide PDF | Merged into A-12 |
| ANC-36 | Minimal landing page live on primary domain | A-13 |
| ANC-37 | [Edson] Anchor project scaffold + README + ARCHITECTURE.md | A-17 |
| ANC-38 | [Edson] Instruction 1/5: `initialize_vault` on Devnet | Merged into A-18 |
| ANC-39 | [Edson] Instruction 2/5: `deposit_capital` on Devnet | Merged into A-18 |
| ANC-40 | [Marcelo] Fidix / authorized pawn operator — first exploratory call | A-20 |

**Cleanup plan:** After new workspace is populated, George archives the Anchorant project (Linear → Project settings → Archive). Keeps history for reference but removes from active view.

---

## 7. Final Checklist for Receiving Agent

Before starting, confirm:
- [ ] You have Linear MCP tools loaded (`save_project`, `save_milestone`, `save_issue`, `create_issue_label`, `list_teams`, `list_users`)
- [ ] You're connected to the NEW Vaulx workspace, NOT Anchorant
- [ ] George has already created the "Vaulx" team (or equivalent) via Linear UI
- [ ] You know the team name to pass to `save_issue`

Execution order:
1. Create project (Section 3.2)
2. Create 4 milestones (Section 3.3)
3. Create 10 labels (Section 3.4)
4. Create 23 Phase A issues (Section 5, A-01 through A-23)
5. Create 12 Phase B issues (B-01 through B-12)
6. Create 9 Phase C issues (C-01 through C-09)
7. Create 10 Phase D issues (D-01 through D-10)
8. Report back to George with: project URL, issue count (should be 54), any tool errors

Watch-outs:
- `save_project` fails if you pass `icon` — leave null
- `team` parameter is required on every `save_issue` — use the team name or ID
- Use `assignee: "me"` only if you're signed in as George; otherwise use `owner:X` labels only
- `milestone` parameter takes milestone name OR ID — name is simpler
- Due dates: ISO format `YYYY-MM-DD`

---

## 8. Document metadata

**Version:** 1.0
**Project codename:** Vaulx (rebrand pending — Vaulx / Throve / Boltfi shortlist)
**Total issues:** 54
**Total milestones:** 4
**Total labels:** 10
**Total phases:** 4 (A=23, B=12, C=9, D=10)
**Hackathon deadline:** May 11, 2026 (submit May 10)
**Project target end:** June 30, 2026 (end of Phase D)

**Key references (in the project docs):**
- `/mnt/project/Action_Plan_to_be.md` (Perplexity v2 plan, superseded)
- `/mnt/project/vaulx_meeting_1.md` (founder call transcript)
- `/mnt/project/Vaulx_White_Paper___Module_1-6_*.md` (6 white paper module drafts)
- `/mnt/project/business-model-v26-en-final.docx` (original business model)
- `/mnt/project/vaulx-spec-v31-en-final.docx` (original tech spec)
- `/mnt/project/final_merged.csv` (38-candidate brand research)
- `/mnt/project/REPORT.md` (brand research analysis + ranked shortlist)

**End of rebuild spec.**
