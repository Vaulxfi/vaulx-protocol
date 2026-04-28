"use client";

import { useEffect, useState } from "react";

/**
 * TRDC viewer card. Fetches the Vaulx-hosted Metaplex metadata
 * (`/api/trdc/[loanId]/metadata`) and renders it as a single card with a
 * Solscan deep-link to the cNFT asset.
 *
 * Failure modes:
 *   - 404 (TRDC not yet minted) → friendly placeholder
 *   - any other error → friendly placeholder (we never blow up the page)
 */

type MetaplexAttribute = {
  trait_type: string;
  value: string | number;
};

type MetaplexJson = {
  name: string;
  symbol: string;
  description: string;
  image?: string;
  external_url?: string;
  attributes: MetaplexAttribute[];
};

interface TrdcViewerProps {
  loanId: string;
  network?: "devnet" | "mainnet-beta";
}

export function TrdcViewer({ loanId, network = "devnet" }: TrdcViewerProps) {
  const [data, setData] = useState<MetaplexJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    fetch(`/api/trdc/${loanId}/metadata`)
      .then((r) =>
        r.ok ? (r.json() as Promise<MetaplexJson>) : Promise.reject(new Error("not-minted")),
      )
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "unknown";
          setError(msg);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loanId]);

  if (error) {
    return (
      <div className="rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          TRDC cNFT
        </div>
        <p className="mt-2 text-sm text-[var(--ink-dim)]">
          TRDC not yet minted — appears once on-chain mint completes.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          TRDC cNFT
        </div>
        <p className="mt-2 text-sm text-[var(--ink-dim)]">Loading TRDC…</p>
      </div>
    );
  }

  const assetId = data.attributes.find((a) => a.trait_type === "Asset ID")?.value;
  const solscanUrl =
    typeof assetId === "string" && assetId.length > 0
      ? `https://solscan.io/token/${assetId}?cluster=${network}`
      : null;

  return (
    <div className="rounded-md border border-[var(--rule)] bg-[var(--bg-elev-1)] p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
          TRDC cNFT
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand)]">
          {data.symbol}
        </span>
      </div>

      <h3 className="mt-3 font-mono text-sm text-[var(--ink)]">{data.name}</h3>
      <p className="mt-2 text-xs text-[var(--ink-dim)]">{data.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        {data.attributes.map((a) => (
          <div key={a.trait_type}>
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {a.trait_type}
            </dt>
            <dd
              className="mt-1 truncate font-mono text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
              title={String(a.value)}
            >
              {String(a.value)}
            </dd>
          </div>
        ))}
      </dl>

      {solscanUrl && (
        <a
          href={solscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--brand)] hover:underline"
        >
          View on Solscan ↗
        </a>
      )}
    </div>
  );
}
