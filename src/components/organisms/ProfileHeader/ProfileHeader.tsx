import { Badge, Button } from "components/atoms";

interface ProfileHeaderProps {
  profileName: string;
  appCount: number;
  isActive: boolean;
  onSaveDock: () => void;
  onApplyProfile: () => void;
}

function ProfileHeader({
  profileName,
  appCount,
  isActive,
  onSaveDock,
  onApplyProfile,
}: ProfileHeaderProps) {
  return (
    <div
      className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-3" data-tauri-drag-region>
        <h2
          className="text-lg font-semibold text-gray-900 dark:text-white"
          data-tauri-drag-region
        >
          {profileName}
        </h2>
        <span className="text-sm text-gray-400 dark:text-slate-500">
          {appCount} {appCount === 1 ? "app" : "apps"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onSaveDock}>
          Save apps from Dock
        </Button>
        {isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Button variant="primary" onClick={onApplyProfile}>
            Apply to Dock
          </Button>
        )}
      </div>
    </div>
  );
}

export { ProfileHeader };
export type { ProfileHeaderProps };
