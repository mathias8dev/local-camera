import { Eclipse, CircleDot, Palette, SwatchBook } from "lucide-react";
import { EditorOperation, OperationGroup } from "@/domain/entities/EditorOperation";
import { Sparkles } from "lucide-react";

const grayscale: EditorOperation = {
  id: "grayscale",
  label: "Niveaux de gris",
  icon: Eclipse,
  params: [{ key: "value", label: "Niveaux de gris", type: "range", min: 0, max: 100, step: 1, defaultValue: 0 }],
  render: (v) => ({ filter: `grayscale(${v.value}%)` }),
};

const blur: EditorOperation = {
  id: "blur",
  label: "Flou",
  icon: CircleDot,
  params: [{ key: "value", label: "Flou", type: "range", min: 0, max: 20, step: 0.5, defaultValue: 0 }],
  render: (v) => ({ filter: `blur(${v.value}px)` }),
};

const sepia: EditorOperation = {
  id: "sepia",
  label: "Sépia",
  icon: SwatchBook,
  params: [{ key: "value", label: "Sépia", type: "range", min: 0, max: 100, step: 1, defaultValue: 0 }],
  render: (v) => ({ filter: `sepia(${v.value}%)` }),
};

const hueRotate: EditorOperation = {
  id: "hue-rotate",
  label: "Teinte",
  icon: Palette,
  params: [{ key: "value", label: "Rotation teinte", type: "range", min: 0, max: 360, step: 1, defaultValue: 0 }],
  render: (v) => ({ filter: `hue-rotate(${v.value}deg)` }),
};

export const effectsGroup: OperationGroup = {
  id: "effects",
  label: "Effets",
  icon: Sparkles,
  operations: [grayscale, blur, sepia, hueRotate],
};
