import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import trdcIdl from "../../packages/idls/src/trdc.json";

const conn = new Connection("https://api.devnet.solana.com", "confirmed");
const dummy = {
  publicKey: PublicKey.default,
  signTransaction: async (t: any) => t,
  signAllTransactions: async (t: any) => t,
};
const provider = new AnchorProvider(conn, dummy as any, { commitment: "confirmed" });
const program = new Program(trdcIdl as unknown as Idl, provider);

const pda = new PublicKey(process.argv[2] ?? "2D4jLz4aPkszHry1prCavMeyjuDQfEyYAjTdXS31masS");

async function main() {
  const state = await (program.account as any).trdcState.fetch(pda);
  console.log("trdc_state pda :", pda.toBase58());
  console.log("status         :", JSON.stringify(state.status));
  console.log("borrower       :", new PublicKey(state.borrower).toBase58());
  console.log("loan_amount    :", state.loanAmount?.toString());
  console.log("doc_hash present:", Array.isArray(state.docHash) && state.docHash.some((b: number) => b !== 0));
}
main().catch(console.error);
