import { describe, it, expect, vi, beforeEach } from "vitest";
import { PublicKey } from "@solana/web3.js";

import { GET } from "../route";
import * as trdcLib from "@/lib/chain/trdc";

const VALID_LOAN_ID = "11111111111111111111111111111112"; // 32-char base58 pubkey
const ASSET_ID = new PublicKey(
  "BoundFc8oS5xKhPRLaTu1uupRsh5cwbgF2NJYVDUfQpL",
);

function mintedState(
  overrides: Partial<trdcLib.TrdcState> = {},
): trdcLib.TrdcState {
  const loanIdPk = new PublicKey(VALID_LOAN_ID);
  return {
    loanId: loanIdPk,
    loanIdBase58: VALID_LOAN_ID,
    loanIdShort: VALID_LOAN_ID.slice(0, 8),
    status: "active",
    statusName: "Active",
    appraisalValue: 25_000_000_000n,
    loanAmount: 15_000_000_000n,
    principalRemaining: 15_000_000_000n,
    rateBps: 1500,
    dueTs: 1_800_000_000,
    createdAt: 1_790_000_000,
    docHash: new Uint8Array(32).fill(0xab),
    docHashHex: "ab".repeat(32),
    docHashShort: "abababab",
    borrower: PublicKey.default,
    assetId: ASSET_ID,
    isMinted: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/trdc/[loanId]/metadata", () => {
  it("returns 404 for malformed loan_id (regex reject, no chain call)", async () => {
    const spy = vi
      .spyOn(trdcLib, "loadTrdcState")
      .mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/x"), {
      params: { loanId: "not-a-pubkey" },
    });

    expect(res.status).toBe(404);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns 404 when TRDCState missing", async () => {
    vi.spyOn(trdcLib, "loadTrdcState").mockResolvedValue(null);

    const res = await GET(new Request("http://localhost/x"), {
      params: { loanId: VALID_LOAN_ID },
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 when loadTrdcState throws (no 500 leakage)", async () => {
    vi.spyOn(trdcLib, "loadTrdcState").mockRejectedValue(
      new Error("boom: rpc dead"),
    );

    const res = await GET(new Request("http://localhost/x"), {
      params: { loanId: VALID_LOAN_ID },
    });

    expect(res.status).toBe(404);
    const text = await res.text();
    // Must not contain raw error text.
    expect(text).not.toMatch(/boom|rpc dead/);
  });

  it("returns 404 when TRDC not yet minted (asset_id default)", async () => {
    vi.spyOn(trdcLib, "loadTrdcState").mockResolvedValue(
      mintedState({ assetId: PublicKey.default, isMinted: false }),
    );

    const res = await GET(new Request("http://localhost/x"), {
      params: { loanId: VALID_LOAN_ID },
    });

    expect(res.status).toBe(404);
    expect(await res.text()).toMatch(/not yet minted/i);
  });

  it("returns 200 + Metaplex JSON for valid minted TRDC", async () => {
    vi.spyOn(trdcLib, "loadTrdcState").mockResolvedValue(mintedState());

    const res = await GET(new Request("http://localhost/x"), {
      params: { loanId: VALID_LOAN_ID },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;

    expect(json.symbol).toBe("VTRDC");
    expect(json.name).toBe("VTRDC-11111111-abababab");
    expect(json.description).toMatch(/Tokenized Receipt/);
    expect(json.image).toContain(`/api/trdc/${VALID_LOAN_ID}/image`);
    expect(Array.isArray(json.attributes)).toBe(true);

    const attrs = json.attributes as Array<{ trait_type: string; value: unknown }>;
    const find = (k: string) => attrs.find((a) => a.trait_type === k)?.value;

    expect(find("Status")).toBe("Active");
    expect(find("Appraisal hash")).toBe("ab".repeat(32));
    expect(find("Loan ID")).toBe(VALID_LOAN_ID);
    expect(find("Asset ID")).toBe(ASSET_ID.toBase58());
    expect(find("Rate (bps)")).toBe(1500);

    const props = json.properties as { category: string; files: unknown[] };
    expect(props.category).toBe("image");
    expect(props.files).toHaveLength(1);
  });

  it("response JSON contains substantive on-chain fields, not URL params (SR-6)", async () => {
    // Even when the URL param has padding/oddness within the regex, every
    // substantive field MUST come from the mocked on-chain TrdcState.
    const onChainAssetId = new PublicKey(
      "DmvcUNFGr1zzwYJ8nuB1FjsT7gskV9JAhBHuSVEgK6Qe",
    );
    vi.spyOn(trdcLib, "loadTrdcState").mockResolvedValue(
      mintedState({
        assetId: onChainAssetId,
        statusName: "Repaid",
        status: "repaid",
        docHashHex: "cd".repeat(32),
        docHashShort: "cdcdcdcd",
      }),
    );

    const res = await GET(new Request("http://localhost/x"), {
      params: { loanId: VALID_LOAN_ID },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    const attrs = json.attributes as Array<{ trait_type: string; value: unknown }>;
    const find = (k: string) => attrs.find((a) => a.trait_type === k)?.value;

    // On-chain fields, not URL-derived.
    expect(find("Status")).toBe("Repaid");
    expect(find("Asset ID")).toBe(onChainAssetId.toBase58());
    expect(find("Appraisal hash")).toBe("cd".repeat(32));
    // Name embeds on-chain hash short-form, not URL bytes.
    expect(json.name).toBe("VTRDC-11111111-cdcdcdcd");
  });

  it("response is cacheable (Cache-Control header set)", async () => {
    vi.spyOn(trdcLib, "loadTrdcState").mockResolvedValue(mintedState());

    const res = await GET(new Request("http://localhost/x"), {
      params: { loanId: VALID_LOAN_ID },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toMatch(/max-age=\d+/);
  });
});
