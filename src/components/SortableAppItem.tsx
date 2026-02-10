import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

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

      {app.icon ? (
        <img
          src={`data:image/png;base64,${app.icon}`}
          alt={app.name}
          className="h-10 w-10 shrink-0 rounded-lg shadow-sm"
        />
      ) : (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${bgClass}`}>
          <span className="text-lg font-bold">{initial}</span>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-gray-900 dark:text-white">{app.name}</span>
        <span className="truncate text-xs text-gray-400 dark:text-slate-500">{app.path}</span>
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
};

export default SortableAppItem;
