"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { useEditor } from "@/presentation/hooks/useEditor";
import { operationGroups } from "@/data/operations/registry";
import { OperationTabs } from "./OperationTabs";
import { OperationPanel } from "./OperationPanel";
import { Dialog } from "@/presentation/components/ui/Dialog";
import { Input } from "@/presentation/components/ui/Input";

export function EditorView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const photoId = searchParams.get("photoId");

  const { canvasRef, values, loading, error, updateParam, resetAll, save } =
    useEditor(photoId);

  const [activeGroupId, setActiveGroupId] = useState(operationGroups[0].id);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const activeGroup = operationGroups.find((g) => g.id === activeGroupId)!;

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await save(name.trim());
    setSaving(false);
    router.push("/gallery");
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black text-white">
        <p className="text-lg">{error}</p>
        <button
          onClick={() => router.push("/gallery")}
          className="rounded-full border-2 border-white px-6 py-3 text-base font-medium transition-colors hover:bg-white/10"
        >
          Retour à la caméra
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-black lg:flex-row">
      {/* Canvas area */}
      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-1">
        {/* Header */}
        <div className="flex items-center px-3 py-2 lg:px-4 lg:py-3">
          <button
            onClick={() => router.push("/gallery")}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900/80 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-zinc-800 active:bg-zinc-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-3">
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      </div>

      {/* Controls panel */}
      <div className="flex max-h-[40dvh] flex-col border-t border-zinc-800 bg-zinc-950 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
        <OperationTabs
          groups={operationGroups}
          activeGroupId={activeGroupId}
          onSelect={setActiveGroupId}
        />
        <OperationPanel
          group={activeGroup}
          values={values}
          onParamChange={updateParam}
          onResetAll={resetAll}
        />
        <div className="border-t border-zinc-800 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 active:bg-zinc-300"
          >
            <Download className="h-4 w-4" />
            Sauvegarder
          </button>
        </div>
      </div>

      <Dialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        title="Nom de la photo"
      >
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim() && !saving) handleSave();
          }}
          placeholder="Ex : Coucher de soleil"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowSaveDialog(false)}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-40"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
