import { describe, expect, it } from "vitest";

import { parseEvents } from "../webhook/parse";

describe("parseEvents", () => {
  it("returns empty for empty logs", () => {
    expect(parseEvents("loan", [])).toEqual([]);
  });

  it("returns empty for logs with no Program data lines", () => {
    const logs = [
      "Program BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow invoke [1]",
      "Program log: Instruction: ConfirmCustody",
      "Program BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow consumed 12345 of 200000 compute units",
      "Program BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow success",
    ];
    expect(parseEvents("loan", logs)).toEqual([]);
  });

  it("returns empty when Program data carries bytes that don't match any event discriminator", () => {
    // base64 'hello world' — not a valid Anchor event for any program here
    const logs = [
      "Program BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow invoke [1]",
      "Program data: aGVsbG8gd29ybGQ=",
      "Program BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow success",
    ];
    expect(parseEvents("loan", logs)).toEqual([]);
  });

  it("returns empty when called with an unknown program name", () => {
    expect(parseEvents("loan", [])).toEqual([]);
    // Cast to bypass the type — we want to verify the runtime guard.
    const fakeName = "nonexistent" as unknown as Parameters<
      typeof parseEvents
    >[0];
    expect(parseEvents(fakeName, ["Program data: aGVsbG8="])).toEqual([]);
  });

  it("ignores logs scoped to a different program", () => {
    // These logs reference the loan program id, but we ask the parser to
    // scope to vault. The parser only matches `Program <programId>`
    // boundaries for its own programId, so vault-scoped parsing on
    // loan-scoped logs returns zero events.
    const logs = [
      "Program BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow invoke [1]",
      "Program log: Instruction: ConfirmCustody",
      "Program BHdxEKkfsyjERiz5XiUybDLquvoWRtF7r1zDgVCDZJow success",
    ];
    expect(parseEvents("vault", logs)).toEqual([]);
  });
});
