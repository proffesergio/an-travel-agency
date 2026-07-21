'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

export default function RepeatableList<T>({
  items,
  renderItem,
  onAdd,
  onRemove,
  onMove,
  addLabel,
  emptyLabel,
  canAdd = true,
  getKey,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  addLabel: string;
  emptyLabel: string;
  canAdd?: boolean;
  /**
   * Stable identity per row. Rows whose content holds local state — e.g. a
   * nested LocalizedField remembers which locale tab is open — must supply
   * this. Without it React reconciles by position, so deleting or moving a
   * row leaves that state attached to the slot instead of the item, and the
   * wrong tab appears selected for the row's data.
   */
  getKey?: (item: T, index: number) => string;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-gray-500 italic py-3">{emptyLabel}</p>
      )}

      {items.map((item, index) => (
        <div
          key={getKey ? getKey(item, index) : index}
          className="rounded-lg border border-gray-200 p-4 bg-gray-50/60"
        >
          <div className="flex justify-end gap-1 mb-2">
            <button
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              aria-label="Move up"
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={index === items.length - 1}
              aria-label="Move down"
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label="Remove"
              className="p-1.5 rounded-md text-red-500 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {renderItem(item, index)}
        </div>
      ))}

      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2d6a4f] hover:text-[#1b4332]"
        >
          <Plus className="w-4 h-4" /> {addLabel}
        </button>
      )}
    </div>
  );
}
