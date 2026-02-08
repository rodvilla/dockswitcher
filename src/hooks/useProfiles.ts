import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Profile } from "../types";

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [fetchedProfiles, fetchedActiveId] = await Promise.all([
        invoke<Profile[]>("get_profiles"),
        invoke<string | null>("get_active_profile_id"),
      ]);
      setProfiles(fetchedProfiles);
      setActiveProfileId(fetchedActiveId);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProfile = useCallback(
    async (name: string) => {
      const profile = await invoke<Profile>("create_profile", { name });
      await refresh();
      return profile;
    },
    [refresh],
  );

  const updateProfile = useCallback(
    async (profile: Profile) => {
      await invoke("update_profile", { profile });
      await refresh();
    },
    [refresh],
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      await invoke("delete_profile", { id });
      await refresh();
    },
    [refresh],
  );

  const reorderProfiles = useCallback(
    async (ids: string[]) => {
      await invoke("reorder_profiles", { ids });
      await refresh();
    },
    [refresh],
  );

  const applyProfile = useCallback(
    async (id: string) => {
      await invoke("apply_profile", { id });
      await refresh();
    },
    [refresh],
  );

  return {
    profiles,
    activeProfileId,
    loading,
    error,
    refresh,
    createProfile,
    updateProfile,
    deleteProfile,
    reorderProfiles,
    applyProfile,
  };
}
