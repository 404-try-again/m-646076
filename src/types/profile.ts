
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  status: string | null;
  bio?: string | null;
  updated_at?: string | null;
  online?: boolean;
}
