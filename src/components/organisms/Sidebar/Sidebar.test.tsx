import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar } from "./Sidebar";
import type { Profile } from "types/profile";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
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

vi.mocked(invoke);

const profiles: Profile[] = [
  {
    id: "p1",
    name: "Work",
    apps: [],
    default_apps: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "p2",
    name: "Personal",
    apps: [],
    default_apps: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const defaultProps = {
  profiles,
  selectedProfileId: "p1",
  activeProfileId: "p1",
  onSelectProfile: vi.fn(),
  onCreateProfile: vi.fn(),
  onDeleteProfile: vi.fn(),
  onRenameProfile: vi.fn(),
  onReorderProfiles: vi.fn(),
  onOpenSettings: vi.fn(),
};

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all profile names", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("renders Add Profile and Settings buttons", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Add Profile")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("calls onSelectProfile when a profile is clicked", () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText("Personal"));
    expect(defaultProps.onSelectProfile).toHaveBeenCalledWith("p2");
  });

  it("calls onOpenSettings when Settings button is clicked", () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText("Settings"));
    expect(defaultProps.onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("shows new profile input when Add Profile is clicked", () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Profile"));
    expect(screen.getByPlaceholderText("Profile Name")).toBeInTheDocument();
  });

  it("calls onCreateProfile when new profile name is submitted", async () => {
    defaultProps.onCreateProfile.mockResolvedValue(undefined);
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Profile"));
    const input = screen.getByPlaceholderText("Profile Name");
    await act(async () => {
      fireEvent.change(input, { target: { value: "Dev" } });
      fireEvent.keyDown(input, { key: "Enter" });
    });
    expect(defaultProps.onCreateProfile).toHaveBeenCalledWith("Dev");
  });
});
