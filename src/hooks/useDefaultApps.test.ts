import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { useDefaultApps } from "./useDefaultApps";
import type { Profile, AppEntry, DefaultApp } from "types/profile";

const createMockProfile = (
  apps: AppEntry[] = [],
  defaultApps: DefaultApp[] = []
): Profile => ({
  id: "test-profile-id",
  name: "Test Profile",
  apps,
  default_apps: defaultApps,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
});

const mockAppWithBundleId: AppEntry = {
  name: "Safari",
  path: "/Applications/Safari.app",
  bundle_id: "com.apple.Safari",
};

const mockAppWithoutBundleId: AppEntry = {
  name: "Some App",
  path: "/Applications/SomeApp.app",
};

describe("useDefaultApps", () => {
  let onUpdateProfile: MockedFunction<(profile: Profile) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    onUpdateProfile = vi.fn<(profile: Profile) => void>();
  });

  describe("initialization", () => {
    it("returns default state when profile is null", () => {
      const { result } = renderHook(() =>
        useDefaultApps(null, onUpdateProfile)
      );

      expect(result.current.showAddDefault).toBe(false);
      expect(result.current.appsWithBundleId).toEqual([]);
      expect(result.current.availableRoles.length).toBe(4);
    });

    it("filters apps to only those with bundle_id", () => {
      const profile = createMockProfile([
        mockAppWithBundleId,
        mockAppWithoutBundleId,
      ]);
      const { result } = renderHook(() =>
        useDefaultApps(profile, onUpdateProfile)
      );

      expect(result.current.appsWithBundleId).toHaveLength(1);
      expect(result.current.appsWithBundleId[0].bundle_id).toBe("com.apple.Safari");
    });
  });

  describe("availableRoles", () => {
    it("returns all roles when no default apps exist", () => {
      const profile = createMockProfile([mockAppWithBundleId]);
      const { result } = renderHook(() =>
        useDefaultApps(profile, onUpdateProfile)
      );

      expect(result.current.availableRoles).toHaveLength(4);
    });

    it("excludes roles that are already assigned", () => {
      const profile = createMockProfile([mockAppWithBundleId], [
        { bundle_id: "com.apple.Safari", role: "browser" },
      ]);
      const { result } = renderHook(() =>
        useDefaultApps(profile, onUpdateProfile)
      );

      const roleValues = result.current.availableRoles.map((r) => r.value);
      expect(roleValues).not.toContain("browser");
      expect(roleValues).toContain("email");
      expect(roleValues).toContain("ftp");
      expect(roleValues).toContain("calendar");
    });
  });

  describe("handleAddDefaultApp", () => {
    it("adds a default app to the profile", () => {
      const profile = createMockProfile([mockAppWithBundleId]);
      const { result } = renderHook(() =>
        useDefaultApps(profile, onUpdateProfile)
      );

      act(() => {
        result.current.setNewDefaultBundleId("com.apple.Safari");
        result.current.setNewDefaultRole("browser");
      });

      act(() => {
        result.current.handleAddDefaultApp();
      });

      expect(onUpdateProfile).toHaveBeenCalledTimes(1);
      const updatedProfile = onUpdateProfile.mock.calls[0][0];
      expect(updatedProfile.default_apps).toHaveLength(1);
      expect(updatedProfile.default_apps[0]).toEqual({
        bundle_id: "com.apple.Safari",
        role: "browser",
      });
    });

    it("does not add if role is already taken", () => {
      const profile = createMockProfile([mockAppWithBundleId], [
        { bundle_id: "com.apple.Mail", role: "browser" },
      ]);
      const { result } = renderHook(() =>
        useDefaultApps(profile, onUpdateProfile)
      );

      act(() => {
        result.current.setNewDefaultBundleId("com.apple.Safari");
        result.current.setNewDefaultRole("browser");
      });

      act(() => {
        result.current.handleAddDefaultApp();
      });

      expect(onUpdateProfile).not.toHaveBeenCalled();
    });

    it("resets form state after adding", () => {
      const profile = createMockProfile([mockAppWithBundleId]);
      const { result } = renderHook(() =>
        useDefaultApps(profile, onUpdateProfile)
      );

      act(() => {
        result.current.setShowAddDefault(true);
        result.current.setNewDefaultBundleId("com.apple.Safari");
        result.current.setNewDefaultRole("browser");
      });

      act(() => {
        result.current.handleAddDefaultApp();
      });

      expect(result.current.showAddDefault).toBe(false);
    });
  });

  describe("handleRemoveDefaultApp", () => {
    it("removes a default app from the profile", () => {
      const profile = createMockProfile([mockAppWithBundleId], [
        { bundle_id: "com.apple.Safari", role: "browser" },
        { bundle_id: "com.apple.Mail", role: "email" },
      ]);
      const { result } = renderHook(() =>
        useDefaultApps(profile, onUpdateProfile)
      );

      act(() => {
        result.current.handleRemoveDefaultApp(0);
      });

      expect(onUpdateProfile).toHaveBeenCalledTimes(1);
      const updatedProfile = onUpdateProfile.mock.calls[0][0];
      expect(updatedProfile.default_apps).toHaveLength(1);
      expect(updatedProfile.default_apps[0].role).toBe("email");
    });

    it("does nothing when profile is null", () => {
      const { result } = renderHook(() =>
        useDefaultApps(null, onUpdateProfile)
      );

      act(() => {
        result.current.handleRemoveDefaultApp(0);
      });

      expect(onUpdateProfile).not.toHaveBeenCalled();
    });
  });

  describe("initAddForm", () => {
    it("sets the first app with bundle_id as default selection", () => {
      const profile = createMockProfile([
        mockAppWithBundleId,
        { name: "Mail", path: "/Applications/Mail.app", bundle_id: "com.apple.Mail" },
      ]);
      const { result } = renderHook(() =>
        useDefaultApps(profile, onUpdateProfile)
      );

      act(() => {
        result.current.initAddForm();
      });

      expect(result.current.newDefaultBundleId).toBe("com.apple.Safari");
    });

    it("sets the first available role as default selection", () => {
      const profile = createMockProfile([mockAppWithBundleId], [
        { bundle_id: "com.apple.Safari", role: "browser" },
      ]);
      const { result } = renderHook(() =>
        useDefaultApps(profile, onUpdateProfile)
      );

      act(() => {
        result.current.initAddForm();
      });

      expect(result.current.newDefaultRole).toBe("email");
    });
  });
});
