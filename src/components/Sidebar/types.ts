import type { Profile } from '../../types/profile';

export interface SidebarProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  activeProfileId: string | null;
  onSelectProfile: (id: string) => void;
  onCreateProfile: (name: string) => Promise<void>;
  onDeleteProfile: (id: string) => void;
  onRenameProfile: (profile: Profile, newName: string) => void;
  onReorderProfiles: (ids: string[]) => void;
  onOpenSettings: () => void;
}
