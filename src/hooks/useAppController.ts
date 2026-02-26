import { useCallback, useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useDock, useProfiles, useSettings } from "hooks";
import type { AppEntry, Profile } from "types/profile";
import type { ConfirmDialogState } from "types/ui";

export function useAppController() {
  const {
    profiles,
    activeProfileId,
    loading: profilesLoading,
    refresh: refreshProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    reorderProfiles,
    applyProfile,
  } = useProfiles();

  const { saveDockToProfile, addAppToProfile, removeAppFromProfile, checkDuti } = useDock();

  const { settings, loading: settingsLoading, updateSettings } = useSettings();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dutiAvailable, setDutiAvailable] = useState(true);

  const [confirmDialogState, setConfirmDialogState] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    action: () => {},
    confirmLabel: "Confirm",
  });

  useEffect(() => {
    checkDuti()
      .then(setDutiAvailable)
      .catch((err) => {
        console.error("Failed to check duti:", err);
        setDutiAvailable(false);
      });
  }, [checkDuti]);

  useEffect(() => {
    if (!selectedProfileId && profiles.length > 0 && !profilesLoading) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, profilesLoading, selectedProfileId]);

  const handleCreateProfile = useCallback(
    async (name: string) => {
      try {
        const newProfile = await createProfile(name);
        setSelectedProfileId(newProfile.id);
      } catch (error) {
        console.error("Failed to create profile:", error);
      }
    },
    [createProfile],
  );

  const handleDeleteProfile = useCallback(
    (id: string) => {
      setConfirmDialogState({
        open: true,
        title: "Delete Profile?",
        message: "Are you sure you want to delete this profile? This action cannot be undone.",
        confirmLabel: "Delete",
        isDelete: true,
        action: async () => {
          await deleteProfile(id);
          if (selectedProfileId === id) {
            setSelectedProfileId(null);
          }
          setConfirmDialogState((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [deleteProfile, selectedProfileId],
  );

  const handleApplyProfile = useCallback(
    (id: string) => {
      const apply = async () => {
        await applyProfile(id);
      };

      if (settings.confirm_before_switch) {
        const profileName = profiles.find((profile) => profile.id === id)?.name || "this profile";
        setConfirmDialogState({
          open: true,
          title: "Switch Dock Profile?",
          message: `Are you sure you want to switch to "${profileName}"? Your current Dock will be replaced.`,
          confirmLabel: "Switch",
          action: async () => {
            await apply();
            setConfirmDialogState((prev) => ({ ...prev, open: false }));
          },
        });
      } else {
        apply();
      }
    },
    [applyProfile, profiles, settings.confirm_before_switch],
  );

  const handleSaveDock = useCallback(
    async (id: string) => {
      try {
        await saveDockToProfile(id);
        await refreshProfiles();
      } catch (error) {
        console.error("Failed to save dock to profile:", error);
      }
    },
    [refreshProfiles, saveDockToProfile],
  );

  const handleAddApp = useCallback(
    async (id: string) => {
      try {
        const selected = await open({
          title: "Select Applications",
          defaultPath: "/Applications",
          directory: false,
          multiple: true,
          filters: [{ name: "Applications", extensions: ["app"] }],
        });

        if (selected) {
          const paths = Array.isArray(selected) ? selected : [selected];
          for (const path of paths) {
            await addAppToProfile(id, path);
          }
          await refreshProfiles();
        }
      } catch (error) {
        console.error("Failed to add app:", error);
      }
    },
    [addAppToProfile, refreshProfiles],
  );

  const handleRemoveApp = useCallback(
    async (id: string, index: number) => {
      try {
        await removeAppFromProfile(id, index);
        await refreshProfiles();
      } catch (error) {
        console.error("Failed to remove app:", error);
      }
    },
    [refreshProfiles, removeAppFromProfile],
  );

  const handleReorderApps = useCallback(
    async (id: string, apps: AppEntry[]) => {
      try {
        const profile = profiles.find((item) => item.id === id);
        if (profile) {
          await updateProfile({ ...profile, apps });
        }
      } catch (error) {
        console.error("Failed to reorder apps:", error);
      }
    },
    [profiles, updateProfile],
  );

  const handleRenameProfile = useCallback(
    async (profile: Profile, newName: string) => {
      try {
        await updateProfile({ ...profile, name: newName });
      } catch (error) {
        console.error("Failed to rename profile:", error);
      }
    },
    [updateProfile],
  );

  const handleUpdateProfile = useCallback(
    async (updatedProfile: Profile) => {
      try {
        await updateProfile(updatedProfile);
      } catch (error) {
        console.error("Failed to update profile:", error);
      }
    },
    [updateProfile],
  );

  const handleUpdateSettings = useCallback(
    async (updatedSettings: Parameters<typeof updateSettings>[0]) => {
      try {
        await updateSettings(updatedSettings);
      } catch (error) {
        console.error("Failed to update settings:", error);
      }
    },
    [updateSettings],
  );

  const handleSelectProfile = useCallback((id: string) => {
    setSelectedProfileId(id);
    setShowSettings(false);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
    setSelectedProfileId(null);
  }, []);

  const handleBackFromSettings = useCallback(() => {
    setShowSettings(false);
    if (profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles]);

  const handleConfirmDialogConfirm = useCallback(async () => {
    try {
      const { action } = confirmDialogState;
      await action();
      setConfirmDialogState((prev) => ({ ...prev, open: false }));
    } catch (error) {
      console.error("Failed to confirm dialog action:", error);
    }
  }, [confirmDialogState]);

  const handleConfirmDialogCancel = useCallback(() => {
    setConfirmDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) || null;

  return {
    profiles,
    activeProfileId,
    profilesLoading,
    settings,
    settingsLoading,
    selectedProfileId,
    selectedProfile,
    showSettings,
    dutiAvailable,
    confirmDialogState,
    handleCreateProfile,
    handleDeleteProfile,
    handleRenameProfile,
    handleReorderProfiles: reorderProfiles,
    handleApplyProfile,
    handleSaveDock,
    handleAddApp,
    handleRemoveApp,
    handleReorderApps,
    handleUpdateProfile,
    handleUpdateSettings,
    handleSelectProfile,
    handleOpenSettings,
    handleBackFromSettings,
    handleConfirmDialogConfirm,
    handleConfirmDialogCancel,
  };
}
