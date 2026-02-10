import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { invoke } from "@tauri-apps/api/core";
import { useSettings } from "./useSettings";
import type { Settings } from "../types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("useSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads settings on mount", async () => {
    const settings: Settings = {
      launch_at_login: true,
      confirm_before_switch: true,
    };

    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_settings") return settings;
      return null;
    });

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.settings).toEqual(settings);
    });

    expect(result.current.settings).toEqual(settings);
    expect(mockInvoke).toHaveBeenCalledWith("get_settings");
  });

  it("updateSettings invokes and updates local state", async () => {
    const settings: Settings = {
      launch_at_login: false,
      confirm_before_switch: false,
    };

    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_settings") return settings;
      return null;
    });

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.settings).toEqual(settings);
    });

    const nextSettings: Settings = {
      launch_at_login: true,
      confirm_before_switch: false,
    };

    await act(async () => {
      await result.current.updateSettings(nextSettings);
    });

    expect(mockInvoke).toHaveBeenCalledWith("update_settings", {
      settings: nextSettings,
    });
    expect(result.current.settings).toEqual(nextSettings);
  });
});
