"use client";

import { OperationGroup, OperationValues, isDefault } from "@/domain/entities/EditorOperation";
import { ParamControl } from "./ParamControl";
import { RotateCcw } from "lucide-react";

interface OperationPanelProps {
  group: OperationGroup;
  values: OperationValues;
  onParamChange: (operationId: string, paramKey: string, value: number) => void;
  onResetAll: () => void;
}

export function OperationPanel({
  group,
  values,
  onParamChange,
  onResetAll,
}: OperationPanelProps) {
  const hasChanges = group.operations.some(
    (op) => !isDefault(op, values[op.id] ?? {}),
  );

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
      {group.operations.map((op) => {
        const opValues = values[op.id] ?? {};
        const toggleParams = op.params.filter((p) => p.type === "toggle");
        const rangeParams = op.params.filter((p) => p.type === "range");

        return (
          <div key={op.id} className="flex flex-col gap-3">
            {rangeParams.map((param) => (
              <ParamControl
                key={param.key}
                param={param}
                value={opValues[param.key] ?? param.defaultValue}
                onChange={(v) => onParamChange(op.id, param.key, v)}
              />
            ))}
            {toggleParams.length > 0 && (
              <div className="flex gap-2">
                {toggleParams.map((param) => (
                  <ParamControl
                    key={param.key}
                    param={param}
                    value={opValues[param.key] ?? param.defaultValue}
                    onChange={(v) => onParamChange(op.id, param.key, v)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {hasChanges && (
        <button
          onClick={onResetAll}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser tout
        </button>
      )}
    </div>
  );
}
