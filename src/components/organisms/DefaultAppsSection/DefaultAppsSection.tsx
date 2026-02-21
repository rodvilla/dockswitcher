import { Plus, X, AlertTriangle } from "lucide-react";
import { Select, Button } from "../../atoms";
import { DefaultAppCard } from "../../molecules/DefaultAppCard";
import { useDefaultApps } from "../../../hooks/useDefaultApps";
import type { Profile } from "../../../types/profile";

interface DefaultAppsSectionProps {
  profile: Profile;
  dutiAvailable: boolean;
  onUpdateProfile: (profile: Profile) => void;
}

function DefaultAppsSection({
  profile,
  dutiAvailable,
  onUpdateProfile,
}: DefaultAppsSectionProps) {
  const {
    showAddDefault,
    setShowAddDefault,
    newDefaultBundleId,
    setNewDefaultBundleId,
    newDefaultRole,
    setNewDefaultRole,
    defaultAppRoles,
    availableRoles,
    appsWithBundleId,
    handleAddDefaultApp,
    handleRemoveDefaultApp,
    initAddForm,
  } = useDefaultApps(profile, onUpdateProfile);

  const handleStartAdd = () => {
    initAddForm();
    setShowAddDefault(true);
  };

  const getRoleLabel = (role: string) => {
    return defaultAppRoles.find((r) => r.value === role)?.label ?? role;
  };

  const getAppName = (bundleId: string) => {
    const app = appsWithBundleId.find((a) => a.bundle_id === bundleId);
    return app?.name ?? bundleId;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300">
          Default Applications
        </h3>
        {!showAddDefault && availableRoles.length > 0 && (
          <Button variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={handleStartAdd}>
            Add
          </Button>
        )}
      </div>

      {!dutiAvailable && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            duti is not installed. Default app switching requires duti.
            Install with: <code className="px-1 bg-yellow-100 dark:bg-yellow-900/50 rounded">brew install duti</code>
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-slate-500">
        Set default applications for specific URL schemes when this profile is active.
      </p>

      {profile.default_apps.length > 0 && (
        <div className="space-y-2">
          {profile.default_apps.map((defaultApp, index) => (
            <DefaultAppCard
              key={`${defaultApp.bundle_id}-${defaultApp.role}`}
              appName={getAppName(defaultApp.bundle_id)}
              roleLabel={getRoleLabel(defaultApp.role)}
              onRemove={() => handleRemoveDefaultApp(index)}
            />
          ))}
        </div>
      )}

      {showAddDefault && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Add Default App
            </span>
            <button
              type="button"
              onClick={() => setShowAddDefault(false)}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="App"
              options={appsWithBundleId.map((a) => a.bundle_id ?? "")}
              value={newDefaultBundleId}
              onChange={setNewDefaultBundleId}
              placeholder="Select app"
            />
            <Select
              label="Role"
              options={availableRoles.map((r) => r.value)}
              value={newDefaultRole}
              onChange={setNewDefaultRole}
              placeholder="Select role"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddDefault(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddDefaultApp}>
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DefaultAppsSection };
export type { DefaultAppsSectionProps };
