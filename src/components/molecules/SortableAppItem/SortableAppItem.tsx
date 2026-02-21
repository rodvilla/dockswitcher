import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { AppIcon } from "../../atoms";

interface SortableAppItemProps {
  app: { name: string; path: string; icon?: string };
  id: string;
  onRemove: () => void;
}

export function SortableAppItem({ app, id, onRemove }: SortableAppItemProps) {
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
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-0 active:cursor-grabbing group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      <AppIcon name={app.name} icon={app.icon} />

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-gray-900 dark:text-white">
          {app.name}
        </span>
        <span className="truncate text-xs text-gray-400 dark:text-slate-500">
          {app.path}
        </span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-2 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
        title="Remove app"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
