"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cleanCpf, formatCpf, validateCpf } from "@/lib/govbr/cpf";
import { setGovbrVerification } from "@/lib/govbr/mock-storage";
import { mockNameForCpf } from "@/lib/govbr/names";

import { GovbrChrome } from "../_govbr-chrome";

const MOCK_AUTO_CPF = "111.444.777-35";

function maskCpfInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export default function GovbrLoginPage() {
  return (
    <Suspense fallback={null}>
      <GovbrLoginContent />
    </Suspense>
  );
}

function GovbrLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  const mockAuto = searchParams.get("mock") === "auto";
  const returnTo = searchParams.get("return_to") ?? "";

  const [cpf, setCpf] = useState(mockAuto ? MOCK_AUTO_CPF : "");
  const [password, setPassword] = useState(mockAuto ? "demo-pass" : "");
  const [authenticating, setAuthenticating] = useState(false);
  const submittedRef = useRef(false);

  function completeVerification(rawCpf: string) {
    const digits = cleanCpf(rawCpf);
    const formatted = formatCpf(digits);
    const name = mockNameForCpf(digits);
    const wallet = publicKey?.toBase58();
    if (!wallet) {
      toast.error("Connect your wallet before verifying.");
      setAuthenticating(false);
      router.push("/borrow/verify-id");
      return;
    }
    setGovbrVerification(wallet, {
      cpf: formatted,
      name,
      verified_at: Date.now(),
    });
    const qs = new URLSearchParams();
    if (returnTo) qs.set("return_to", returnTo);
    if (mockAuto) qs.set("mock", "auto");
    const s = qs.toString();
    router.push(`/borrow/verify-id/callback${s ? `?${s}` : ""}`);
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (authenticating) return;
    if (!validateCpf(cpf)) {
      toast.error("CPF inválido");
      return;
    }
    if (!password.trim()) {
      toast.error("Informe sua senha");
      return;
    }
    setAuthenticating(true);
    const delay = mockAuto ? 400 : 2000;
    setTimeout(() => completeVerification(cpf), delay);
  }

  useEffect(() => {
    if (!mockAuto || submittedRef.current) return;
    submittedRef.current = true;
    const t = setTimeout(() => handleSubmit(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockAuto]);

  return (
    <GovbrChrome>
      <div className="w-full max-w-md rounded-lg border border-[#1351B4]/15 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#1351B4]">Acesso gov.br</h1>
        <p className="mt-1 text-sm text-[#333]">
          Faça login com sua conta única do gov.br
        </p>

        {authenticating ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-6">
            <div
              aria-hidden
              className="h-10 w-10 animate-spin rounded-full border-4 border-[#1351B4]/20 border-t-[#1351B4]"
            />
            <p className="text-sm font-medium text-[#1351B4]">
              Autenticando…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-[#333]">
              <span className="font-medium">CPF</span>
              <Input
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(maskCpfInput(e.target.value))}
                autoComplete="off"
                className="border-[#1351B4]/30 text-[#1351B4] placeholder:text-[#1351B4]/40 focus-visible:ring-[#1351B4]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-[#333]">
              <span className="font-medium">Senha</span>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                className="border-[#1351B4]/30 text-[#1351B4] placeholder:text-[#1351B4]/40 focus-visible:ring-[#1351B4]"
              />
            </label>
            <Button
              type="submit"
              className="mt-2 bg-[#1351B4] text-white hover:bg-[#0D3F8F]"
            >
              Entrar
            </Button>
            <p className="mt-2 text-center text-xs text-[#666]">
              Esta é uma simulação. Nenhum dado real é enviado ao governo.
            </p>
          </form>
        )}
      </div>
    </GovbrChrome>
  );
}
