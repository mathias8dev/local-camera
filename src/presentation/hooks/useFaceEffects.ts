"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { WebGLPostProcessor } from "@/data/services/webgl/WebGLPostProcessor";
import { FaceDetectionService } from "@/data/services/face/FaceDetectionService";
import { FaceEffectRenderer } from "@/data/services/face/FaceEffectRenderer";
import type { FaceEffect, FaceLandmarks, DistortionEffect } from "@/domain/entities/FaceEffect";
import { faceEffects } from "@/data/operations/faceEffects";

const DETECTION_INTERVAL_MS = 33;

export function useFaceEffects(
  videoRef: RefObject<HTMLVideoElement | null>,
  webglCanvasRef: RefObject<HTMLCanvasElement | null>,
  postProcessorRef: RefObject<WebGLPostProcessor | null>,
) {
  const [activeFaceEffect, setActiveFaceEffect] = useState<FaceEffect>(faceEffects[0]);
  const [faceEffectParams, setFaceEffectParams] = useState<Record<string, number>>({});
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<FaceDetectionService | null>(null);
  const rendererRef = useRef<FaceEffectRenderer | null>(null);
  const lastLandmarksRef = useRef<FaceLandmarks | null>(null);
  const lastDetectionTimeRef = useRef(0);
  const activeEffectRef = useRef<FaceEffect>(faceEffects[0]);
  const paramsRef = useRef<Record<string, number>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    serviceRef.current = new FaceDetectionService();
    rendererRef.current = new FaceEffectRenderer();
    const processorRef = postProcessorRef.current;
    return () => {
      mountedRef.current = false;
      if (processorRef) {
        processorRef.onFrameDrawn = null;
      }
      serviceRef.current?.dispose();
      rendererRef.current?.dispose();
    };
  }, [postProcessorRef]);

  const onFrameDrawn = useCallback(() => {
    const effect = activeEffectRef.current;
    if (effect.id === "none") return;

    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    const composite = compositeCanvasRef.current;
    const webgl = webglCanvasRef.current;
    if (!video || !overlay || !composite || !webgl) return;

    const w = webgl.width;
    const h = webgl.height;
    if (w === 0 || h === 0) return;

    if (overlay.width !== w || overlay.height !== h) {
      overlay.width = w;
      overlay.height = h;
    }
    if (composite.width !== w || composite.height !== h) {
      composite.width = w;
      composite.height = h;
    }

    const now = performance.now();
    if (now - lastDetectionTimeRef.current >= DETECTION_INTERVAL_MS) {
      lastDetectionTimeRef.current = now;
      lastLandmarksRef.current =
        serviceRef.current?.detect(video, now) ?? null;
    }

    const overlayCtx = overlay.getContext("2d");
    if (!overlayCtx) return;

    overlayCtx.clearRect(0, 0, w, h);
    if (lastLandmarksRef.current && rendererRef.current) {
      rendererRef.current.render(
        overlayCtx,
        lastLandmarksRef.current,
        effect,
        w,
        h,
        video,
        paramsRef.current,
      );
    }

    const compositeCtx = composite.getContext("2d");
    if (!compositeCtx) return;
    compositeCtx.drawImage(webgl, 0, 0);
    compositeCtx.drawImage(overlay, 0, 0);
  }, [videoRef, webglCanvasRef]);

  const registerCallback = useCallback(() => {
    if (postProcessorRef.current) {
      postProcessorRef.current.onFrameDrawn = onFrameDrawn;
    }
  }, [postProcessorRef, onFrameDrawn]);

  const unregisterCallback = useCallback(() => {
    if (postProcessorRef.current) {
      postProcessorRef.current.onFrameDrawn = null;
    }
  }, [postProcessorRef]);

  const selectFaceEffect = useCallback(
    async (effect: FaceEffect) => {
      activeEffectRef.current = effect;
      setActiveFaceEffect(effect);

      if (effect.id === "none") {
        lastLandmarksRef.current = null;
        const overlay = overlayCanvasRef.current;
        if (overlay) {
          const ctx = overlay.getContext("2d");
          ctx?.clearRect(0, 0, overlay.width, overlay.height);
        }
        unregisterCallback();
        setFaceEffectParams({});
        paramsRef.current = {};
        return;
      }

      if (!isModelLoaded && serviceRef.current) {
        setIsModelLoading(true);
        try {
          await serviceRef.current.initialize();
          if (mountedRef.current) {
            setIsModelLoaded(true);
            setIsModelLoading(false);
          }
        } catch {
          if (mountedRef.current) setIsModelLoading(false);
          return;
        }
      }

      if (effect.type === "overlay" && rendererRef.current) {
        await rendererRef.current.preloadAssets(effect);
      }

      if (effect.type === "distortion") {
        const defaults: Record<string, number> = {};
        for (const p of (effect as DistortionEffect).params) {
          defaults[p.key] = p.defaultValue;
        }
        setFaceEffectParams(defaults);
        paramsRef.current = defaults;
      } else {
        setFaceEffectParams({});
        paramsRef.current = {};
      }

      registerCallback();
    },
    [isModelLoaded, registerCallback, unregisterCallback],
  );

  const setFaceEffectParam = useCallback((key: string, value: number) => {
    setFaceEffectParams((prev) => {
      const next = { ...prev, [key]: value };
      paramsRef.current = next;
      return next;
    });
  }, []);

  return {
    overlayCanvasRef,
    compositeCanvasRef,
    activeFaceEffect,
    faceEffects,
    selectFaceEffect,
    faceEffectParams,
    setFaceEffectParam,
    isModelLoading,
  };
}
