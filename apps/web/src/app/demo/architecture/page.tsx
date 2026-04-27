// Two-swimlane architecture diagram, adapted from VAULX_Architecture_Interactive.html.
// Legacy brand references stripped → Vaulx; legacy incumbent references stripped → TradFi.
// Personal-names rule per design doc §9 applies — pseudonymized roles only.
import { DemoShell } from "../_components/demo-shell";

type Status = "live" | "sdk-sandbox" | "target" | "mock" | "build" | "future";

type Partner = {
  name: string;
  role: string;        // 1-line role
  why?: string;        // why this partner / what they unlock
  status: Status;
  statusLabel: string; // long-form badge label
};

type Step = {
  number: number;
  label: string;       // e.g. "ONBOARD", "CUSTODY"
  why: string;         // 1-line summary
  partners: Partner[];
};

type Swimlane = {
  title: string;
  legend: string;
  steps: Step[];
};

const DEMAND: Swimlane = {
  title: "DEMAND · BORROWER JOURNEY",
  legend: "Asset-rich, capital-poor — the watch owner",
  steps: [
    {
      number: 1,
      label: "ONBOARD",
      why: "60-sec KYC + wallet for non-crypto users.",
      partners: [
        {
          name: "Civic",
          role: "Solana KYC + Token-2022 transfer-hook compliance.",
          why: "60-sec KYC; gates TRDC transfers to KYC'd wallets only.",
          status: "live",
          statusLabel: "Live · v1",
        },
        {
          name: "gov.br",
          role: "Brazilian government digital ID. 170M+ enrolled users.",
          why: "Fastest BR-user onboarding + regulatory trust signal.",
          status: "target",
          statusLabel: "Phase 1 · BR-specific",
        },
        {
          name: "Crossmint",
          role: "Embedded smart wallets, Squads-secured.",
          why: "Email login → Solana wallet, no seed phrase.",
          status: "sdk-sandbox",
          statusLabel: "SDK Sandbox · v1",
        },
        {
          name: "LazorKit",
          role: "Passkey/FaceID Solana wallets via Apple Secure Enclave.",
          why: "Strongest UX moment in the demo — sign loan with biometrics.",
          status: "target",
          statusLabel: "Target integration · v1",
        },
      ],
    },
    {
      number: 2,
      label: "REGISTER",
      why: "Real luxury price → Solana oracle feed.",
      partners: [
        {
          name: "Chrono24",
          role: "World's largest luxury watch marketplace. 600K+ tx, 14 brands × 140 models.",
          why: "Real price data for our asset class — no other oracle has it.",
          status: "live",
          statusLabel: "Apify scraper · Phase 0",
        },
        {
          name: "WatchCharts",
          role: "Watch market price aggregator with deep historical data.",
          why: "Cross-source price reference to validate Chrono24 feed.",
          status: "live",
          statusLabel: "API live · Phase 0",
        },
        {
          name: "RedStone",
          role: "Solana RWA oracle, live since May 2025.",
          why: "Wraps Chrono24 data into a Solana-native oracle feed for on-chain LTV.",
          status: "future",
          statusLabel: "Future partner · logo only",
        },
        {
          name: "Pyth",
          role: "Solana's largest oracle network. Stablecoin and FX feeds.",
          why: "USDC/BRL/USD feeds for LTV calc and payout conversion.",
          status: "live",
          statusLabel: "Live · v1",
        },
      ],
    },
    {
      number: 3,
      label: "CUSTODY",
      why: "Licensed vault + IoT + legal fiduciary paper.",
      partners: [
        {
          name: "Brinks SP",
          role: "Global licensed custodian. SP vault operations.",
          why: "Physical vault for the watches — the off-chain custody leg.",
          status: "target",
          statusLabel: "Target MOU",
        },
        {
          name: "Prosegur",
          role: "Spanish-headquartered custodian, BR operations.",
          why: "Parallel candidate to Brinks — never bet on one.",
          status: "target",
          statusLabel: "Target MOU",
        },
        {
          name: "Loomis",
          role: "Swedish-headquartered cash + valuables custodian.",
          why: "Third candidate, redundancy on supply.",
          status: "target",
          statusLabel: "Target MOU",
        },
        {
          name: "IoT overlay",
          role: "Electronic-security integrator stack — CFTV/IoT on partner vaults.",
          why: "Audit layer competitors can't replicate without comparable channel relationships.",
          status: "build",
          statusLabel: "Built-in · in-house edge",
        },
        {
          name: "SCD + CCB.B3",
          role: "BACEN-licensed SCD signs Cédula de Crédito Bancário with fiduciary alienation.",
          why: "Legal counterparty — without it there is no loan, no product.",
          status: "target",
          statusLabel: "Target LOI · Risk #1",
        },
      ],
    },
    {
      number: 4,
      label: "DISBURSE",
      why: "Two-condition release enforced on-chain.",
      partners: [
        {
          name: "USDC + BRZ",
          role: "Circle USDC + Transfero BRZ — Solana stablecoins.",
          why: "Loan disbursement currency. Borrower picks USD or BRL exposure.",
          status: "live",
          statusLabel: "Live · v1",
        },
        {
          name: "TRDC = cNFT",
          role: "Token Representing Credit Rights — the on-chain credit instrument.",
          why: "Compressed NFT carrying the custody hash; sub-cent mint cost at scale.",
          status: "build",
          statusLabel: "Build now · core artifact",
        },
        {
          name: "Bubblegum",
          role: "Metaplex compressed NFT standard on Solana.",
          why: "Economically impossible at scale before 2025; makes per-loan tokens viable.",
          status: "live",
          statusLabel: "Live tech · v1",
        },
        {
          name: "Anchor gate",
          role: "Vaulx Anchor program · require!(custody_confirmed ∧ terms_accepted)",
          why: "The moat. Solana runtime cannot bypass this constraint. 18–24 month replication gap.",
          status: "build",
          statusLabel: "Build now · the moat",
        },
      ],
    },
    {
      number: 5,
      label: "MANAGE",
      why: "Pix off-ramp + card spend — like normal money.",
      partners: [
        {
          name: "Privy (Pix)",
          role: "Embedded wallets + fiat on/off-ramps incl. Pix. Stripe-acquired 2025.",
          why: "1-click USDC → Pix → BR bank account.",
          status: "target",
          statusLabel: "Target integration · v1",
        },
        {
          name: "Quartz",
          role: "Solana off-ramp.",
          why: "Redundant off-ramp, never bet on one.",
          status: "target",
          statusLabel: "Target · alt route",
        },
        {
          name: "Solflare Card",
          role: "Mastercard-network card spending Solana wallet balance.",
          why: "Spend USDC at any retailer, no off-ramp needed.",
          status: "live",
          statusLabel: "Live · post-hackathon",
        },
        {
          name: "lobster.cash",
          role: "Crossmint × Visa × Circle stablecoin card.",
          why: "'Borrow against your watch, pay your dinner' — the demo flourish.",
          status: "live",
          statusLabel: "Live · post-hackathon",
        },
      ],
    },
    {
      number: 6,
      label: "REPAY / DEFAULT",
      why: "90% recovery target at 50% LTV.",
      partners: [
        {
          name: "Auction PDA",
          role: "On-chain auction account for defaulted TRDC.",
          why: "In-program default flow, no third party, transparent execution.",
          status: "build",
          statusLabel: "Build now · v1",
        },
        {
          name: "3-tier waterfall",
          role: "Tier 1 platform lenders → Tier 2 reseller network → Tier 3 public.",
          why: "Target 90% recovery at 50% LTV — the math that makes the book work.",
          status: "build",
          statusLabel: "Build now · core mechanism",
        },
        {
          name: "Extrajudicial",
          role: "DL 911/69 + Lei 14.711/2023 + CNJ Provision 196/2025.",
          why: "BR law allows recovery without court — game-changer for default economics.",
          status: "live",
          statusLabel: "BR law · in effect",
        },
        {
          name: "BR legal stack",
          role: "Lei 14.905/2024 eliminated usury cap for FI lending.",
          why: "Makes 26% APR borrower rate legal and stable.",
          status: "live",
          statusLabel: "In effect",
        },
      ],
    },
  ],
};

const SUPPLY: Swimlane = {
  title: "SUPPLY · LIQUIDITY PROVIDER JOURNEY",
  legend: "Yield-seeking capital — TradFi, FIDC, and crypto-native LPs",
  steps: [
    {
      number: 1,
      label: "ONBOARD",
      why: "Compliant rails for institutional + retail.",
      partners: [
        {
          name: "Civic accredited",
          role: "Institutional-grade KYC/KYB for lender onboarding.",
          why: "Institutional capital cannot deposit without verified compliance.",
          status: "target",
          statusLabel: "Target integration",
        },
        {
          name: "Tokeny / 3643",
          role: "ERC-3643 (T-REX) — standard for tokenized regulated securities.",
          why: "Wraps Vaulx LP tokens as compliant securities for institutional investors.",
          status: "target",
          statusLabel: "Phase 2 · institutional path",
        },
        {
          name: "FIDC wrapper",
          role: "Fundo de Investimento em Direitos Creditórios — BR retail securitization vehicle.",
          why: "Funds the Retail-FIDC-USDC + Retail-FIDC-BRL vaults from BR retail capital.",
          status: "target",
          statusLabel: "Phase 1 · BR-specific",
        },
        {
          name: "B2B onboarding",
          role: "Direct institutional desk for whale lenders.",
          why: "High-touch onboarding is faster than self-serve for $1M+ tickets.",
          status: "build",
          statusLabel: "Phase 1 · Vaulx desk",
        },
      ],
    },
    {
      number: 2,
      label: "ALLOCATE",
      why: "4 vaults · 1 audited program · same code.",
      partners: [
        {
          name: "Inst-USDC",
          role: "USD-denominated lending pool for institutional depositors.",
          why: "Dollar exposure, blue-chip lenders, ~11% APY.",
          status: "build",
          statusLabel: "v1 vault",
        },
        {
          name: "Inst-BRL",
          role: "BRL-denominated lending pool (BRZ stablecoin).",
          why: "BR institutional lenders avoid FX exposure, ~14% APY.",
          status: "build",
          statusLabel: "v1 vault",
        },
        {
          name: "Retail-FIDC-USDC",
          role: "USD vault wrapped by FIDC for BR retail investors.",
          why: "BR-compliant retail access to USD yield from luxury collateral.",
          status: "build",
          statusLabel: "Phase 1 vault",
        },
        {
          name: "Retail-FIDC-BRL",
          role: "BRL vault wrapped by FIDC for BR retail investors.",
          why: "Native-currency retail product, broadest BR addressable market.",
          status: "build",
          statusLabel: "Phase 1 vault",
        },
      ],
    },
    {
      number: 3,
      label: "DEPOSIT",
      why: "Solana institutional liquidity rails.",
      partners: [
        {
          name: "Kamino OCC",
          role: "Off-Chain Collateral. Institutional lenders → routed to off-chain RWA originators.",
          why: "Vaulx becomes a borrower-side originator on Kamino's rails — instant institutional liquidity.",
          status: "target",
          statusLabel: "Target integration · race window",
        },
        {
          name: "Plume Nest",
          role: "Plume Nest on Solana. Live with WisdomTree, Hamilton Lane, Securitize.",
          why: "TradFi capital tokenized via Plume → Vaulx vaults. Plugs into Loopscale + Jupiter.",
          status: "target",
          statusLabel: "Target integration · v1",
        },
        {
          name: "SCD balance sheet",
          role: "BACEN-licensed SCD partner originates loans from own book at Phase 0.",
          why: "Bridge capital before institutional/FIDC flows scale.",
          status: "target",
          statusLabel: "Phase 0 · pre-arranged",
        },
        {
          name: "Direct USDC",
          role: "Native crypto whales deposit directly into Inst-USDC vault.",
          why: "Zero-friction path for crypto-native LPs.",
          status: "build",
          statusLabel: "v1",
        },
      ],
    },
    {
      number: 4,
      label: "EARN",
      why: "Yield with on-chain collateral visibility.",
      partners: [
        {
          name: "11% APY USDC",
          role: "Lender yield from blended book.",
          why: "Competitive with Maple/Centrifuge at superior collateral profile (physical luxury vs invoices).",
          status: "build",
          statusLabel: "Phase 1 target",
        },
        {
          name: "~14% APY BRL",
          role: "Higher rate matches BR funding cost (Selic ~10%).",
          why: "Makes BRL vaults attractive to BR fixed-income desks.",
          status: "build",
          statusLabel: "Phase 1 target",
        },
        {
          name: "LTV live oracle",
          role: "Oracle reads Chrono24/WatchCharts → on-chain LTV per loan, updated continuously.",
          why: "Lenders see live collateral coverage; auto-alerts on liquidation risk.",
          status: "build",
          statusLabel: "Build now · v1",
        },
        {
          name: "Risk transparency",
          role: "Each TRDC links to: asset photo, IoT vault feed, custody hash, LTV history, loan terms.",
          why: "Best-in-class lender visibility = lower risk premium.",
          status: "build",
          statusLabel: "v1 dashboard",
        },
      ],
    },
    {
      number: 5,
      label: "RECOVERIES",
      why: "Lenders get first crack on defaulted assets.",
      partners: [
        {
          name: "Privileged 72h",
          role: "On default, platform lenders get exclusive bid window before public auction.",
          why: "Lenders recover collateral at favorable price, not market panic price.",
          status: "build",
          statusLabel: "v1 mechanism",
        },
        {
          name: "Platform first-look",
          role: "Vault depositors get first crack at defaulted assets matched to their vault tier.",
          why: "Aligns lender economics with platform; differentiates from open-market liquidations.",
          status: "build",
          statusLabel: "v1",
        },
        {
          name: "Reseller curation",
          role: "Vaulx-curated SP watch-reseller network gets Tier 2 access.",
          why: "Trade-network buyers absorb collateral at retail-adjacent price.",
          status: "target",
          statusLabel: "Vaulx network edge",
        },
        {
          name: "Public auction",
          role: "Open Solana + off-chain auction if Tiers 1-2 don't clear.",
          why: "Backstop for liquidity; protects book worst-case.",
          status: "build",
          statusLabel: "v1",
        },
      ],
    },
    {
      number: 6,
      label: "DISTRIBUTE",
      why: "Composability = lender liquidity exit.",
      partners: [
        {
          name: "Loopscale",
          role: "Solana lending aggregator. Plume partnership live.",
          why: "Distribution venue for Vaulx-originated TRDC; secondary liquidity for lenders.",
          status: "future",
          statusLabel: "Future · post-hackathon",
        },
        {
          name: "Jupiter",
          role: "Solana liquidity hub.",
          why: "Composable secondary market for TRDC tokens — lender can exit position.",
          status: "future",
          statusLabel: "Future · v2",
        },
        {
          name: "TRDC secondary",
          role: "Vaulx LP tokens tradeable as institutional fixed-income.",
          why: "Turns the loan book into a securitizable asset class.",
          status: "future",
          statusLabel: "Phase 6 · 100+ active loans",
        },
        {
          name: "Composable cNFT",
          role: "Compressed NFT TRDC plugs into any Solana NFT/RWA app.",
          why: "Distribution multiplier — every Solana app is a potential Vaulx liquidity venue.",
          status: "build",
          statusLabel: "Built-in by design",
        },
      ],
    },
  ],
};

export default function ArchitecturePage() {
  return (
    <DemoShell formFactor="desktop">
      <header className="border-b border-[var(--rule)] pb-12">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-[var(--brand)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
            VAULX · ARCHITECTURE
          </span>
        </div>
        <h1
          className="mt-8 font-display font-extrabold leading-[1.04] tracking-[-0.02em] text-[var(--ink)]"
          style={{
            fontSize: "clamp(2.25rem, 5.5vw, 4.25rem)",
            fontVariationSettings: '"opsz" 144',
          }}
        >
          Two-sided market on Solana, with{" "}
          <em className="not-italic italic font-normal text-[var(--brand)]">
            custody as the moat.
          </em>
        </h1>
        <p className="mt-8 max-w-[68ch] font-sans text-base leading-[1.65] text-[var(--ink-dim)] md:text-[17px]">
          Demand: asset-rich borrowers walk a six-step pipeline — KYC, register,
          custody, disburse, manage, repay/default. Supply: yield-seeking capital
          walks a parallel six-step pipeline — onboard, allocate, deposit, earn,
          recover, distribute. Both lanes converge on a single Anchor program
          with one invariant the Solana runtime cannot bypass.
        </p>
      </header>

      <SwimlaneSection swimlane={DEMAND} accent="brass" />

      <Spine />

      <SwimlaneSection swimlane={SUPPLY} accent="emerald" />

      {/* Partner status legend */}
      <section className="mt-16 border-t border-[var(--rule)] pt-10">
        <span className="eyebrow">Status legend</span>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <LegendItem status="live" label="Live · production" />
          <LegendItem status="sdk-sandbox" label="SDK Sandbox" />
          <LegendItem status="build" label="Build now · v1" />
          <LegendItem status="target" label="Target integration" />
          <LegendItem status="mock" label="Mock · agreement pending" />
          <LegendItem status="future" label="Future · post-hackathon" />
        </div>
      </section>
    </DemoShell>
  );
}

function SwimlaneSection({
  swimlane,
  accent,
}: {
  swimlane: Swimlane;
  accent: "brass" | "emerald";
}) {
  const accentClass =
    accent === "brass" ? "text-[var(--brand)]" : "text-emerald-400";
  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between">
        <span className={`font-mono text-[11px] uppercase tracking-[0.22em] ${accentClass}`}>
          {swimlane.title}
        </span>
        <span className="hidden font-mono text-[10px] italic text-[var(--ink-muted)] md:inline-block">
          {swimlane.legend}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-3 xl:grid-cols-6">
        {swimlane.steps.map((step) => (
          <StepCard key={step.label} step={step} accent={accent} />
        ))}
      </div>
    </section>
  );
}

function StepCard({ step, accent }: { step: Step; accent: "brass" | "emerald" }) {
  const headerColor =
    accent === "brass" ? "var(--brand)" : "rgb(52, 211, 153)";
  return (
    <article className="flex flex-col bg-[var(--bg)]">
      <header
        className="flex items-baseline justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${headerColor}30` }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{ color: headerColor }}
        >
          {step.number} · {step.label}
        </span>
      </header>
      <ul className="flex flex-col gap-2 px-4 py-4">
        {step.partners.map((p) => (
          <PartnerRow key={p.name} partner={p} />
        ))}
      </ul>
      <footer className="mt-auto border-t border-[var(--rule)] px-4 py-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
          Why
        </span>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ink-dim)]">
          {step.why}
        </p>
      </footer>
    </article>
  );
}

function PartnerRow({ partner }: { partner: Partner }) {
  return (
    <li className="group relative">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-[var(--ink-muted)] group-hover:text-[var(--brand)]">
          ▸
        </span>
        <span className="text-sm text-[var(--ink)] group-hover:text-[var(--brand)]">
          {partner.name}
        </span>
        <StatusDot status={partner.status} />
      </div>
      {/* Tooltip */}
      <div
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-30 mt-1 w-[280px] translate-y-1 rounded-md border border-[var(--rule-strong)] bg-[var(--bg-elev-2)] p-3 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
          {partner.name}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[var(--ink)]">
          {partner.role}
        </p>
        {partner.why && (
          <p className="mt-2 text-[11px] italic leading-relaxed text-[var(--ink-dim)]">
            Why · {partner.why}
          </p>
        )}
        <div className="mt-3 border-t border-[var(--rule)] pt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          {partner.statusLabel}
        </div>
      </div>
    </li>
  );
}

const STATUS_COLOR: Record<Status, string> = {
  live: "rgb(52, 211, 153)",
  "sdk-sandbox": "rgb(96, 165, 250)",
  target: "var(--brand)",
  mock: "var(--ink-muted)",
  build: "rgb(244, 114, 182)",
  future: "var(--rule-strong)",
};

function StatusDot({ status }: { status: Status }) {
  return (
    <span
      aria-hidden
      className="ml-auto inline-block h-1.5 w-1.5 rounded-full"
      style={{ backgroundColor: STATUS_COLOR[status] }}
    />
  );
}

function LegendItem({ status, label }: { status: Status; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: STATUS_COLOR[status] }}
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-dim)]">
        {label}
      </span>
    </div>
  );
}

function Spine() {
  return (
    <section className="mt-12 rounded-md border border-[var(--brand)]/40 bg-black p-8 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--brand)]">
        VAULX CORE · 1 AUDITED ANCHOR PROGRAM · 4 VAULTS
      </div>
      <code
        className="mt-5 block font-mono text-[clamp(1rem,2.5vw,1.6rem)] tracking-tight text-white"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        require!(custody_confirmed ∧ terms_accepted)
      </code>
      <p className="mt-3 text-xs italic text-[var(--ink-muted)]">
        — the invariant the Solana runtime cannot bypass · 18–24 month replication moat
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-dim)]">
        <span>Inst-USDC</span>
        <span className="text-[var(--rule-strong)]">·</span>
        <span>Inst-BRL</span>
        <span className="text-[var(--rule-strong)]">·</span>
        <span>Retail-FIDC-USDC</span>
        <span className="text-[var(--rule-strong)]">·</span>
        <span>Retail-FIDC-BRL</span>
      </div>
    </section>
  );
}
