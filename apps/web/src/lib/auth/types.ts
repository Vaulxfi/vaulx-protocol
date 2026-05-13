export type UserRole = 'borrower' | 'admin' | 'evaluator_online' | 'evaluator_offline';

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  solana_address: string | null;
  created_at: string;
  updated_at: string;
};
