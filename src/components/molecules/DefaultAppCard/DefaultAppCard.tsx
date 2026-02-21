import { Trash2 } from "lucide-react";

interface DefaultAppCardProps {
  appName: string;
  roleLabel: string;
  onRemove: () => void;
}

function DefaultAppCard({ appName, roleLabel, onRemove }: DefaultAppCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {appName}
        </span>
        <span className="truncate text-xs text-gray-400 dark:text-slate-500">
          {roleLabel}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-2 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
        title="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export { DefaultAppCard };
export type { DefaultAppCardProps };
