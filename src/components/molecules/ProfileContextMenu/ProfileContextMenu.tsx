interface ProfileContextMenuProps {
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
}

function ProfileContextMenu({ x, y, onRename, onDelete }: ProfileContextMenuProps) {
  return (
    <div
      className="fixed z-120 min-w-30 overflow-hidden rounded-lg bg-white p-1 text-left shadow-xl backdrop-blur-sm ring-1 ring-black/5 dark:bg-slate-800/90 dark:ring-white/10"
      style={{ top: y, left: x }}
    >
      <button
        type="button"
        onClick={onRename}
        className="flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white dark:text-gray-200"
      >
        Rename
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white dark:text-gray-200"
      >
        Delete
      </button>
    </div>
  );
}

export { ProfileContextMenu };
export type { ProfileContextMenuProps };
