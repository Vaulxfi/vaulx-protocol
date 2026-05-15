"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Calculator, Sliders } from "lucide-react";

import {
  CATEGORY_PRESETS_USD,
  type AssetCategory,
  type SimulatorTermMonths,
  type TokenSymbol,
  FALLBACK_BRL_USD,
  SIMULATOR_TERM_OPTIONS_MONTHS,
  computeSchedule,
  computeSimulator,
  convertCurrency,
  formatAmount,
} from "@/lib/protocol/params";

/**
 * Interactive loan simulator. Pixel-equivalent port of the inline script
 * in `site/resources/views/simulator.blade.php`. All math is delegated to
 * the typed module in `lib/protocol/params.ts` — keep that as the single
 * source of truth so the numeric-parity test stays meaningful.
 *
 * FX rate behavior: tries `GET /api/rates` for an `awesomeapi`-shaped
 * payload (matches Laravel's frontend `currency.js`). When the endpoint
 * is absent (the default in Wave 1; no API route shipped yet), the
 * fallback constant from `garantifi.php` (`5.18`) is used so the BRZ
 * column still displays plausible numbers.
 */

interface RateResponse {
  usd_brl?: number | string;
  brz_usd?: number | string;
  brz_brl?: number | string;
}

type CurrencyChoice = TokenSymbol;

const RATES_REFRESH_MS = 60_000;

function clampNumber(value: string, fallback = 0): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

export function SimulatorForm() {
  // Defaults match the Laravel `<input>` attributes (line numbers in comments
  // refer to simulator.blade.php on the freeze).
  const [category, setCategory] = useState<AssetCategory>("watch"); // line 33
  const [currency, setCurrency] = useState<CurrencyChoice>("USDC"); // line 44
  const [assetValue, setAssetValue] = useState<number>(15000); // line 56
  const [ltv, setLtv] = useState<number>(55); // line 62
  const [annualRate, setAnnualRate] = useState<number>(24); // line 71
  const [termMonths, setTermMonths] = useState<SimulatorTermMonths>(12); // line 80
  const [usdBrl, setUsdBrl] = useState<number>(FALLBACK_BRL_USD);

  // Fetch the FX rate once on mount + refresh every 60s. Matches the
  // 60-second cache in Laravel's `currency.js`.
  useEffect(() => {
    let cancelled = false;
    async function fetchRate(): Promise<void> {
      try {
        const res = await fetch("/api/rates", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as RateResponse;
        const next = data.usd_brl != null ? parseFloat(String(data.usd_brl)) : NaN;
        if (!cancelled && Number.isFinite(next) && next > 0) {
          setUsdBrl(next);
        }
      } catch {
        // Endpoint absent or network error — keep fallback. Silent by design.
      }
    }
    fetchRate();
    const id = setInterval(fetchRate, RATES_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const result = useMemo(
    () =>
      computeSimulator({
        assetValue,
        ltvPct: ltv,
        annualRatePct: annualRate,
        termMonths,
      }),
    [assetValue, ltv, annualRate, termMonths],
  );

  const schedule = useMemo(
    () =>
      computeSchedule({
        assetValue,
        ltvPct: ltv,
        annualRatePct: annualRate,
        termMonths,
      }),
    [assetValue, ltv, annualRate, termMonths],
  );

  const other: CurrencyChoice = currency === "USDC" ? "BRZ" : "USDC";
  const valuePrefix = currency === "BRZ" ? "R$" : "$";
  const valueSuffix = currency === "BRZ" ? "BRL" : "USD";

  function onCategoryChange(next: AssetCategory): void {
    setCategory(next);
    const presetUsd = CATEGORY_PRESETS_USD[next];
    const value =
      currency === "BRZ"
        ? convertCurrency(presetUsd, "USDC", "BRZ", usdBrl)
        : presetUsd;
    setAssetValue(Math.round(value));
  }

  function onCurrencyChange(next: CurrencyChoice): void {
    if (next === currency) return;
    const converted = convertCurrency(assetValue, currency, next, usdBrl);
    setCurrency(next);
    setAssetValue(Number(converted.toFixed(2)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:justify-center">
      {/* PARAMETERS */}
      <div
        className="border-l-[3px] border-l-[var(--vx-teal)] border border-[var(--vx-border)] bg-[var(--vx-surface)] p-6"
        style={{ borderRadius: 4 }}
      >
        <h5 className="mb-3 inline-flex items-center font-sans text-[1rem] font-bold text-[var(--vx-text)]">
          <Sliders className="me-2 h-4 w-4" style={{ color: "var(--vx-teal)" }} />
          Parameters
        </h5>

        {/* Asset category */}
        <div className="mb-3">
          <label
            className="mb-1 block font-sans text-[0.875rem] font-semibold text-[var(--vx-text)]"
            htmlFor="sim-category"
          >
            Asset category
          </label>
          <select
            id="sim-category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as AssetCategory)}
            className="block w-full border border-[var(--vx-border)] bg-[var(--vx-surface)] px-3 py-2 text-[var(--vx-text)] outline-none focus:border-[var(--vx-teal)]"
          >
            <option value="watch">Watch</option>
            <option value="jewelry">Jewelry</option>
            <option value="art">Art</option>
            <option value="vehicle">Vehicle</option>
          </select>
        </div>

        {/* Disbursement currency */}
        <div className="mb-3">
          <label className="mb-1 block font-sans text-[0.875rem] font-semibold text-[var(--vx-text)]">
            Disbursement currency
          </label>
          <div
            className="flex w-full"
            role="group"
            aria-label="Disbursement currency"
          >
            <button
              type="button"
              onClick={() => onCurrencyChange("USDC")}
              aria-pressed={currency === "USDC"}
              className={
                "flex-1 border px-3 py-2 font-mono text-[0.75rem] uppercase tracking-[0.14em] " +
                (currency === "USDC"
                  ? "border-[var(--vx-text)] bg-[var(--vx-text)] text-[var(--vx-bg)]"
                  : "border-[var(--vx-border)] bg-[var(--vx-surface)] text-[var(--vx-text)] hover:border-[var(--vx-text)]")
              }
            >
              USDC ($)
            </button>
            <button
              type="button"
              onClick={() => onCurrencyChange("BRZ")}
              aria-pressed={currency === "BRZ"}
              className={
                "flex-1 border-y border-r px-3 py-2 font-mono text-[0.75rem] uppercase tracking-[0.14em] " +
                (currency === "BRZ"
                  ? "border-[var(--vx-text)] bg-[var(--vx-text)] text-[var(--vx-bg)]"
                  : "border-[var(--vx-border)] bg-[var(--vx-surface)] text-[var(--vx-text)] hover:border-[var(--vx-text)]")
              }
            >
              BRZ (R$)
            </button>
          </div>
          <small className="mt-1 block text-[0.78rem] text-[var(--vx-text-muted)]">
            FX USD/BRL: R${" "}
            <span>{usdBrl > 0 ? usdBrl.toFixed(4) : "—"}</span>
          </small>
        </div>

        {/* Asset value */}
        <div className="mb-3">
          <label
            className="mb-1 block font-sans text-[0.875rem] font-semibold text-[var(--vx-text)]"
            htmlFor="sim-value"
          >
            Estimated asset value ({valueSuffix})
          </label>
          <div className="flex">
            <span className="inline-flex items-center border border-r-0 border-[var(--vx-border)] bg-[var(--vx-surface-2)] px-3 font-sans text-[0.95rem] text-[var(--vx-text-muted)]">
              {valuePrefix}
            </span>
            <input
              id="sim-value"
              type="number"
              min={1000}
              step={500}
              value={assetValue}
              onChange={(e) => setAssetValue(clampNumber(e.target.value))}
              className="block w-full border border-[var(--vx-border)] bg-[var(--vx-surface)] px-3 py-2 text-[var(--vx-text)] outline-none focus:border-[var(--vx-teal)]"
            />
          </div>
        </div>

        {/* LTV slider */}
        <div className="mb-3">
          <label
            className="mb-1 block font-sans text-[0.875rem] font-semibold text-[var(--vx-text)]"
            htmlFor="sim-ltv"
          >
            LTV: <span>{ltv}</span>%
          </label>
          <input
            id="sim-ltv"
            type="range"
            min={20}
            max={90}
            step={1}
            value={ltv}
            onChange={(e) => setLtv(clampNumber(e.target.value, 20))}
            className="block w-full accent-[var(--vx-teal)]"
            aria-valuemin={20}
            aria-valuemax={90}
            aria-valuenow={ltv}
          />
          <div className="flex justify-between text-[0.78rem] text-[var(--vx-text-muted)]">
            <span>20% (conservative)</span>
            <span>90% (aggressive)</span>
          </div>
        </div>

        {/* Annual interest slider */}
        <div className="mb-3">
          <label
            className="mb-1 block font-sans text-[0.875rem] font-semibold text-[var(--vx-text)]"
            htmlFor="sim-rate"
          >
            Annual interest rate: <span>{annualRate}</span>%
          </label>
          <input
            id="sim-rate"
            type="range"
            min={12}
            max={36}
            step={1}
            value={annualRate}
            onChange={(e) => setAnnualRate(clampNumber(e.target.value, 12))}
            className="block w-full accent-[var(--vx-teal)]"
            aria-valuemin={12}
            aria-valuemax={36}
            aria-valuenow={annualRate}
          />
          <small className="mt-1 block text-[0.78rem] text-[var(--vx-text-muted)]">
            Model: linear simple interest (spec §3)
          </small>
        </div>

        {/* Term */}
        <div className="mb-3">
          <label
            className="mb-1 block font-sans text-[0.875rem] font-semibold text-[var(--vx-text)]"
            htmlFor="sim-term"
          >
            Term
          </label>
          <select
            id="sim-term"
            value={termMonths}
            onChange={(e) =>
              setTermMonths(
                parseInt(e.target.value, 10) as SimulatorTermMonths,
              )
            }
            className="block w-full border border-[var(--vx-border)] bg-[var(--vx-surface)] px-3 py-2 text-[var(--vx-text)] outline-none focus:border-[var(--vx-teal)]"
          >
            {SIMULATOR_TERM_OPTIONS_MONTHS.map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULT + SCHEDULE COLUMN */}
      <div className="flex flex-col gap-6">
        <div
          className="border-l-[3px] border-l-[var(--vx-teal-2)] border border-[var(--vx-border)] bg-[var(--vx-surface)] p-6"
          style={{ borderRadius: 4 }}
        >
          <h5 className="mb-3 inline-flex items-center font-sans text-[1rem] font-bold text-[var(--vx-text)]">
            <Calculator
              className="me-2 h-4 w-4"
              style={{ color: "var(--vx-teal-2)" }}
            />
            Result
          </h5>

          <div className="grid grid-cols-2 gap-3">
            <ResultCell
              label="Asset value"
              primary={formatAmount(assetValue, currency)}
              alt={
                "≈ " +
                formatAmount(
                  convertCurrency(assetValue, currency, other, usdBrl),
                  other,
                )
              }
              large
            />
            <ResultCell
              label="Credit disbursed"
              primary={formatAmount(result.principal, currency)}
              alt={
                "≈ " +
                formatAmount(
                  convertCurrency(result.principal, currency, other, usdBrl),
                  other,
                )
              }
              large
              primaryColor="var(--vx-teal-2)"
            />
            <ResultCell
              label="Origination fee (2.5%)"
              primary={formatAmount(result.originationFee, currency)}
            />
            <ResultCell
              label="You receive net"
              primary={formatAmount(result.netAmount, currency)}
              primaryColor="var(--vx-teal)"
            />
          </div>

          <hr className="my-4 border-0 border-t border-[var(--vx-border)]" />

          <div className="grid grid-cols-2 gap-3">
            <ResultCell
              label="Monthly payment (linear)"
              primary={formatAmount(result.monthly, currency)}
              large
            />
            <ResultCell
              label="Total to pay"
              primary={formatAmount(result.totalPaid, currency)}
              large
            />
            <ResultCell
              label="Total interest"
              primary={formatAmount(result.totalInterest, currency)}
            />
            <ResultCell
              label="Effective total cost (CET)"
              primary={result.cetPct.toFixed(1) + "%"}
            />
          </div>
        </div>

        <div
          className="border border-[var(--vx-border)] bg-[var(--vx-surface)] p-6"
          style={{ borderRadius: 4 }}
        >
          <h6 className="mb-3 inline-flex items-center font-sans text-[0.95rem] font-bold text-[var(--vx-text)]">
            <BarChart3 className="me-2 h-4 w-4" />
            Schedule (linear installments)
          </h6>
          <div className="overflow-y-auto" style={{ maxHeight: 250 }}>
            <table className="w-full border-collapse text-[0.85rem]">
              <thead className="sticky top-0 bg-[var(--vx-surface-2)]">
                <tr className="text-left">
                  <Th>#</Th>
                  <Th>Principal</Th>
                  <Th>Interest</Th>
                  <Th>Payment</Th>
                  <Th>Balance</Th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr
                    key={row.index}
                    className="border-t border-[var(--vx-border-soft)]"
                  >
                    <Td>{row.index}</Td>
                    <Td>{formatAmount(row.principalPortion, currency)}</Td>
                    <Td>{formatAmount(row.interestPortion, currency)}</Td>
                    <Td>{formatAmount(row.payment, currency)}</Td>
                    <Td>{formatAmount(row.balance, currency)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center bg-[var(--vx-text)] px-8 py-3 text-[var(--vx-bg)] font-mono text-[0.875rem] uppercase tracking-[0.14em] font-semibold border border-[var(--vx-text)] hover:bg-transparent hover:text-[var(--vx-text)] transition-colors duration-150 ease-glide"
          >
            Request Loan
          </a>
        </div>
      </div>
    </div>
  );
}

interface ResultCellProps {
  label: string;
  primary: string;
  alt?: string;
  large?: boolean;
  primaryColor?: string;
}

function ResultCell({
  label,
  primary,
  alt,
  large,
  primaryColor,
}: ResultCellProps) {
  return (
    <div>
      <small className="block text-[0.78rem] text-[var(--vx-text-muted)]">
        {label}
      </small>
      <strong
        className={
          "block font-sans font-bold " +
          (large ? "text-[1.25rem]" : "text-[1rem]")
        }
        style={primaryColor ? { color: primaryColor } : undefined}
      >
        {primary}
      </strong>
      {alt ? (
        <small className="block text-[0.78rem] text-[var(--vx-text-muted)]">
          {alt}
        </small>
      ) : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-2 py-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[var(--vx-text-muted)]">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-2 py-2 font-sans text-[var(--vx-text)]">{children}</td>
  );
}
