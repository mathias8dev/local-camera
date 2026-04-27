import { RotateCw, FlipHorizontal2, FlipVertical2, Move } from "lucide-react";
import { EditorOperation, OperationGroup } from "@/domain/entities/EditorOperation";

const rotation: EditorOperation = {
  id: "rotation",
  label: "Rotation",
  icon: RotateCw,
  params: [{ key: "angle", label: "Angle", type: "range", min: 0, max: 270, step: 90, defaultValue: 0 }],
  render(v) {
    const deg = v.angle % 360;
    if (deg === 0) return {};
    const swapped = deg === 90 || deg === 270;
    return {
      transform: {
        canvasSize: (w, h) => ({
          width: swapped ? h : w,
          height: swapped ? w : h,
        }),
        apply(ctx, imgW, imgH) {
          const cw = swapped ? imgH : imgW;
          const ch = swapped ? imgW : imgH;
          ctx.translate(cw / 2, ch / 2);
          ctx.rotate((deg * Math.PI) / 180);
          ctx.translate(-imgW / 2, -imgH / 2);
        },
      },
    };
  },
};

const flipH: EditorOperation = {
  id: "flip-h",
  label: "Miroir H",
  icon: FlipHorizontal2,
  params: [{ key: "enabled", label: "Miroir horizontal", type: "toggle", min: 0, max: 1, step: 1, defaultValue: 0 }],
  render(v) {
    if (!v.enabled) return {};
    return {
      transform: {
        canvasSize: (w, h) => ({ width: w, height: h }),
        apply(ctx, imgW) {
          ctx.translate(imgW, 0);
          ctx.scale(-1, 1);
        },
      },
    };
  },
};

const flipV: EditorOperation = {
  id: "flip-v",
  label: "Miroir V",
  icon: FlipVertical2,
  params: [{ key: "enabled", label: "Miroir vertical", type: "toggle", min: 0, max: 1, step: 1, defaultValue: 0 }],
  render(v) {
    if (!v.enabled) return {};
    return {
      transform: {
        canvasSize: (w, h) => ({ width: w, height: h }),
        apply(ctx, _imgW, imgH) {
          ctx.translate(0, imgH);
          ctx.scale(1, -1);
        },
      },
    };
  },
};

export const transformsGroup: OperationGroup = {
  id: "transforms",
  label: "Transformations",
  icon: Move,
  operations: [rotation, flipH, flipV],
};
