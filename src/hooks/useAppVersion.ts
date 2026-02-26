import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";

export function useAppVersion() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getVersion()
      .then((v) => {
        if (isMounted) {
          setVersion(v);
        }
      })
      .catch((error) => {
        console.error("Failed to load app version:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { version };
}
