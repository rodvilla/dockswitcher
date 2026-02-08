import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Settings } from "../types";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    launch_at_login: false,
    confirm_before_switch: false,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const fetched = await invoke<Settings>("get_settings");
      setSettings(fetched);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = useCallback(
    async (newSettings: Settings) => {
      await invoke("update_settings", { settings: newSettings });
      setSettings(newSettings);
    },
    [],
  );

  return { settings, loading, updateSettings };
}
