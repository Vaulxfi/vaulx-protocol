import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { expect } from "chai";
import { ensureLoanConfig, sharedCustodian } from "./_shared";

describe("loan / confirm_custody", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const loanProgram = anchor.workspace.Loan as Program<any>;
  const trdcProgram = anchor.workspace.Trdc as Program<any>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const custodian = sharedCustodian;
  const [loanConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("loan_config")],
    loanProgram.programId,
  );

  function randomAssetHint(): number[] {
    const buf = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) buf[i] = Math.floor(Math.random() * 256);
    return Array.from(buf);
  }

  function randomDocHash(): number[] {
    const buf = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) buf[i] = Math.floor(Math.random() * 256);
    return Array.from(buf);
  }

  function nowPlus30Days(): BN {
    return new BN(Math.floor(Date.now() / 1000) + 30 * 86400);
  }

  async function mintFreshTrdc(): Promise<PublicKey> {
    const loanId = Keypair.generate().publicKey;
    const [trdcStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("trdc_state"), loanId.toBuffer()],
      trdcProgram.programId,
    );
    await loanProgram.methods
      .createCcbTrdc(
        loanId,
        new BN(100),
        new BN(50),
        nowPlus30Days(),
        randomAssetHint(),
      )
      .accounts({
        trdcState: trdcStatePda,
        trdcProgram: trdcProgram.programId,
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
          loanConfig: loanConfigPda,
          gatewayToken: SystemProgram.programId,
      })
      .rpc();
    return trdcStatePda;
  }

  before(async () => {
    await ensureLoanConfig(loanProgram, provider);
  });

  it("test_confirm_custody_only_by_custodian — non-custodian signer reverts", async () => {
    const trdcStatePda = await mintFreshTrdc();
    const [loanConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan_config")],
      loanProgram.programId,
    );

    const impostor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      impostor.publicKey,
      LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig, "confirmed");

    let threw = false;
    let code: string | undefined;
    try {
      await loanProgram.methods
        .confirmCustody(randomDocHash())
        .accounts({
          trdcState: trdcStatePda,
          loanConfig: loanConfigPda,
          trdcProgram: trdcProgram.programId,
          custodian: impostor.publicKey,
        })
        .signers([impostor])
        .rpc();
    } catch (e: any) {
      threw = true;
      code = e.error?.errorCode?.code ?? e.code;
    }
    expect(threw).to.eq(true);
    expect(code).to.eq("UnauthorizedCustodian");
  });

  it("test_confirm_custody_writes_doc_hash — happy path writes hash + transitions to ActiveInCustody", async () => {
    const trdcStatePda = await mintFreshTrdc();
    const [loanConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("loan_config")],
      loanProgram.programId,
    );

    const docHash = randomDocHash();

    await loanProgram.methods
      .confirmCustody(docHash)
      .accounts({
        trdcState: trdcStatePda,
        loanConfig: loanConfigPda,
        trdcProgram: trdcProgram.programId,
        custodian: custodian.publicKey,
      })
      .signers([custodian])
      .rpc();

    const state = await trdcProgram.account.trdcState.fetch(trdcStatePda);
    expect(state.status).to.deep.equal({ activeInCustody: {} });
    const onChainHash = Array.from(state.docHash as number[]);
    expect(onChainHash).to.deep.equal(docHash);
  });
});
