import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableAppItem } from "../../molecules/SortableAppItem";
import type { AppEntry } from "types/profile";

interface AppListProps {
  apps: AppEntry[];
  onReorderApps: (apps: AppEntry[]) => void;
  onRemoveApp: (index: number) => void;
  onAddApp: () => void;
}

function AppList({
  apps,
  onReorderApps,
  onRemoveApp,
  onAddApp,
}: AppListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = apps.findIndex((app) => app.path === active.id);
      const newIndex = apps.findIndex((app) => app.path === over.id);
      onReorderApps(arrayMove(apps, oldIndex, newIndex));
    }
  };

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-500">
        <p className="text-sm">No apps in this profile</p>
        <p className="mt-1 text-xs">
          Click "Save apps from Dock" to capture your current Dock
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={apps.map((app) => app.path)}
          strategy={verticalListSortingStrategy}
        >
          {apps.map((app, index) => (
            <SortableAppItem
              key={app.path}
              id={app.path}
              app={app}
              onRemove={() => onRemoveApp(index)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={onAddApp}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:text-blue-400"
      >
        <Plus className="h-4 w-4" />
        Add App
      </button>
    </div>
  );
}

export { AppList };
export type { AppListProps };
