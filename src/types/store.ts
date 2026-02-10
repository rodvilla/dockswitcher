import type { Profile } from './profile';
import type { Settings } from './settings';

export interface StoreData {
  profiles: Profile[];
  active_profile_id: string | null;
  settings: Settings;
  schema_version: number;
}
