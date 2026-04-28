// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";

vi.mock("@/lib/admin/demo", () => ({
  loadOperatorKeypair: () => Keypair.generate(),
  walletFromKeypair: (kp: Keypair) => ({ publicKey: kp.publicKey, payer: kp }),
}));

import { derivePda, mintAttestationForWallet } from "../attestation";

describe("derivePda", () => {
  it("derives the canonical KycAttestation PDA from the user's wallet", () => {
    const wallet = new PublicKey("7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE");
    const pda = derivePda(wallet);
    expect(pda).toBeInstanceOf(PublicKey);
    expect(pda.toBase58()).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  });

  it("is deterministic", () => {
    const wallet = new PublicKey("7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE");
    expect(derivePda(wallet).toBase58()).toBe(derivePda(wallet).toBase58());
  });
});

describe("mintAttestationForWallet", () => {
  it("requires a non-empty 32-byte jwtHash", async () => {
    const wallet = new PublicKey("7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE");
    await expect(
      mintAttestationForWallet({
        wallet,
        jwtHash: new Uint8Array(0),
        applicantId: "abc",
      }),
    ).rejects.toThrow(/jwtHash must be 32 bytes/);
  });

  it("rejects non-32-byte jwtHash", async () => {
    const wallet = new PublicKey("7QpTNAveTSfQSEzjPCmfzgE9ZGrgkcUBmDZ97dcSixdE");
    await expect(
      mintAttestationForWallet({
        wallet,
        jwtHash: new Uint8Array(31),
        applicantId: "abc",
      }),
    ).rejects.toThrow(/jwtHash must be 32 bytes/);
  });
});
