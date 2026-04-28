"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
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
} from "lucide-react";
import { useGallery } from "@/presentation/hooks/useGallery";
import { shareFile, downloadBlob, canShare } from "@/data/services/WebShareService";
import { IndexedDBFileStorage } from "@/data/storage/IndexedDBFileStorage";
import { GalleryCard } from "./GalleryCard";
import { PhotoDetailView } from "./PhotoDetailView";
import { Dialog } from "@/presentation/components/ui/Dialog";
import { Photo } from "@/domain/entities/Photo";

const fileStorage = new IndexedDBFileStorage();

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
    importPhotos,
  } = useGallery();

  // ── Photo detail view ──────────────────────────────────────────
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  // ── Multi-select ───────────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  // ── Search / sort ──────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // ── Import ─────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importProgress, setImportProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  // ── Derived: filtered + sorted photos ─────────────────────────
  const displayedPhotos = useMemo<Photo[]>(() => {
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

  // ── Detail navigation uses displayedPhotos ─────────────────────
  const openDetail = useCallback((index: number) => {
    setDetailIndex(index);
  }, []);

  const closeDetail = useCallback(() => setDetailIndex(null), []);

  // ── Handlers ───────────────────────────────────────────────────
  const handleEdit = useCallback(
    async (id: string) => {
      const blob = await getFullBlob(id);
      if (blob) {
        await fileStorage.save(`edit-${id}`, blob);
        router.push(`/editor?photoId=edit-${id}`);
      }
    },
    [getFullBlob, router],
  );

  const handleShare = useCallback(
    async (id: string, name: string) => {
      const blob = await getFullBlob(id);
      if (blob) await shareFile(blob, name);
    },
    [getFullBlob],
  );

  const handleDownload = useCallback(
    async (id: string, name: string) => {
      const blob = await getFullBlob(id);
      if (blob) downloadBlob(blob, name);
    },
    [getFullBlob],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deletePhoto(id);
    },
    [deletePhoto],
  );

  // ── Select mode helpers ────────────────────────────────────────
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
    const files: File[] = [];
    for (const photo of selectedPhotos) {
      const blob = await getFullBlob(photo.id);
      if (blob) {
        files.push(new File([blob], `${photo.name}.jpg`, { type: blob.type }));
      }
    }
    if (
      files.length > 0 &&
      canShare() &&
      navigator.canShare({ files })
    ) {
      try {
        await navigator.share({ files });
        return;
      } catch {
        // fall through to individual downloads
      }
    }
    // Fallback: download each
    for (const photo of selectedPhotos) {
      const blob = await getFullBlob(photo.id);
      if (blob) downloadBlob(blob, photo.name);
    }
  };

  const handleBatchDownload = async () => {
    const selectedPhotos = displayedPhotos.filter((p) => selectedIds.has(p.id));
    for (const photo of selectedPhotos) {
      const blob = await getFullBlob(photo.id);
      if (blob) downloadBlob(blob, photo.name);
    }
  };

  // ── Import ─────────────────────────────────────────────────────
  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setImportProgress({ done: 0, total: files.length });
    await importPhotos(files, (done, total) =>
      setImportProgress({ done, total }),
    );
    setImportProgress(null);
    // Reset input so the same files can be re-imported
    e.target.value = "";
  };

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-600 border-t-white" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      {/* ── Header ── */}
      <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 space-y-3">
        <div className="flex items-center justify-between">
          {selectMode ? (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-400 active:text-blue-300"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {isAllSelected ? "Désélectionner tout" : "Tout sélectionner"}
              </button>
              <button
                onClick={toggleSelectMode}
                className="text-sm font-medium text-zinc-400 active:text-white"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white">Galerie</h1>
              <div className="flex items-center gap-2">
                {/* Import */}
                <button
                  onClick={handleImportClick}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white transition-colors active:bg-zinc-700"
                  title="Importer des photos"
                >
                  <ImagePlus className="h-4.5 w-4.5" />
                </button>
                {/* Select */}
                {photos.length > 0 && (
                  <button
                    onClick={toggleSelectMode}
                    className="flex h-9 items-center gap-1 rounded-full bg-zinc-800 px-3 text-sm font-medium text-white transition-colors active:bg-zinc-700"
                  >
                    Sélectionner
                  </button>
                )}
                {/* Camera */}
                <button
                  onClick={() => router.push("/camera")}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-colors active:bg-zinc-300"
                >
                  <Camera className="h-4.5 w-4.5" />
                </button>
              </div>
            </>
          )}
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
                className="w-full rounded-xl bg-zinc-800 py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 active:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 transition-colors active:bg-zinc-700"
                title="Trier"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 min-w-max rounded-xl bg-zinc-800 shadow-xl overflow-hidden">
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSortKey(key);
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        sortKey === key
                          ? "text-white font-semibold bg-zinc-700"
                          : "text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Import progress ── */}
      {importProgress && (
        <div className="mx-4 mb-2 rounded-xl bg-zinc-800 px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm text-zinc-300">
              Import… {importProgress.done}/{importProgress.total}
            </span>
            <span className="text-xs text-zinc-500">
              {Math.round((importProgress.done / importProgress.total) * 100)}%
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
        </div>
      )}

      {/* ── Empty state ── */}
      {photos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <ImageOff className="h-16 w-16 text-zinc-600" />
          <p className="text-lg text-zinc-400">Aucune photo</p>
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
          <p className="text-zinc-400">Aucun résultat pour « {query} »</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* Sort label */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {displayedPhotos.length} photo
              {displayedPhotos.length > 1 ? "s" : ""}
            </span>
            <span className="text-xs text-zinc-600">{SORT_LABELS[sortKey]}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayedPhotos.map((photo, index) => (
              <GalleryCard
                key={photo.id}
                photo={photo}
                thumbnailUrl={thumbnailUrls.get(photo.id)}
                onEdit={() => handleEdit(photo.id)}
                onShare={() => handleShare(photo.id, photo.name)}
                onDownload={() => handleDownload(photo.id, photo.name)}
                onDelete={() => handleDelete(photo.id)}
                selectMode={selectMode}
                selected={selectedIds.has(photo.id)}
                onSelect={() => toggleSelect(photo.id)}
                onOpen={() => openDetail(index)}
              />
            ))}
          </div>

          {/* Storage indicator */}
          {storageEstimate && (
            <div className="mt-4 rounded-xl bg-zinc-900 px-4 py-3">
              <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
                <span>
                  {storageEstimate.usedMB < 1
                    ? `${(storageEstimate.usedMB * 1024).toFixed(0)} Ko`
                    : `${storageEstimate.usedMB.toFixed(1)} Mo`}{" "}
                  utilisés
                </span>
                <span>
                  {storageEstimate.quotaMB >= 1024
                    ? `${(storageEstimate.quotaMB / 1024).toFixed(1)} Go`
                    : `${storageEstimate.quotaMB.toFixed(0)} Mo`}{" "}
                  disponibles
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    storageEstimate.usedFraction > 0.8
                      ? "bg-red-500"
                      : storageEstimate.usedFraction > 0.5
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(storageEstimate.usedFraction * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Batch action bar ── */}
      {selectMode && selectedIds.size > 0 && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-zinc-300">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchShare}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white active:bg-zinc-700"
                title="Partager"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleBatchDownload}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white active:bg-zinc-700"
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmBatchDelete(true)}
                className="flex h-9 items-center gap-1.5 rounded-full bg-red-600 px-4 text-sm font-medium text-white active:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo detail view ── */}
      {detailIndex !== null && (
        <PhotoDetailView
          photos={displayedPhotos}
          initialIndex={detailIndex}
          thumbnailUrls={thumbnailUrls}
          getFullBlob={getFullBlob}
          onClose={closeDetail}
          onEdit={(id) => {
            closeDetail();
            handleEdit(id);
          }}
          onShare={(id, name) => handleShare(id, name)}
          onDownload={(id, name) => handleDownload(id, name)}
          onDelete={async (id) => {
            await handleDelete(id);
          }}
        />
      )}

      {/* ── Batch delete confirm ── */}
      <Dialog
        open={confirmBatchDelete}
        onClose={() => setConfirmBatchDelete(false)}
        title={`Supprimer ${selectedIds.size} photo${selectedIds.size > 1 ? "s" : ""} ?`}
      >
        <p className="text-sm text-zinc-400">
          Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirmBatchDelete(false)}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleBatchDelete}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Supprimer tout
          </button>
        </div>
      </Dialog>

      {/* ── Hidden file input for import ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
