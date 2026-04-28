export function canShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.share &&
    !!navigator.canShare
  );
}

export async function shareFile(
  blob: Blob,
  name: string,
): Promise<boolean> {
  const file = new File([blob], `${name}.jpg`, { type: blob.type });
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
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.jpg`;
  link.click();
  URL.revokeObjectURL(url);
}
