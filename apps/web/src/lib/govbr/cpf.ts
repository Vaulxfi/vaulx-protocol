/**
 * Validate a Brazilian CPF (Cadastro de Pessoas Físicas) using the official
 * check-digit algorithm. Accepts formatted (`000.000.000-00`) or raw
 * (`00000000000`) input. Returns `true` iff the check digits match and the
 * number is not an all-same-digit reserved pattern.
 */
export function validateCpf(input: string): boolean {
  if (typeof input !== "string") return false;
  const cpf = input.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]!, 10) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf[9]!, 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]!, 10) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cpf[10]!, 10)) return false;

  return true;
}

/**
 * Strip everything but digits.
 */
export function cleanCpf(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Format an 11-digit CPF into `000.000.000-00`. If the input is not exactly
 * 11 digits, returns the raw digits stripped.
 */
export function formatCpf(input: string): string {
  const digits = cleanCpf(input);
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Mask a formatted CPF for display: `111.***.***-35`.
 */
export function maskCpf(input: string): string {
  const digits = cleanCpf(input);
  if (digits.length !== 11) return input;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}
