import React, { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Profile } from '../../types/profile';

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
        className="mx-2 mb-2 rounded-md bg-white p-2 ring-2 ring-blue-600 dark:bg-slate-700"
      >
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onRenameSubmit(renameValue)}
          className="w-full bg-transparent px-3 py-2 text-lg outline-none dark:text-white"
        />
      </div>
    );
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      type="button"
      onClick={onSelect}
      onContextMenu={(e) => onContextMenu(e, profile.id)}
      className={`group relative mx-2 mb-2 flex w-full cursor-default select-none items-center rounded-md px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-700'
      }`}
    >
      <div className="absolute left-2 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <div {...listeners} className="cursor-grab p-1 active:cursor-grabbing">
          <GripVertical className={`h-5 w-5 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`} />
        </div>
      </div>
      
      <div className="flex w-full items-center pl-8">
        {isActive && (
          <span className={`mr-3 h-3 w-3 rounded-full ${isSelected ? 'bg-green-300' : 'bg-green-500'}`} />
        )}
        <span className="truncate text-lg font-medium">{profile.name}</span>
      </div>
    </button>
  );
};

export default SortableProfileItem;
