import type { Metadata } from "next";
import { GalleryView } from "@/presentation/components/gallery/GalleryView";

export const metadata: Metadata = {
  title: "Galerie",
};

export default function GalleryPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <GalleryView />
    </div>
  );
}
