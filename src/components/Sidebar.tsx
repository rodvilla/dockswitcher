import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Settings as SettingsIcon, Plus } from 'lucide-react';
import type { Profile } from '../types';

interface SidebarProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  activeProfileId: string | null;
  onSelectProfile: (id: string) => void;
  onCreateProfile: (name: string) => Promise<void>;
  onDeleteProfile: (id: string) => void;
  onRenameProfile: (profile: Profile, newName: string) => void;
  onReorderProfiles: (ids: string[]) => void;
  onOpenSettings: () => void;
}

interface SortableProfileItemProps {
  profile: Profile;
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  isRenaming: boolean;
  onRenameSubmit: (newName: string) => void;
  onRenameCancel: () => void;
}

const SortableProfileItem = ({
  profile,
  isSelected,
  isActive,
  onSelect,
  onContextMenu,
  isRenaming,
  onRenameSubmit,
  onRenameCancel,
}: SortableProfileItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: profile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  const [renameValue, setRenameValue] = useState(profile.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      setRenameValue(profile.name);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming, profile.name]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRenameSubmit(renameValue);
    } else if (e.key === 'Escape') {
      onRenameCancel();
    }
  };

  if (isRenaming) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="mx-2 mb-1 rounded-md bg-white p-1 ring-2 ring-blue-600 dark:bg-slate-700"
      >
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onRenameSubmit(renameValue)}
          className="w-full bg-transparent px-2 py-1 text-sm outline-none dark:text-white"
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onSelect}
      onContextMenu={(e) => onContextMenu(e, profile.id)}
      className={`group relative mx-2 mb-1 flex cursor-default select-none items-center rounded-md px-2 py-1.5 transition-colors ${
        isSelected
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-700'
      }`}
    >
      <div className="absolute left-1 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <div {...listeners} className="cursor-grab p-0.5 active:cursor-grabbing">
          <GripVertical className={`h-3 w-3 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`} />
        </div>
      </div>
      
      <div className="flex w-full items-center pl-5">
        {isActive && (
          <span className={`mr-2 h-2 w-2 rounded-full ${isSelected ? 'bg-green-300' : 'bg-green-500'}`} />
        )}
        <span className="truncate text-sm font-medium">{profile.name}</span>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  profiles,
  selectedProfileId,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onRenameProfile,
  onReorderProfiles,
  onOpenSettings,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const newProfileInputRef = useRef<HTMLInputElement>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (isCreating && newProfileInputRef.current) {
      newProfileInputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
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
    setNewProfileName('');
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSubmit();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewProfileName('');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  return (
    <div className="flex h-full w-56 flex-col border-r border-gray-200 bg-gray-100/80 pt-8 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex-1 overflow-y-auto py-2">
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
          <div className="mx-2 mb-1 rounded-md bg-white p-1 ring-2 ring-blue-600 dark:bg-slate-700">
            <input
              ref={newProfileInputRef}
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              onBlur={handleCreateSubmit}
              placeholder="Profile Name"
              className="w-full bg-transparent px-2 py-1 text-sm outline-none dark:text-white"
            />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-100/50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Profile</span>
          </button>
        )}
        <div className="my-1 border-t border-gray-200 dark:border-slate-700" />
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors"
        >
          <SettingsIcon className="h-4 w-4" />
          <span>Settings</span>
        </button>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 min-w-[120px] overflow-hidden rounded-lg bg-white/90 p-1 shadow-xl backdrop-blur-sm ring-1 ring-black/5 dark:bg-slate-800/90 dark:ring-white/10"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setRenamingId(contextMenu.id);
              setContextMenu(null);
            }}
            className="flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white dark:text-gray-200"
          >
            Rename
          </button>
          <button
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
};

export default Sidebar;
