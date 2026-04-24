import { SiteFooter } from "@/components/vaulx/site-footer";
import { SiteHeader } from "@/components/vaulx/site-header";
import { TestStream } from "@/components/vaulx/test-stream";

export const metadata = {
  title: "Vaulx QA · Live test runner",
  description:
    "Watch the Vaulx Anchor test suite run live against localnet — 45+ on-chain tests, stdout/stderr streamed as SSE.",
};

export default function AdminTestsPage() {
  return (
    <>
      <SiteHeader />

      <main className="relative">
        <section className="border-b border-[var(--rule)] py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1040px] px-6 md:px-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[var(--brand)]" />
              <span className="eyebrow">Vaulx QA · Live test runner</span>
            </div>

            <h1
              className="mt-8 font-display font-extrabold leading-[1.02] tracking-[-0.025em] text-[var(--ink)]"
              style={{
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                fontVariationSettings: '"opsz" 144',
              }}
            >
              Anchor test — <em className="not-italic italic font-normal text-[var(--brand)]">live</em>.
            </h1>

            <p className="mt-6 max-w-[62ch] font-sans text-base leading-[1.65] text-[var(--ink-dim)] md:text-[17px]">
              This page streams the full Vaulx on-chain test suite (45+ tests across the
              vault, loan, TRDC, and auction programs) in real time from{" "}
              <span className="font-mono text-[var(--ink)]">anchor test --skip-build</span>{" "}
              against a fresh localnet. No recordings, no aggregates — the terminal
              below is the server&apos;s stdout and stderr as it runs.
            </p>

            <div className="mt-12">
              <TestStream />
            </div>

            <aside className="mt-10 rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-6">
              <div className="eyebrow text-[var(--ink-muted)]">Operator note</div>
              <p className="mt-3 font-sans text-sm leading-[1.65] text-[var(--ink-dim)]">
                Requires the Anchor CLI (<span className="font-mono">anchor 0.30.1</span>)
                and the Solana CLI on the server&apos;s PATH. Mainnet or Devnet deployment
                would need a sandboxed runner (Docker, queued job); this hackathon-grade
                wiring spawns the child process directly on the dev machine so judges can
                verify the suite live. On Vercel, the serverless function-duration cap
                (30s Hobby / 300s Pro) will cut the stream before the suite finishes —
                run locally for the full demo.
              </p>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
