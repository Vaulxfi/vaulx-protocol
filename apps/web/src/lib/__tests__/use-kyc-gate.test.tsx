import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKycGate } from "../use-kyc-gate";

const mockUseUnifiedWallet = vi.fn();
vi.mock("@/components/providers/crossmint-wallet-adapter", () => ({
  useUnifiedWallet: () => mockUseUnifiedWallet(),
}));

// KycRequiredModal pulls in SumsubVerify which imports `@sumsub/websdk`.
// In jsdom test env the SDK touches `window` mid-import, so stub the modal
// out of the hook's render tree — we only test gate logic here.
vi.mock("@/components/vaulx/kyc-required-modal", () => ({
  KycRequiredModal: () => null,
}));

const fetchMock = vi.fn();
beforeEach(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
  mockUseUnifiedWallet.mockReset();
});

describe("useKycGate", () => {
  it("runs the action immediately when SAS is verified", async () => {
    mockUseUnifiedWallet.mockReturnValue({ publicKey: { toBase58: () => "PUBKEY1" } });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ kyc: "verified" }),
    });
    const { result } = renderHook(() => useKycGate("Deposit USDC"));
    const action = vi.fn().mockResolvedValue("done");
    let res: unknown;
    await act(async () => {
      res = await result.current.guard(action);
    });
    expect(action).toHaveBeenCalledOnce();
    expect(res).toBe("done");
    expect(result.current.modalOpen).toBe(false);
  });

  it("opens the modal when SAS is missing", async () => {
    mockUseUnifiedWallet.mockReturnValue({ publicKey: { toBase58: () => "PUBKEY2" } });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ kyc: "missing" }),
    });
    const { result } = renderHook(() => useKycGate("Deposit USDC"));
    const action = vi.fn();
    await act(async () => {
      void result.current.guard(action);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(action).not.toHaveBeenCalled();
    expect(result.current.modalOpen).toBe(true);
  });

  it("rejects the deferred action when user cancels", async () => {
    mockUseUnifiedWallet.mockReturnValue({ publicKey: { toBase58: () => "PUBKEY3" } });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ kyc: "missing" }),
    });
    const { result } = renderHook(() => useKycGate("Deposit USDC"));
    const action = vi.fn();
    let caught: unknown = null;
    await act(async () => {
      result.current
        .guard(action)
        .catch((e) => {
          caught = e;
        });
      await new Promise((r) => setTimeout(r, 10));
      result.current.cancel();
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(action).not.toHaveBeenCalled();
    expect(caught).toBeInstanceOf(Error);
    expect(result.current.modalOpen).toBe(false);
  });
});
