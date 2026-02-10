export interface AppEntry {
  name: string;
  path: string;
  icon?: string;
  bundle_id?: string;
}

export interface Profile {
  id: string;
  name: string;
  apps: AppEntry[];
  created_at: string;
  updated_at: string;
}
