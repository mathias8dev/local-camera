import { Suspense } from "react";
import { EditorView } from "@/presentation/components/editor/EditorView";

export default function EditorPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense>
        <EditorView />
      </Suspense>
    </div>
  );
}
