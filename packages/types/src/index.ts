export enum TRDCStatus {
  PendingCustody = "PENDING_CUSTODY",
  Active = "ACTIVE",
  Renewed = "RENEWED",
  Repaid = "REPAID",
  Overdue = "OVERDUE",
  Defaulted = "DEFAULTED",
  Liquidated = "LIQUIDATED",
}

export enum VaulxError {
  CustodyNotConfirmed = "CustodyNotConfirmed",
  UnauthorizedCaller = "UnauthorizedCaller",
  UnauthorizedCustodian = "UnauthorizedCustodian",
  InvalidStateTransition = "InvalidStateTransition",
  LTVExceeded = "LTVExceeded",
  InsufficientVaultLiquidity = "InsufficientVaultLiquidity",
  MathOverflow = "MathOverflow",
  PaymentAmountMismatch = "PaymentAmountMismatch",
  RenewalWindowClosed = "RenewalWindowClosed",
  AuctionClosed = "AuctionClosed",
  NotWhitelisted = "NotWhitelisted",
  BidBelowMinimum = "BidBelowMinimum",
  KYCRequired = "KYCRequired",
}

export type Bps = number & { __brand: "bps" };
export const bps = (n: number): Bps => n as Bps;
