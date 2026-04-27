import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LtvGauge } from "../ltv-gauge";

// 1 USDC = 1_000_000 atoms — keeps the math obvious.
const USDC = 1_000_000n;

describe("<LtvGauge>", () => {
  it("renders the LTV percentage from atom ratio", () => {
    // 5_000 / 10_000 = 50%
    render(
      <LtvGauge
        loanAmountAtoms={5_000n * USDC}
        collateralValueAtoms={10_000n * USDC}
      />,
    );
    expect(screen.getByText("50%")).toBeDefined();
  });

  it("uses safe zone below 60%", () => {
    const { container } = render(
      <LtvGauge
        loanAmountAtoms={5_000n * USDC}
        collateralValueAtoms={10_000n * USDC}
      />,
    );
    expect(
      container.querySelector('[data-testid="ltv-gauge"]')?.getAttribute("data-zone"),
    ).toBe("safe");
  });

  it("flips to warn zone at 60-75%", () => {
    const { container } = render(
      <LtvGauge
        loanAmountAtoms={6_500n * USDC}
        collateralValueAtoms={10_000n * USDC}
      />,
    );
    expect(
      container.querySelector('[data-testid="ltv-gauge"]')?.getAttribute("data-zone"),
    ).toBe("warn");
  });

  it("flips to danger zone at >=75%", () => {
    const { container } = render(
      <LtvGauge
        loanAmountAtoms={8_000n * USDC}
        collateralValueAtoms={10_000n * USDC}
      />,
    );
    expect(
      container.querySelector('[data-testid="ltv-gauge"]')?.getAttribute("data-zone"),
    ).toBe("danger");
  });

  it("handles zero collateral without dividing by zero", () => {
    expect(() =>
      render(
        <LtvGauge loanAmountAtoms={1_000n * USDC} collateralValueAtoms={0n} />,
      ),
    ).not.toThrow();
    expect(screen.getByText("0%")).toBeDefined();
  });
});
