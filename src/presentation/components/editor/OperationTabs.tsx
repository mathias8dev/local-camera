"use client";

import { OperationGroup } from "@/domain/entities/EditorOperation";

interface OperationTabsProps {
  groups: OperationGroup[];
  activeGroupId: string;
  onSelect: (groupId: string) => void;
}

export function OperationTabs({ groups, activeGroupId, onSelect }: OperationTabsProps) {
  return (
    <div className="flex border-b border-zinc-800">
      {groups.map((group) => {
        const Icon = group.icon;
        const active = group.id === activeGroupId;
        return (
          <button
            key={group.id}
            onClick={() => onSelect(group.id)}
            className={`flex flex-1 flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition-colors ${
              active
                ? "border-b-2 border-white text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon className="h-5 w-5" />
            {group.label}
          </button>
        );
      })}
    </div>
  );
}
