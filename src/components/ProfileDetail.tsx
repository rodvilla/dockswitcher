import React from 'react';
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
import { GripVertical, Trash2, Plus, Download, Play } from 'lucide-react';
import type { Profile } from '../types';

interface ProfileDetailProps {
  profile: Profile | null;
  activeProfileId: string | null;
  onApplyProfile: (id: string) => void;
  onSaveDock: (id: string) => void;
  onAddApp: (id: string) => void;
  onRemoveApp: (id: string, index: number) => void;
  onUpdateProfile: (profile: Profile) => void;
}

interface SortableAppItemProps {
  app: { name: string; path: string; icon?: string };
  id: string;
  onRemove: () => void;
}

const SortableAppItem = ({ app, id, onRemove }: SortableAppItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  const initial = app.name.charAt(0).toUpperCase();
  // Simple color hash based on name length for variety
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 
    'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
  ];
  const colorIndex = app.name.length % colors.length;
  const bgClass = colors[colorIndex];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
    >
      <div {...attributes} {...listeners} className="cursor-grab opacity-0 active:cursor-grabbing group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${bgClass}`}>
        <span className="text-lg font-bold">{initial}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-gray-900 dark:text-white">{app.name}</span>
        <span className="truncate text-xs text-gray-400 dark:text-slate-500">{app.path}</span>
      </div>

      <button
        onClick={onRemove}
        className="rounded-md p-2 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
        title="Remove app"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

const ProfileDetail: React.FC<ProfileDetailProps> = ({
  profile,
  activeProfileId,
  onApplyProfile,
  onSaveDock,
  onAddApp,
  onRemoveApp,
  onUpdateProfile,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!profile) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 p-8 text-center dark:bg-slate-900">
        <div className="rounded-full bg-gray-100 p-4 dark:bg-slate-800">
          <Download className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Profile Selected</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Select a profile from the sidebar or create a new one to get started.
        </p>
      </div>
    );
  }

  const isActive = activeProfileId === profile.id;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = profile.apps.findIndex((app) => app.path === active.id);
      const newIndex = profile.apps.findIndex((app) => app.path === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newApps = arrayMove(profile.apps, oldIndex, newIndex);
        onUpdateProfile({ ...profile, apps: newApps });
      }
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {profile.apps.length === 0 ? 'No apps' : `${profile.apps.length} app${profile.apps.length === 1 ? '' : 's'}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSaveDock(profile.id)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Save apps from Dock
          </button>
          
          {isActive ? (
            <span className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Active
            </span>
          ) : (
            <button
              onClick={() => onApplyProfile(profile.id)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              <Play className="h-4 w-4 fill-current" />
              Apply to Dock
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {profile.apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/20">
            <div className="mb-4 rounded-full bg-gray-100 p-3 dark:bg-slate-800">
              <Download className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">No apps in this profile yet</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Click "Save apps from Dock" to import your current Dock, or add apps manually below.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={profile.apps.map((app) => app.path)}
                strategy={verticalListSortingStrategy}
              >
                {profile.apps.map((app, index) => (
                  <SortableAppItem
                    key={app.path} // Assuming path is unique enough for UI key
                    id={app.path}
                    app={app}
                    onRemove={() => onRemoveApp(profile.id, index)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        <button
          onClick={() => onAddApp(profile.id)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-transparent px-4 py-3 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:border-slate-700 dark:text-gray-400 dark:hover:border-slate-600 dark:hover:text-gray-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add App
        </button>
      </div>
    </div>
  );
};

export default ProfileDetail;
