import { Sun, Contrast, Droplets } from "lucide-react";
import { EditorOperation, OperationGroup } from "@/domain/entities/EditorOperation";
import { Sliders } from "lucide-react";

const brightness: EditorOperation = {
  id: "brightness",
  label: "Luminosité",
  icon: Sun,
  params: [{ key: "value", label: "Luminosité", type: "range", min: 0, max: 200, step: 1, defaultValue: 100 }],
  render: (v) => ({ filter: `brightness(${v.value}%)` }),
};

const contrast: EditorOperation = {
  id: "contrast",
  label: "Contraste",
  icon: Contrast,
  params: [{ key: "value", label: "Contraste", type: "range", min: 0, max: 200, step: 1, defaultValue: 100 }],
  render: (v) => ({ filter: `contrast(${v.value}%)` }),
};

const saturate: EditorOperation = {
  id: "saturate",
  label: "Saturation",
  icon: Droplets,
  params: [{ key: "value", label: "Saturation", type: "range", min: 0, max: 200, step: 1, defaultValue: 100 }],
  render: (v) => ({ filter: `saturate(${v.value}%)` }),
};

export const adjustmentsGroup: OperationGroup = {
  id: "adjustments",
  label: "Ajustements",
  icon: Sliders,
  operations: [brightness, contrast, saturate],
};
