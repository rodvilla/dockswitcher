import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { invoke } from "@tauri-apps/api/core";
import { useDock } from "./useDock";
import type { AppEntry } from "../types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("useDock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCurrentDockApps invokes command", async () => {
    const apps: AppEntry[] = [
      { name: "Safari", path: "/Applications/Safari.app" },
    ];
    mockInvoke.mockResolvedValueOnce(apps);

    const { result } = renderHook(() => useDock());

    await waitFor(() => expect(result.current).not.toBeNull());

    const fetched = await result.current.getCurrentDockApps();

    expect(fetched).toEqual(apps);
    expect(mockInvoke).toHaveBeenCalledWith("get_current_dock_apps");
  });

  it("saveDockToProfile invokes and toggles loading", async () => {
    const apps: AppEntry[] = [
      { name: "Notes", path: "/Applications/Notes.app" },
    ];

    const { result } = renderHook(() => useDock());

    await waitFor(() => expect(result.current).not.toBeNull());

    let resolveInvoke: ((value: AppEntry[]) => void) | undefined;
    mockInvoke.mockImplementationOnce(
      () =>
        new Promise<AppEntry[]>((resolve) => {
          resolveInvoke = resolve;
        }),
    );

    let saved: AppEntry[] | undefined;
    let savePromise: Promise<AppEntry[]> | undefined;

    act(() => {
      savePromise = result.current.saveDockToProfile("p1");
    });

    await waitFor(() => expect(result.current.loading).toBe(true));

    resolveInvoke?.(apps);

    await act(async () => {
      saved = await savePromise;
    });

    expect(saved).toEqual(apps);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockInvoke).toHaveBeenCalledWith("save_dock_to_profile", {
      profileId: "p1",
    });
  });

  it("addAppToProfile invokes with profileId and appPath", async () => {
    const app: AppEntry = { name: "Mail", path: "/Applications/Mail.app" };
    mockInvoke.mockResolvedValueOnce(app);

    const { result } = renderHook(() => useDock());

    await waitFor(() => expect(result.current).not.toBeNull());

    const added = await result.current.addAppToProfile("p1", app.path);

    expect(added).toEqual(app);
    expect(mockInvoke).toHaveBeenCalledWith("add_app_to_profile", {
      profileId: "p1",
      appPath: app.path,
    });
  });

  it("removeAppFromProfile invokes with profileId and appIndex", async () => {
    mockInvoke.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useDock());

    await waitFor(() => expect(result.current).not.toBeNull());

    await result.current.removeAppFromProfile("p1", 2);

    expect(mockInvoke).toHaveBeenCalledWith("remove_app_from_profile", {
      profileId: "p1",
      appIndex: 2,
    });
  });

  it("checkDockutil invokes command", async () => {
    mockInvoke.mockResolvedValueOnce(true);

    const { result } = renderHook(() => useDock());

    await waitFor(() => expect(result.current).not.toBeNull());

    const available = await result.current.checkDockutil();

    expect(available).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("check_dockutil");
  });
});
