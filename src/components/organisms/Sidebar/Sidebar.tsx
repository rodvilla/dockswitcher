import React, { useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Settings as SettingsIcon, Plus } from "lucide-react";
import { SortableProfileItem } from "../../molecules/SortableProfileItem";
import { Button } from "../../atoms/Button";
import type { SidebarProps } from "./types";

function Sidebar({
  profiles,
  selectedProfileId,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onRenameProfile,
  onReorderProfiles,
  onOpenSettings,
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const newProfileInputRef = useRef<HTMLInputElement>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    id: string;
  } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  useEffect(() => {
    if (isCreating && newProfileInputRef.current) {
      newProfileInputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = profiles.findIndex((p) => p.id === active.id);
      const newIndex = profiles.findIndex((p) => p.id === over.id);
      const newOrder = arrayMove(profiles, oldIndex, newIndex);
      onReorderProfiles(newOrder.map((p) => p.id));
    }
  };

  const handleCreateSubmit = async () => {
    if (newProfileName.trim()) {
      await onCreateProfile(newProfileName.trim());
    }
    setIsCreating(false);
    setNewProfileName("");
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateSubmit();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewProfileName("");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  return (
    <div className="flex h-full w-56 flex-col border-r border-gray-200 bg-gray-100/80 pt-8 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={profiles.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {profiles.map((profile) => (
              <SortableProfileItem
                key={profile.id}
                profile={profile}
                isSelected={selectedProfileId === profile.id}
                isActive={activeProfileId === profile.id}
                onSelect={() => onSelectProfile(profile.id)}
                onContextMenu={handleContextMenu}
                isRenaming={renamingId === profile.id}
                onRenameSubmit={(newName) => {
                  if (newName.trim() && newName !== profile.name) {
                    onRenameProfile(profile, newName.trim());
                  }
                  setRenamingId(null);
                }}
                onRenameCancel={() => setRenamingId(null)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {isCreating && (
          <div className="mx-2 mb-2 rounded-md bg-white p-2 ring-2 ring-blue-600 dark:bg-slate-700">
            <input
              ref={newProfileInputRef}
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              onBlur={handleCreateSubmit}
              placeholder="Profile Name"
              className="w-full bg-transparent px-3 py-2 text-lg outline-none dark:text-white"
            />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-100/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        {!isCreating && (
          <Button
            variant="ghost"
            size="lg"
            icon={<Plus className="h-4 w-4" />}
            className="w-full justify-start"
            onClick={() => setIsCreating(true)}
          >
            Add Profile
          </Button>
        )}
        <div className="my-2 border-t border-gray-200 dark:border-slate-700" />
        <Button
          variant="ghost"
          size="lg"
          icon={<SettingsIcon className="h-4 w-4" />}
          className="w-full justify-start"
          onClick={onOpenSettings}
        >
          Settings
        </Button>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-[120px] overflow-hidden rounded-lg bg-white/90 p-1 text-left shadow-xl backdrop-blur-sm ring-1 ring-black/5 dark:bg-slate-800/90 dark:ring-white/10"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            type="button"
            onClick={() => {
              setRenamingId(contextMenu.id);
              setContextMenu(null);
            }}
            className="flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white dark:text-gray-200"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              onDeleteProfile(contextMenu.id);
              setContextMenu(null);
            }}
            className="flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white dark:text-gray-200"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export { Sidebar };
