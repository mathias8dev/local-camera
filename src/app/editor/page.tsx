import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorView } from "@/presentation/components/editor/EditorView";

export const metadata: Metadata = {
  title: "Editeur",
};

export default function EditorPage() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <Suspense>
        <EditorView />
      </Suspense>
    </div>
  );
}
