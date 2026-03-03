import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { App } from "./App";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("@dnd-kit/sortable", async () => {
  const actual = await vi.importActual<typeof import("@dnd-kit/sortable")>("@dnd-kit/sortable");
  return {
    ...actual,
    SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
  };
});

const mockInvoke = vi.mocked(invoke);

const baseProfile = {
  id: "p1",
  name: "Work",
  apps: [],
  default_apps: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner while data is loading", () => {
    mockInvoke.mockImplementation(() => new Promise(() => {}));
    render(<App />);
    expect(screen.getByText("Loading DockSwitcher...")).toBeInTheDocument();
  });

  it("renders Sidebar and ProfilePage after loading", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_profiles") return [baseProfile];
      if (cmd === "get_active_profile_id") return "p1";
      if (cmd === "get_settings")
        return {
          launch_at_login: false,
          confirm_before_switch: false,
          show_notifications: false,
        };
      if (cmd === "check_duti") return true;
      return null;
    });

    render(<App />);

    expect(await screen.findByText("Work")).toBeInTheDocument();
  });

  it("renders Settings button in Sidebar", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_profiles") return [baseProfile];
      if (cmd === "get_active_profile_id") return "p1";
      if (cmd === "get_settings")
        return {
          launch_at_login: false,
          confirm_before_switch: false,
          show_notifications: false,
        };
      if (cmd === "check_duti") return true;
      return null;
    });

    render(<App />);

    expect(await screen.findByText("Settings")).toBeInTheDocument();
  });
});
