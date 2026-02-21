import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Sidebar } from "./components/organisms/Sidebar";
import { ConfirmDialog } from "./components";
import { MainLayout } from "./components/templates";
import { ProfilePage, SettingsPage } from "./pages";
import { useProfiles, useDock, useSettings } from "./hooks";
import type { Profile, AppEntry, ConfirmDialogState } from "./types";

function App() {
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

  const {
    saveDockToProfile,
    addAppToProfile,
    removeAppFromProfile,
    checkDuti,
  } = useDock();

  const {
    settings,
    loading: settingsLoading,
    updateSettings,
  } = useSettings();

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
  }, [profiles, selectedProfileId, profilesLoading]);

  const handleCreateProfile = async (name: string) => {
    try {
      const newProfile = await createProfile(name);
      setSelectedProfileId(newProfile.id);
    } catch (error) {
      console.error("Failed to create profile:", error);
    }
  };

  const handleDeleteProfile = (id: string) => {
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
  };

  const handleApplyProfile = (id: string) => {
    const apply = async () => {
      await applyProfile(id);
    };

    if (settings.confirm_before_switch) {
      const profileName = profiles.find((p) => p.id === id)?.name || "this profile";
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
  };

  const handleSaveDock = async (id: string) => {
    try {
      await saveDockToProfile(id);
      await refreshProfiles();
    } catch (error) {
      console.error("Failed to save dock to profile:", error);
    }
  };

  const handleAddApp = async (id: string) => {
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
  };

  const handleRemoveApp = async (id: string, index: number) => {
    try {
      await removeAppFromProfile(id, index);
      await refreshProfiles();
    } catch (error) {
      console.error("Failed to remove app:", error);
    }
  };

  const handleReorderApps = async (id: string, apps: AppEntry[]) => {
    try {
      const profile = profiles.find((p) => p.id === id);
      if (profile) {
        await updateProfile({ ...profile, apps });
      }
    } catch (error) {
      console.error("Failed to reorder apps:", error);
    }
  };

  const handleRenameProfile = async (profile: Profile, newName: string) => {
    try {
      await updateProfile({ ...profile, name: newName });
    } catch (error) {
      console.error("Failed to rename profile:", error);
    }
  };

  const handleUpdateProfile = async (updatedProfile: Profile) => {
    try {
      await updateProfile(updatedProfile);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleUpdateSettings = async (updatedSettings: Parameters<typeof updateSettings>[0]) => {
    try {
      await updateSettings(updatedSettings);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  if (profilesLoading || settingsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-500"></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading DockSwitcher...</p>
        </div>
      </div>
    );
  }

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) || null;

  return (
    <MainLayout
      sidebar={
        <Sidebar
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          activeProfileId={activeProfileId}
          onSelectProfile={(id: string) => {
            setSelectedProfileId(id);
            setShowSettings(false);
          }}
          onCreateProfile={handleCreateProfile}
          onDeleteProfile={handleDeleteProfile}
          onRenameProfile={handleRenameProfile}
          onReorderProfiles={reorderProfiles}
          onOpenSettings={() => {
            setShowSettings(true);
            setSelectedProfileId(null);
          }}
        />
      }
    >
      {showSettings ? (
        <SettingsPage
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBack={() => {
            setShowSettings(false);
            if (profiles.length > 0) {
              setSelectedProfileId(profiles[0].id);
            }
          }}
        />
      ) : (
        <ProfilePage
          profile={selectedProfile}
          activeProfileId={activeProfileId}
          dutiAvailable={dutiAvailable}
          onApplyProfile={handleApplyProfile}
          onSaveDock={handleSaveDock}
          onAddApp={handleAddApp}
          onRemoveApp={handleRemoveApp}
          onReorderApps={handleReorderApps}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      <ConfirmDialog
        open={confirmDialogState.open}
        title={confirmDialogState.title}
        message={confirmDialogState.message}
        confirmLabel={confirmDialogState.confirmLabel}
        destructive={confirmDialogState.isDelete}
        onConfirm={async () => {
          try {
            await confirmDialogState.action();
            setConfirmDialogState((prev) => ({ ...prev, open: false }));
          } catch (error) {
            console.error("Failed to confirm dialog action:", error);
          }
        }}
        onCancel={() => setConfirmDialogState((prev) => ({ ...prev, open: false }))}
      />
    </MainLayout>
  );
}

export { App };
