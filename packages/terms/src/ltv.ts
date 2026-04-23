export const MAX_LTV_BPS = 6000;

export function calculateLTV(loanAmount: bigint, appraisalValue: bigint): number {
  if (appraisalValue === 0n) return 0;
  return Number((loanAmount * 10_000n) / appraisalValue);
}

export function isLTVAllowed(ltvBps: number): boolean {
  return ltvBps <= MAX_LTV_BPS;
}

export function maxLoanAmount(appraisalValue: bigint, ltvBps: number): bigint {
  return (appraisalValue * BigInt(ltvBps)) / 10_000n;
}
