import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { SignInModal } from "../sign-in-modal";

const walletState = {
  connected: false,
  publicKey: null as { toBase58: () => string } | null,
  signMessage: undefined as undefined | ((msg: Uint8Array) => Promise<Uint8Array>),
};
const setVisible = vi.fn();
const signInWithWeb3 = vi.fn();
const linkAuthenticatedWalletMock = vi.fn();
const refresh = vi.fn();
const push = vi.fn();
const routerRefresh = vi.fn();

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => walletState,
}));

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible }),
}));

vi.mock("@vaulx/supabase/browser", () => ({
  createBrowserClient: () => ({ auth: { signInWithWeb3 } }),
}));

vi.mock("@/app/(auth)/actions", () => ({
  linkAuthenticatedWallet: (input: { email: string; wallet: string }) =>
    linkAuthenticatedWalletMock(input),
}));

vi.mock("@/lib/auth/client", () => ({
  useUser: () => ({ user: null, loading: false, refresh }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: routerRefresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

beforeEach(() => {
  walletState.connected = false;
  walletState.publicKey = null;
  walletState.signMessage = undefined;
  setVisible.mockReset();
  signInWithWeb3.mockReset();
  linkAuthenticatedWalletMock.mockReset();
  refresh.mockReset();
  push.mockReset();
  routerRefresh.mockReset();
});

describe("SignInModal", () => {
  it("renders both sign-in paths and the divider", () => {
    render(<SignInModal open={true} onOpenChange={() => {}} />);
    expect(screen.getByTestId("sign-in-crossmint").textContent).toMatch(
      /Continue with email or social/i,
    );
    expect(screen.getByTestId("sign-in-direct")).toBeTruthy();
    expect(screen.getAllByText(/or/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Terms/i)).toBeTruthy();
  });

  it("opens wallet-adapter modal when no wallet is connected", () => {
    render(<SignInModal open={true} onOpenChange={() => {}} />);
    fireEvent.click(screen.getByTestId("sign-in-direct"));
    expect(setVisible).toHaveBeenCalledWith(true);
    expect(signInWithWeb3).not.toHaveBeenCalled();
  });

  it("runs SIWS sign-in + linkAuthenticatedWallet when wallet is connected", async () => {
    const pubkey = "9w3TgmPwxFFu1xq4tGyHGT4qwq7e8c9P9PzL2dQjg1Yo";
    walletState.connected = true;
    walletState.publicKey = { toBase58: () => pubkey };
    walletState.signMessage = async (m: Uint8Array) => m;
    signInWithWeb3.mockResolvedValue({
      data: { user: { id: "u1" }, session: {} },
      error: null,
    });
    linkAuthenticatedWalletMock.mockResolvedValue({ ok: true });

    const onOpenChange = vi.fn();
    render(<SignInModal open={true} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByTestId("sign-in-direct"));

    await vi.waitFor(() => {
      expect(signInWithWeb3).toHaveBeenCalledTimes(1);
    });
    expect(signInWithWeb3.mock.calls[0]?.[0]).toMatchObject({ chain: "solana" });

    await vi.waitFor(() => {
      expect(linkAuthenticatedWalletMock).toHaveBeenCalledWith({
        wallet: pubkey,
      });
    });
    await vi.waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders the Crossmint button as disabled with a 'coming soon' badge and does not trigger any sign-in", () => {
    render(<SignInModal open={true} onOpenChange={() => {}} />);
    const btn = screen.getByTestId("sign-in-crossmint") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    expect(btn.textContent).toMatch(/coming soon/i);
    fireEvent.click(btn);
    expect(signInWithWeb3).not.toHaveBeenCalled();
    expect(linkAuthenticatedWalletMock).not.toHaveBeenCalled();
  });
});
