"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Monitor,
  ImageOff,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  X,
  Trash2,
  Share2,
  Download,
  ImagePlus,
  HardDrive,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useGallery } from "@/presentation/hooks/useGallery";
import { downloadBlob, canShare, extForType } from "@/data/services/WebShareService";
import { GalleryCard } from "./GalleryCard";
import { ConfirmDialog } from "@/presentation/components/ui/ConfirmDialog";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { MediaItem } from "@/domain/entities/MediaItem";

type SortKey = "newest" | "oldest" | "name-az" | "name-za";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Plus récent",
  oldest: "Plus ancien",
  "name-az": "Nom A→Z",
  "name-za": "Nom Z→A",
};

export function GalleryView() {
  const router = useRouter();
  const {
    photos,
    thumbnailUrls,
    loading,
    storageEstimate,
    deletePhoto,
    getFullBlob,
    importMedia,
  } = useGallery();

  // Multi-select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  // Search / sort
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importProgress, setImportProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  // Storage collapsible
  const [storageExpanded, setStorageExpanded] = useState(false);

  // Filtered + sorted
  const displayedPhotos = useMemo<MediaItem[]>(() => {
    let result = photos;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "name-az":
          return a.name.localeCompare(b.name);
        case "name-za":
          return b.name.localeCompare(a.name);
      }
    });
    return result;
  }, [photos, query, sortKey]);

  const openPhoto = useCallback(
    (id: string) => {
      router.push(`/gallery/${id}`);
    },
    [router],
  );

  // Select mode
  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllSelected =
    displayedPhotos.length > 0 &&
    displayedPhotos.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedPhotos.map((p) => p.id)));
    }
  };

  const handleBatchDelete = async () => {
    setConfirmBatchDelete(false);
    for (const id of selectedIds) {
      await deletePhoto(id);
    }
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBatchShare = async () => {
    const selectedPhotos = displayedPhotos.filter((p) => selectedIds.has(p.id));
    const loaded: { photo: MediaItem; blob: Blob }[] = [];
    for (const photo of selectedPhotos) {
      const blob = await getFullBlob(photo.id);
      if (blob) loaded.push({ photo, blob });
    }
    if (loaded.length === 0) return;
    const files = loaded.map(
      ({ photo, blob }) => new File([blob], `${photo.name}.${extForType(blob.type)}`, { type: blob.type }),
    );
    if (canShare() && navigator.canShare({ files })) {
      try {
        await navigator.share({ files });
        return;
      } catch {
        // fall through to individual downloads
      }
    }
    for (const { photo, blob } of loaded) {
      downloadBlob(blob, photo.name);
    }
  };

  const handleBatchDownload = async () => {
    const selectedPhotos = displayedPhotos.filter((p) => selectedIds.has(p.id));
    for (const photo of selectedPhotos) {
      const blob = await getFullBlob(photo.id);
      if (blob) downloadBlob(blob, photo.name);
    }
  };

  // Import
  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImportProgress({ done: 0, total: files.length });
    await importMedia(files, (done, total) =>
      setImportProgress({ done, total }),
    );
    setImportProgress(null);
    e.target.value = "";
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black">
        <Spinner />
      </div>
    );
  }

  const showStorageWarning =
    storageEstimate && storageEstimate.usedFraction > 0.5;

  return (
    <div className="flex h-dvh flex-col bg-black">
      {/* ── Header ── */}
      <div className="border-b border-white/5 bg-black/80 backdrop-blur-md px-[max(1rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait" initial={false}>
            {selectMode ? (
              <motion.div
                key="select-header"
                className="flex w-full items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-400 active:text-blue-300 transition-colors"
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {isAllSelected ? "Désélectionner" : "Tout sélectionner"}
                </button>
                <button
                  onClick={toggleSelectMode}
                  className="text-sm font-medium text-zinc-400 active:text-white transition-colors"
                >
                  Annuler
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="normal-header"
                className="flex w-full items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Galerie
                </h1>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleImportClick}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 active:bg-zinc-700 active:text-white"
                    title="Importer des photos"
                  >
                    <ImagePlus className="h-4.5 w-4.5" />
                  </button>
                  {photos.length > 0 && (
                    <button
                      onClick={toggleSelectMode}
                      className="flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 active:bg-zinc-700 active:text-white"
                    >
                      Sélectionner
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/screen-record")}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 active:bg-zinc-700 active:text-white"
                    title="Enregistrement d'écran"
                  >
                    <Monitor className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => router.push("/camera")}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-colors active:bg-zinc-300"
                  >
                    <Camera className="h-4.5 w-4.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search + Sort row */}
        {photos.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-xl bg-zinc-800/80 py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:bg-zinc-800 focus:ring-1 focus:ring-zinc-600"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 active:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 transition-colors active:bg-zinc-700 active:text-white"
                title="Trier"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    className="absolute right-0 top-full mt-1.5 z-20 min-w-max rounded-xl bg-zinc-800 shadow-2xl overflow-hidden border border-zinc-700/50"
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                  >
                    {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSortKey(key);
                          setShowSortMenu(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          sortKey === key
                            ? "text-white font-semibold bg-zinc-700/60"
                            : "text-zinc-300 active:bg-zinc-700/40"
                        }`}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* ── Import progress ── */}
      <AnimatePresence>
        {importProgress && (
          <motion.div
            className="mx-4 mt-3 rounded-xl bg-zinc-800/80 px-4 py-3"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm text-zinc-300">
                Import… {importProgress.done}/{importProgress.total}
              </span>
              <span className="text-xs text-zinc-500">
                {Math.round(
                  (importProgress.done / importProgress.total) * 100,
                )}
                %
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-700">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{
                  width: `${(importProgress.done / importProgress.total) * 100}%`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      {photos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900">
            <ImageOff className="h-10 w-10 text-zinc-600" />
          </div>
          <div>
            <p className="text-lg font-medium text-zinc-300">Aucune photo</p>
            <p className="mt-1 text-sm text-zinc-500">
              Prenez une photo ou importez depuis votre appareil
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleImportClick}
              className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition-colors active:bg-zinc-800"
            >
              Importer
            </button>
            <button
              onClick={() => router.push("/camera")}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors active:bg-zinc-300"
            >
              Prendre une photo
            </button>
          </div>
        </div>
      ) : displayedPhotos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Search className="h-12 w-12 text-zinc-600" />
          <p className="text-zinc-400">
            Aucun résultat pour &laquo; {query} &raquo;
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-[max(0.75rem,env(safe-area-inset-left))] pt-3 pb-4">
          {/* Photo count + sort indicator */}
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <span className="text-xs font-medium text-zinc-500">
              {displayedPhotos.length} photo
              {displayedPhotos.length > 1 ? "s" : ""}
            </span>
            <span className="text-xs text-zinc-600">
              {SORT_LABELS[sortKey]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayedPhotos.map((photo) => (
              <GalleryCard
                key={photo.id}
                photo={photo}
                thumbnailUrl={thumbnailUrls.get(photo.id)}
                selectMode={selectMode}
                selected={selectedIds.has(photo.id)}
                onSelect={() => toggleSelect(photo.id)}
                onOpen={() => openPhoto(photo.id)}
              />
            ))}
          </div>

        </div>
      )}

      {/* ── Storage indicator (fixed footer) ── */}
      {storageEstimate && photos.length > 0 && (
        <div className="border-t border-white/5 bg-black/80 backdrop-blur-md pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setStorageExpanded((v) => !v)}
            className="flex w-full items-center gap-2 px-4 py-2 text-xs text-zinc-500 transition-colors active:bg-zinc-900"
          >
            <HardDrive className="h-3.5 w-3.5 shrink-0" />
            <span>
              {storageEstimate.usedMB < 1
                ? `${(storageEstimate.usedMB * 1024).toFixed(0)} Ko`
                : `${storageEstimate.usedMB.toFixed(1)} Mo`}{" "}
              utilisés
            </span>
            {showStorageWarning && (
              <span
                className={`ml-auto text-[10px] font-medium ${
                  storageEstimate.usedFraction > 0.8
                    ? "text-red-400"
                    : "text-yellow-500"
                }`}
              >
                {Math.round(storageEstimate.usedFraction * 100)}%
              </span>
            )}
          </button>

          <AnimatePresence>
            {(storageExpanded || showStorageWarning) && (
              <motion.div
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 pb-2">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>
                      {storageEstimate.usedMB < 1
                        ? `${(storageEstimate.usedMB * 1024).toFixed(0)} Ko`
                        : `${storageEstimate.usedMB.toFixed(1)} Mo`}
                    </span>
                    <span>
                      {storageEstimate.quotaMB >= 1024
                        ? `${(storageEstimate.quotaMB / 1024).toFixed(1)} Go`
                        : `${storageEstimate.quotaMB.toFixed(0)} Mo`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        storageEstimate.usedFraction > 0.8
                          ? "bg-red-500"
                          : storageEstimate.usedFraction > 0.5
                            ? "bg-yellow-500"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(storageEstimate.usedFraction * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Batch action bar ── */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            className="border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 py-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-zinc-300">
                {selectedIds.size} sélectionné
                {selectedIds.size > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleBatchShare}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition-colors active:bg-zinc-800 active:text-white"
                  title="Partager"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={handleBatchDownload}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition-colors active:bg-zinc-800 active:text-white"
                  title="Télécharger"
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => setConfirmBatchDelete(true)}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-red-600 px-4 text-sm font-medium text-white transition-colors active:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Batch delete confirm ── */}
      <ConfirmDialog
        open={confirmBatchDelete}
        onClose={() => setConfirmBatchDelete(false)}
        onConfirm={handleBatchDelete}
        title={`Supprimer ${selectedIds.size} photo${selectedIds.size > 1 ? "s" : ""} ?`}
        confirmLabel="Supprimer tout"
      >
        Cette action est irréversible.
      </ConfirmDialog>

      {/* ── Hidden file input for import ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleImportChange}
      />

      {/* ── Sort menu backdrop ── */}
      {showSortMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </div>
  );
}
