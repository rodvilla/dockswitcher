export interface DefaultApp {
  bundle_id: string;
  role: string;
}

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
  default_apps: DefaultApp[];
  created_at: string;
  updated_at: string;
}
