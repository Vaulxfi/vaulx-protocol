const NAMES = [
  "João Silva",
  "Maria Souza",
  "Carlos Oliveira",
  "Ana Pereira",
  "Pedro Santos",
  "Juliana Costa",
  "Rafael Almeida",
  "Fernanda Lima",
  "Lucas Rodrigues",
  "Camila Ferreira",
];

function hashCpf(cpf: string): number {
  let h = 0;
  for (let i = 0; i < cpf.length; i++) {
    h = (h * 31 + cpf.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Pick a stable mock Brazilian full name from a CPF string (digits only or
 * formatted). Same CPF always yields the same name.
 */
export function mockNameForCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  const idx = hashCpf(digits) % NAMES.length;
  return NAMES[idx]!;
}
