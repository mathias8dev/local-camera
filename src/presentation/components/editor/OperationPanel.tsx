"use client";

import { OperationGroup, OperationValues, isDefault } from "@/domain/entities/EditorOperation";
import { ParamControl } from "./ParamControl";
import { Button } from "@/presentation/components/ui/Button";
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
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-3 lg:gap-4 lg:px-5 lg:py-4">
      {group.operations.map((op) => {
        const opValues = values[op.id] ?? {};
        const toggleParams = op.params.filter((p) => p.type === "toggle");
        const rangeParams = op.params.filter((p) => p.type === "range");

        return (
          <div key={op.id} className="flex flex-col gap-2.5 lg:gap-3">
            {rangeParams.map((param) => (
              <ParamControl
                key={param.key}
                param={param}
                value={opValues[param.key] ?? param.defaultValue}
                onChange={(v) => onParamChange(op.id, param.key, v)}
              />
            ))}
            {toggleParams.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
        <Button onClick={onResetAll} className="shrink-0">
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
