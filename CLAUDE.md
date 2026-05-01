# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — Type-check without emitting

No test framework is configured.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion  
All data is local — IndexedDB only, no server/API. PWA with service worker (`public/sw.js`).

## Architecture

Clean Architecture with three layers:

**`src/domain/`** — Entities and repository interfaces. No framework imports.
- `MediaItem` is a discriminated union: `PhotoMedia | VideoMedia` (discriminant: `type`)
- `EditorOperation` defines composable image operations via `RenderContribution` (CSS filter string or canvas 2D transform)
- `Overlay` types (`Stroke`, `TextItem`) use normalized 0–1 coordinates

**`src/data/`** — Implementations and services.
- `storage/IndexedDBProvider.ts` — DB "local-camera" v2, stores: `files`, `photos`, `thumbnails`. All access via `withTransaction()`.
- `repositories/IndexedDBMediaRepository.ts` — CRUD for media metadata + blobs. Auto-generates thumbnails on save (photo via `createImageBitmap`, video via frame extraction). `toMediaItem()` defaults `type:"photo"` and `mimeType:"image/jpeg"` for backward compat with pre-video records.
- `services/CameraService.ts` — MediaStream lifecycle, `ImageCapture` high-res capture with fallback to canvas, resolution detection
- `services/webgl/WebGLPostProcessor.ts` — Real-time WebGL 1.0 preview (sharpen, contrast, exposure, tone mapping). Handles context loss/restore.
- `operations/` — Composable filter/transform operations with presets. `registry.ts` exports `allOperations` and `defaultValues`.
- `instances.ts` — Global singletons (`fileStorage`, `mediaRepository`)

**`src/presentation/`** — React components and hooks.
- `hooks/useCamera.ts` — Camera stream, capture flow, auto-save to gallery, features (grid, torch, timer, zoom). Exposes `stream` for video recording.
- `hooks/useEditor.ts` — Undo/redo stacks (full `OperationValues` snapshots), crop pipeline (computeCrop → reloadSource → applyCrop), draw/text overlays, composite save. Tracks intermediate crop files via `intermediateFileIdRef` for cleanup.
- `hooks/useVideoRecorder.ts` — `MediaRecorder` with codec negotiation, audio permission handling, auto-stop on visibility change, 10-min max duration.
- `hooks/useGallery.ts` — Gallery list, thumbnail URL lifecycle, import (photo via `createImageBitmap`, video via `<video>` metadata extraction).

## Key patterns

- **Ref synchronization**: `useEditor` keeps `valuesRef`, `drawStrokesRef`, `textItemsRef` in sync with state to avoid stale closures in callbacks.
- **`mountedRef` guard**: Async operations check `mountedRef.current` before state updates.
- **Resource cleanup**: Object URLs revoked in effects/callbacks. `intermediateFileIdRef` tracks temporary IndexedDB entries for deletion on unmount or save.
- **Operation composition**: Each operation's `render()` returns `{ filter?, transform? }`. `ImageRenderer.renderImage()` concatenates CSS filters and applies canvas transforms in sequence.

## Service worker

`public/sw.js` — Cache name `local-camera-v2`.
- Cache-first for `/_next/static/` (immutable hashed assets)
- Stale-while-revalidate for everything else
- RSC requests skipped via `rsc` header and `_rsc` query param (App Router pattern — not `/_next/data/`)

## Language

The UI is in French (button labels, error messages, date formatting with `fr-FR` locale).
