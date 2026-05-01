import type { Metadata } from "next";
import { ScreenRecordView } from "@/presentation/components/screen-record/ScreenRecordView";

export const metadata: Metadata = {
  title: "Enregistrement d'écran",
};

export default function ScreenRecordPage() {
  return <ScreenRecordView />;
}
