import type { Metadata } from "next";
import { CameraView } from "@/presentation/components/camera/CameraView";

export const metadata: Metadata = {
  title: "Capture",
};

export default function CameraPage() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <CameraView />
    </div>
  );
}
