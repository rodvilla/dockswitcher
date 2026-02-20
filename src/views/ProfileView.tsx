import React, { useState } from 'react';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus, Download, Play, Globe, Trash2 } from 'lucide-react';
import type { Profile, AppEntry, DefaultApp } from '../types/profile';
import SortableAppItem from '../components/SortableAppItem';

const DEFAULT_APP_ROLES: { value: string; label: string }[] = [
  { value: "browser", label: "Browser (HTTP/HTTPS)" },
  { value: "email", label: "Email (mailto)" },
  { value: "ftp", label: "FTP" },
  { value: "calendar", label: "Calendar (webcal)" },
];

interface ProfileViewProps {
  profile: Profile | null;
  activeProfileId: string | null;
  onApplyProfile: (id: string) => void;
  onSaveDock: (id: string) => void;
  onAddApp: (id: string) => void;
  onRemoveApp: (id: string, index: number) => void;
  onUpdateProfile: (profile: Profile) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
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

  const [showAddDefault, setShowAddDefault] = useState(false);
  const [newDefaultBundleId, setNewDefaultBundleId] = useState("");
  const [newDefaultRole, setNewDefaultRole] = useState(DEFAULT_APP_ROLES[0].value);

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

  const appsWithBundleId = profile.apps.filter((app: AppEntry) => app.bundle_id);

  const handleAddDefaultApp = () => {
    const isValid = newDefaultBundleId && appsWithBundleId.some((a: AppEntry) => a.bundle_id === newDefaultBundleId);
    if (!isValid) return;
    const updated: DefaultApp[] = [
      ...profile.default_apps,
      { bundle_id: newDefaultBundleId, role: newDefaultRole },
    ];
    onUpdateProfile({ ...profile, default_apps: updated });
    setShowAddDefault(false);
    setNewDefaultBundleId("");
    setNewDefaultRole(DEFAULT_APP_ROLES[0].value);
  };

  const handleRemoveDefaultApp = (index: number) => {
    const updated = profile.default_apps.filter((_: DefaultApp, i: number) => i !== index);
    onUpdateProfile({ ...profile, default_apps: updated });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = profile.apps.findIndex((app: AppEntry) => app.path === active.id);
      const newIndex = profile.apps.findIndex((app: AppEntry) => app.path === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newApps = arrayMove(profile.apps, oldIndex, newIndex);
        onUpdateProfile({ ...profile, apps: newApps });
      }
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-slate-900">
      <div data-tauri-drag-region className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-6 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {profile.apps.length === 0 ? 'No apps' : `${profile.apps.length} app${profile.apps.length === 1 ? '' : 's'}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
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
              type="button"
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
                items={profile.apps.map((app: AppEntry) => app.path)}
                strategy={verticalListSortingStrategy}
              >
                {profile.apps.map((app: AppEntry, index: number) => (
                  <SortableAppItem
                    key={app.path}
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
          type="button"
          onClick={() => onAddApp(profile.id)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-transparent px-4 py-3 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:border-slate-700 dark:text-gray-400 dark:hover:border-slate-600 dark:hover:text-gray-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add App
        </button>

        {/* Default Applications section */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Default Applications</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddDefault(true);
                setNewDefaultBundleId(appsWithBundleId[0]?.bundle_id ?? "");
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>

          <p className="mb-3 text-xs text-gray-400 dark:text-slate-500">
            Designate apps as the system default for specific roles when this profile is applied. Requires{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-slate-800">duti</code>{" "}
            (<code className="rounded bg-gray-100 px-1 dark:bg-slate-800">brew install duti</code>).
          </p>

          {profile.default_apps.length === 0 && !showAddDefault ? (
            <p className="text-xs text-gray-400 dark:text-slate-500">No default app assignments yet.</p>
          ) : (
            <div className="space-y-2">
              {profile.default_apps.map((da: DefaultApp, index: number) => {
                const appName = profile.apps.find((a: AppEntry) => a.bundle_id === da.bundle_id)?.name ?? da.bundle_id;
                const roleLabel = DEFAULT_APP_ROLES.find((r) => r.value === da.role)?.label ?? da.role;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{appName}</span>
                      <span className="truncate text-xs text-gray-400 dark:text-slate-500">{roleLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDefaultApp(index)}
                      className="ml-2 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {showAddDefault && (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
              {appsWithBundleId.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No apps with a known Bundle ID in this profile. Use "Save apps from Dock" or add apps via dockutil to populate bundle IDs.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="default-app-select" className="text-xs font-medium text-gray-600 dark:text-gray-400">App</label>
                    <select
                      id="default-app-select"
                      value={newDefaultBundleId}
                      onChange={(e) => setNewDefaultBundleId(e.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                      {appsWithBundleId.map((app: AppEntry) => (
                        <option key={app.bundle_id} value={app.bundle_id}>
                          {app.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="default-role-select" className="text-xs font-medium text-gray-600 dark:text-gray-400">Role</label>
                    <select
                      id="default-role-select"
                      value={newDefaultRole}
                      onChange={(e) => setNewDefaultRole(e.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                      {DEFAULT_APP_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddDefaultApp}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowAddDefault(false)}
                className="self-start rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
