"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cleanCpf, formatCpf, validateCpf } from "@/lib/govbr/cpf";
import { mockNameForCpf } from "@/lib/govbr/names";

import { DemoShell } from "../../../_components/demo-shell";
import { useDemoSession } from "../../../_lib/use-demo-session";
import { DemoGovbrChrome } from "../_demo-govbr-chrome";

const MOCK_AUTO_CPF = "111.444.777-35";

function maskCpfInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export default function DemoGovbrLoginPage() {
  return (
    <Suspense fallback={null}>
      <DemoGovbrLoginContent />
    </Suspense>
  );
}

function DemoGovbrLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, patch } = useDemoSession();
  const mockAuto = searchParams.get("mock") === "auto";
  const returnTo = searchParams.get("return_to") ?? "/demo/borrow/onboard";

  const [cpf, setCpf] = useState(mockAuto ? MOCK_AUTO_CPF : "");
  const [password, setPassword] = useState(mockAuto ? "demo-pass" : "");
  const [authenticating, setAuthenticating] = useState(false);
  const submittedRef = useRef(false);

  function completeVerification(rawCpf: string) {
    const digits = cleanCpf(rawCpf);
    const formatted = formatCpf(digits);
    const name = mockNameForCpf(digits);
    const verifiedAt = Date.now();
    patch((s) => ({
      ...s,
      govbr: { cpf: formatted, name, verifiedAt },
    }));
    const qs = new URLSearchParams();
    qs.set("return_to", returnTo);
    if (mockAuto) qs.set("mock", "auto");
    router.push(`/demo/borrow/verify-id/callback?${qs.toString()}`);
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (authenticating) return;
    if (!session) return;
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
    if (!mockAuto || submittedRef.current || !session) return;
    submittedRef.current = true;
    const t = setTimeout(() => handleSubmit(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockAuto, session]);

  return (
    <DemoShell formFactor="phone">
      <DemoGovbrChrome>
        <div className="w-full rounded-lg border border-[#1351B4]/15 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold text-[#1351B4]">Acesso gov.br</h1>
          <p className="mt-1 text-xs text-[#333]">
            Faça login com sua conta única do gov.br
          </p>

          {authenticating ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-6">
              <div
                aria-hidden
                className="h-10 w-10 animate-spin rounded-full border-4 border-[#1351B4]/20 border-t-[#1351B4]"
              />
              <p className="text-sm font-medium text-[#1351B4]">
                Autenticando…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs text-[#333]">
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
              <label className="flex flex-col gap-1 text-xs text-[#333]">
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
              <p className="mt-1 text-center text-[10px] text-[#666]">
                Esta é uma simulação. Nenhum dado real é enviado ao governo.
              </p>
            </form>
          )}
        </div>
      </DemoGovbrChrome>
    </DemoShell>
  );
}
