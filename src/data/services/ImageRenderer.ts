import { EditorOperation, OperationValues } from "@/domain/entities/EditorOperation";

export function renderImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  operations: EditorOperation[],
  values: OperationValues,
): void {
  const contributions = operations.map((op) =>
    op.render(values[op.id] ?? {}),
  );

  let width = image.width;
  let height = image.height;
  for (const c of contributions) {
    if (c.transform) {
      ({ width, height } = c.transform.canvasSize(width, height));
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const filterStr = contributions
    .map((c) => c.filter)
    .filter(Boolean)
    .join(" ");
  if (filterStr) ctx.filter = filterStr;

  for (const c of contributions) {
    if (c.transform) {
      c.transform.apply(ctx, image.width, image.height);
    }
  }

  ctx.drawImage(image, 0, 0);
}

export function exportCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
      "image/png",
    );
  });
}
