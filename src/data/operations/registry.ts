import { EditorOperation, OperationGroup, OperationValues, getDefaultValues } from "@/domain/entities/EditorOperation";
import { adjustmentsGroup } from "./adjustments";
import { effectsGroup } from "./effects";
import { transformsGroup } from "./transforms";

export const operationGroups: OperationGroup[] = [
  adjustmentsGroup,
  effectsGroup,
  transformsGroup,
];

export const allOperations: EditorOperation[] = operationGroups.flatMap(
  (g) => g.operations,
);

export const defaultValues: OperationValues = getDefaultValues(allOperations);
