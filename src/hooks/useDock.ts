import { useCallback, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { AppEntry } from "../types";

export function useDock() {
  const [loading, setLoading] = useState(false);

  const getCurrentDockApps = useCallback(async () => {
    return invoke<AppEntry[]>("get_current_dock_apps");
  }, []);

  const saveDockToProfile = useCallback(async (profileId: string) => {
    setLoading(true);
    try {
      const apps = await invoke<AppEntry[]>("save_dock_to_profile", {
        profileId,
      });
      return apps;
    } finally {
      setLoading(false);
    }
  }, []);

  const addAppToProfile = useCallback(
    async (profileId: string, appPath: string) => {
      return invoke<AppEntry>("add_app_to_profile", { profileId, appPath });
    },
    [],
  );

  const removeAppFromProfile = useCallback(
    async (profileId: string, appIndex: number) => {
      await invoke("remove_app_from_profile", { profileId, appIndex });
    },
    [],
  );

  const checkDockutil = useCallback(async () => {
    return invoke<boolean>("check_dockutil");
  }, []);

  return {
    loading,
    getCurrentDockApps,
    saveDockToProfile,
    addAppToProfile,
    removeAppFromProfile,
    checkDockutil,
  };
}
