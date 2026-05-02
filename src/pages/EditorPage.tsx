import { EditorView } from "@/presentation/components/editor/EditorView";

export function EditorPage() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <EditorView />
    </div>
  );
}
