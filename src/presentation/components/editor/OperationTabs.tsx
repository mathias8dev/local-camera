"use client";

import { ComponentType } from "react";
import { OperationGroup } from "@/domain/entities/EditorOperation";

/** A tab entry — either an OperationGroup or a synthetic tab (e.g. Presets). */
export interface TabEntry {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface OperationTabsProps {
  tabs: TabEntry[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
}

/** Convert an OperationGroup array to TabEntry array. */
export function groupsToTabs(groups: OperationGroup[]): TabEntry[] {
  return groups.map((g) => ({ id: g.id, label: g.label, icon: g.icon }));
}

export function OperationTabs({ tabs, activeTabId, onSelect }: OperationTabsProps) {
  return (
    <div className="flex shrink-0 overflow-x-auto border-b border-zinc-800">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex flex-1 flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition-colors active:bg-zinc-800/50 ${
              active
                ? "border-b-2 border-white text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
