import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { ServiceWorkerRegistrar } from "@/presentation/components/ServiceWorkerRegistrar";
import { GalleryPage } from "@/pages/GalleryPage";
import { PhotoRoute } from "@/pages/PhotoRoute";
import { CameraPage } from "@/pages/CameraPage";
import { EditorPage } from "@/pages/EditorPage";
import { ScreenRecordPage } from "@/pages/ScreenRecordPage";

export function App() {
  return (
    <>
      <ServiceWorkerRegistrar />
      <Suspense>
        <Routes>
          <Route path="/" element={<Navigate to="/gallery" replace />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/gallery/:id" element={<PhotoRoute />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/screen-record" element={<ScreenRecordPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
