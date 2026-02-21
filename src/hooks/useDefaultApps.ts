import { useState, useCallback, useMemo } from "react";
import type { Profile, AppEntry, DefaultApp } from "types/profile";

const DEFAULT_APP_ROLES: { value: string; label: string }[] = [
  { value: "browser", label: "Browser (HTTP/HTTPS)" },
  { value: "email", label: "Email (mailto)" },
  { value: "ftp", label: "FTP" },
  { value: "calendar", label: "Calendar (webcal)" },
];

export function useDefaultApps(
  profile: Profile | null,
  onUpdateProfile: (profile: Profile) => void
) {
  const [showAddDefault, setShowAddDefault] = useState(false);
  const [newDefaultBundleId, setNewDefaultBundleId] = useState("");
  const [newDefaultRole, setNewDefaultRole] = useState(DEFAULT_APP_ROLES[0].value);

  const appsWithBundleId = useMemo(() => {
    if (!profile) return [];
    return profile.apps.filter(
      (app: AppEntry): app is AppEntry & { bundle_id: string } =>
        Boolean(app.bundle_id)
    );
  }, [profile]);

  const availableRoles = useMemo(() => {
    if (!profile) return DEFAULT_APP_ROLES;
    return DEFAULT_APP_ROLES.filter(
      (r) => !profile.default_apps.some((da: DefaultApp) => da.role === r.value)
    );
  }, [profile]);

  const handleAddDefaultApp = useCallback(() => {
    if (!profile) return;

    const isValid = newDefaultBundleId && appsWithBundleId.some((a: AppEntry) => a.bundle_id === newDefaultBundleId);
    const roleTaken = profile.default_apps.some((da: DefaultApp) => da.role === newDefaultRole);

    if (!isValid || roleTaken) return;

    const updated: DefaultApp[] = [
      ...profile.default_apps,
      { bundle_id: newDefaultBundleId, role: newDefaultRole },
    ];
    onUpdateProfile({ ...profile, default_apps: updated });
    setShowAddDefault(false);
    setNewDefaultBundleId("");

    const nextAvailableRole = DEFAULT_APP_ROLES.find(r => !updated.some(da => da.role === r.value));
    if (nextAvailableRole) {
      setNewDefaultRole(nextAvailableRole.value);
    }
  }, [profile, newDefaultBundleId, newDefaultRole, appsWithBundleId, onUpdateProfile]);

  const handleRemoveDefaultApp = useCallback((index: number) => {
    if (!profile) return;
    const updated = profile.default_apps.filter((_: DefaultApp, i: number) => i !== index);
    onUpdateProfile({ ...profile, default_apps: updated });
  }, [profile, onUpdateProfile]);

  const initAddForm = useCallback(() => {
    setNewDefaultBundleId(appsWithBundleId[0]?.bundle_id ?? "");
    const nextAvailableRole = availableRoles[0];
    if (nextAvailableRole) {
      setNewDefaultRole(nextAvailableRole.value);
    }
  }, [appsWithBundleId, availableRoles]);

  return {
    showAddDefault,
    setShowAddDefault,
    newDefaultBundleId,
    setNewDefaultBundleId,
    newDefaultRole,
    setNewDefaultRole,
    defaultAppRoles: DEFAULT_APP_ROLES,
    availableRoles,
    appsWithBundleId,
    handleAddDefaultApp,
    handleRemoveDefaultApp,
    initAddForm,
  };
}
