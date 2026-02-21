import { ProfileHeader, AppList, DefaultAppsSection } from "components/organisms";
import type { Profile, AppEntry } from "types/profile";

interface ProfilePageProps {
  profile: Profile | null;
  activeProfileId: string | null;
  dutiAvailable: boolean;
  onApplyProfile: (id: string) => void;
  onSaveDock: (id: string) => void;
  onAddApp: (id: string) => void;
  onRemoveApp: (id: string, index: number) => void;
  onReorderApps: (id: string, apps: AppEntry[]) => void;
  onUpdateProfile: (profile: Profile) => void;
}

function ProfilePage({
  profile,
  activeProfileId,
  dutiAvailable,
  onApplyProfile,
  onSaveDock,
  onAddApp,
  onRemoveApp,
  onReorderApps,
  onUpdateProfile,
}: ProfilePageProps) {
  if (!profile) {
    return (
      <div className="flex flex-1 flex-col min-h-0 items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No Profile Selected
          </h3>
          <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
            Select a profile from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  const isActive = profile.id === activeProfileId;
  const handleReorderApps = (apps: AppEntry[]) =>
    onReorderApps(profile.id, apps);
  const handleRemoveApp = (index: number) => onRemoveApp(profile.id, index);
  const handleAddApp = () => onAddApp(profile.id);
  const handleSaveDock = () => onSaveDock(profile.id);
  const handleApplyProfile = () => onApplyProfile(profile.id);

  return (
    <div className="flex flex-1 flex-col max-h-full overflow-hidden">
      <ProfileHeader
        profileName={profile.name}
        appCount={profile.apps.length}
        isActive={isActive}
        onSaveDock={handleSaveDock}
        onApplyProfile={handleApplyProfile}
      />
      <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Apps
          </h3>
          <AppList
            apps={profile.apps}
            onReorderApps={handleReorderApps}
            onRemoveApp={handleRemoveApp}
            onAddApp={handleAddApp}
          />
        </div>
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
          <DefaultAppsSection
            profile={profile}
            dutiAvailable={dutiAvailable}
            onUpdateProfile={onUpdateProfile}
          />
        </div>
      </div>
    </div>
  );
}

export { ProfilePage };
export type { ProfilePageProps };
