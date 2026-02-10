import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { invoke } from "@tauri-apps/api/core";
import { useProfiles } from "./useProfiles";
import type { Profile } from "../types";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("useProfiles", () => {
  const profiles: Profile[] = [
    {
      id: "profile-1",
      name: "Work",
      apps: [],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads profiles and active id on mount", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_profiles") return profiles;
      if (cmd === "get_active_profile_id") return "profile-1";
      return null;
    });

    const { result } = renderHook(() => useProfiles());

    await waitFor(() => {
      expect(result.current.profiles).toEqual(profiles);
    });

    expect(result.current.activeProfileId).toBe("profile-1");
    expect(mockInvoke).toHaveBeenCalledWith("get_profiles");
    expect(mockInvoke).toHaveBeenCalledWith("get_active_profile_id");
  });

  it("createProfile invokes command and refreshes", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_profiles") return profiles;
      if (cmd === "get_active_profile_id") return "profile-1";
      if (cmd === "create_profile") return profiles[0];
      return null;
    });

    const { result } = renderHook(() => useProfiles());

    await waitFor(() => !result.current.loading);

    await act(async () => {
      await result.current.createProfile("Work");
    });

    expect(mockInvoke).toHaveBeenCalledWith("create_profile", { name: "Work" });
    expect(mockInvoke).toHaveBeenCalledWith("get_profiles");
    expect(mockInvoke).toHaveBeenCalledWith("get_active_profile_id");
  });

  it("updateProfile invokes command and refreshes", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_profiles") return profiles;
      if (cmd === "get_active_profile_id") return "profile-1";
      return null;
    });

    const { result } = renderHook(() => useProfiles());

    await waitFor(() => !result.current.loading);

    await act(async () => {
      await result.current.updateProfile(profiles[0]);
    });

    expect(mockInvoke).toHaveBeenCalledWith("update_profile", {
      profile: profiles[0],
    });
    expect(mockInvoke).toHaveBeenCalledWith("get_profiles");
    expect(mockInvoke).toHaveBeenCalledWith("get_active_profile_id");
  });

  it("deleteProfile invokes command and refreshes", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_profiles") return profiles;
      if (cmd === "get_active_profile_id") return "profile-1";
      return null;
    });

    const { result } = renderHook(() => useProfiles());

    await waitFor(() => !result.current.loading);

    await act(async () => {
      await result.current.deleteProfile("profile-1");
    });

    expect(mockInvoke).toHaveBeenCalledWith("delete_profile", { id: "profile-1" });
    expect(mockInvoke).toHaveBeenCalledWith("get_profiles");
    expect(mockInvoke).toHaveBeenCalledWith("get_active_profile_id");
  });

  it("reorderProfiles invokes command and refreshes", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_profiles") return profiles;
      if (cmd === "get_active_profile_id") return "profile-1";
      return null;
    });

    const { result } = renderHook(() => useProfiles());

    await waitFor(() => !result.current.loading);

    await act(async () => {
      await result.current.reorderProfiles(["profile-1"]);
    });

    expect(mockInvoke).toHaveBeenCalledWith("reorder_profiles", {
      ids: ["profile-1"],
    });
    expect(mockInvoke).toHaveBeenCalledWith("get_profiles");
    expect(mockInvoke).toHaveBeenCalledWith("get_active_profile_id");
  });

  it("applyProfile invokes command and refreshes", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_profiles") return profiles;
      if (cmd === "get_active_profile_id") return "profile-1";
      return null;
    });

    const { result } = renderHook(() => useProfiles());

    await waitFor(() => !result.current.loading);

    await act(async () => {
      await result.current.applyProfile("profile-1");
    });

    expect(mockInvoke).toHaveBeenCalledWith("apply_profile", { id: "profile-1" });
    expect(mockInvoke).toHaveBeenCalledWith("get_profiles");
    expect(mockInvoke).toHaveBeenCalledWith("get_active_profile_id");
  });

  it("sets error when refresh fails", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_profiles") throw new Error("boom");
      if (cmd === "get_active_profile_id") return "profile-1";
      return null;
    });

    const { result } = renderHook(() => useProfiles());

    await waitFor(() => {
      expect(result.current.error).toContain("boom");
    });
  });
});
