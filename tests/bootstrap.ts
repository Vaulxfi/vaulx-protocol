import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

describe("bootstrap", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  it("pings loan/auction programs", async () => {
    const provider = anchor.getProvider();
    const programs = [
      anchor.workspace.Loan as Program<any>,
      anchor.workspace.Auction as Program<any>,
    ];
    for (const program of programs) {
      const tx = await program.methods
        .ping()
        .accounts({ signer: provider.publicKey })
        .rpc();
      console.log(`${program.idl.metadata?.name ?? "program"} ping tx: ${tx}`);
    }
  });
});
