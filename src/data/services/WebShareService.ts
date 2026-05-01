export function canShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.share &&
    !!navigator.canShare
  );
}

export function extForType(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "video/webm") return "webm";
  if (type === "video/mp4") return "mp4";
  return "jpg";
}

export async function shareFile(
  blob: Blob,
  name: string,
): Promise<boolean> {
  const ext = extForType(blob.type);
  const file = new File([blob], `${name}.${ext}`, { type: blob.type });
  if (canShare() && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title: name, files: [file] });
      return true;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return false;
    }
  }
  downloadBlob(blob, name);
  return false;
}

export function downloadBlob(blob: Blob, name: string): void {
  const ext = extForType(blob.type);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.${ext}`;
  link.click();
  URL.revokeObjectURL(url);
}
