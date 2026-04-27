import { ComponentType } from "react";

export interface ParamDef {
  key: string;
  label: string;
  type: "range" | "toggle";
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface RenderContribution {
  filter?: string;
  transform?: {
    canvasSize: (imgW: number, imgH: number) => { width: number; height: number };
    apply: (ctx: CanvasRenderingContext2D, imgW: number, imgH: number) => void;
  };
}

export interface EditorOperation {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  params: ParamDef[];
  render(values: Record<string, number>): RenderContribution;
}

export interface OperationGroup {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  operations: EditorOperation[];
}

export type OperationValues = Record<string, Record<string, number>>;

export function getDefaultValues(operations: EditorOperation[]): OperationValues {
  const result: OperationValues = {};
  for (const op of operations) {
    result[op.id] = {};
    for (const param of op.params) {
      result[op.id][param.key] = param.defaultValue;
    }
  }
  return result;
}

export function isDefault(op: EditorOperation, values: Record<string, number>): boolean {
  return op.params.every((p) => values[p.key] === p.defaultValue);
}
