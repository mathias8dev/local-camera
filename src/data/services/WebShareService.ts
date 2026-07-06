import mime from "mime";

export function canShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.share &&
    !!navigator.canShare
  );
}

export function normalizeMimeType(type: string): string {
  return type.split(";")[0].trim().toLowerCase();
}

export function extForType(type: string): string {
  return mime.getExtension(type) ?? "bin";
}

export function typeForName(name: string): string | null {
  return mime.getType(name);
}

export async function shareFile(
  blob: Blob,
  name: string,
  mimeType = blob.type,
): Promise<boolean> {
  const fileType = normalizeMimeType(mimeType || blob.type);
  const ext = extForType(fileType);
  const file = new File([blob], `${name}.${ext}`, { type: fileType });
  if (canShare() && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title: name, files: [file] });
      return true;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return false;
    }
  }
  downloadBlob(blob, name, fileType);
  return false;
}

export function downloadBlob(blob: Blob, name: string, mimeType = blob.type): void {
  const ext = extForType(mimeType || blob.type);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.${ext}`;
  link.click();
  URL.revokeObjectURL(url);
}
