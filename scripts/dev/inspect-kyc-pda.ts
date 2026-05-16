import { Connection, PublicKey } from "@solana/web3.js";
import { vault as vaultFacade } from "@vaulx/anchor-client";

const wallet = new PublicKey(process.argv[2] ?? "FnfVcb7XpXfbX3UQpEW9pi39yg4s8ruC3TwcjMv126id");
const programId = new PublicKey(vaultFacade.programId);
const [pda] = PublicKey.findProgramAddressSync(
  [Buffer.from("kyc_attestation"), wallet.toBuffer()],
  programId,
);

async function main() {
  console.log("wallet      :", wallet.toBase58());
  console.log("vault prog  :", programId.toBase58());
  console.log("kyc pda     :", pda.toBase58());
  const conn = new Connection("https://api.devnet.solana.com", "confirmed");
  const acc = await conn.getAccountInfo(pda);
  if (!acc) {
    console.log("kyc status  : MISSING (no attestation on-chain)");
  } else {
    console.log("kyc status  : EXISTS");
    console.log("  owner     :", acc.owner.toBase58());
    console.log("  data len  :", acc.data.length);
    if (acc.data.length >= 80) {
      const attestor = new PublicKey(acc.data.subarray(40, 72));
      const attestedAt = Number(acc.data.readBigInt64LE(72));
      console.log("  attestor  :", attestor.toBase58());
      console.log("  attestedAt:", new Date(attestedAt * 1000).toISOString());
    }
  }
}
main().catch(console.error);
