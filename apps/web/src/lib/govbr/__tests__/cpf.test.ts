import { describe, expect, it } from "vitest";

import { validateCpf } from "../cpf";

describe("validateCpf", () => {
  it("accepts a valid formatted CPF", () => {
    expect(validateCpf("111.444.777-35")).toBe(true);
  });

  it("accepts a valid unformatted CPF", () => {
    expect(validateCpf("11144477735")).toBe(true);
  });

  it("rejects a CPF with wrong check digit", () => {
    expect(validateCpf("111.444.777-36")).toBe(false);
  });

  it("rejects all-same-digit CPFs", () => {
    expect(validateCpf("111.111.111-11")).toBe(false);
  });

  it("rejects empty/short strings", () => {
    expect(validateCpf("")).toBe(false);
  });
});
