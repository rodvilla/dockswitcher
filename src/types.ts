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

export interface Settings {
  launch_at_login: boolean;
  confirm_before_switch: boolean;
}

export interface StoreData {
  profiles: Profile[];
  active_profile_id: string | null;
  settings: Settings;
  schema_version: number;
}
