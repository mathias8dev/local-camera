"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { WebGLPostProcessor, FaceDistortionData } from "@/data/services/webgl/WebGLPostProcessor";
import { FaceDetectionService } from "@/data/services/face/FaceDetectionService";
import { FaceEffectRenderer } from "@/data/services/face/FaceEffectRenderer";
import type { FaceEffect, FaceLandmarks, DistortionEffect } from "@/domain/entities/FaceEffect";
import { LANDMARK } from "@/domain/entities/FaceEffect";
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
        processorRef.setFaceDistortion(null);
      }
      serviceRef.current?.dispose();
      rendererRef.current?.dispose();
    };
  }, [postProcessorRef]);

  const buildDistortionData = useCallback(
    (face: FaceLandmarks, effect: DistortionEffect, params: Record<string, number>): FaceDistortionData => {
      const fn = effect.distortionFn;
      if (fn === "slimFace") {
        return {
          slimAmount: params.amount ?? 0.5,
          slimLeftCheek: [face.landmarks[LANDMARK.LEFT_CHEEK].x, face.landmarks[LANDMARK.LEFT_CHEEK].y],
          slimRightCheek: [face.landmarks[LANDMARK.RIGHT_CHEEK].x, face.landmarks[LANDMARK.RIGHT_CHEEK].y],
          faceCenter: [face.landmarks[LANDMARK.NOSE_BRIDGE].x, face.landmarks[LANDMARK.NOSE_BRIDGE].y],
          faceWidth: face.faceWidth,
          bigEyesScale: 1.0,
          bigEyesLeft: [0, 0],
          bigEyesRight: [0, 0],
          bigEyesRadius: 0,
        };
      }
      const lx = (face.landmarks[LANDMARK.LEFT_EYE_INNER].x + face.landmarks[LANDMARK.LEFT_EYE_OUTER].x) / 2;
      const ly = (face.landmarks[LANDMARK.LEFT_EYE_TOP].y + face.landmarks[LANDMARK.LEFT_EYE_BOTTOM].y) / 2;
      const rx = (face.landmarks[LANDMARK.RIGHT_EYE_INNER].x + face.landmarks[LANDMARK.RIGHT_EYE_OUTER].x) / 2;
      const ry = (face.landmarks[LANDMARK.RIGHT_EYE_TOP].y + face.landmarks[LANDMARK.RIGHT_EYE_BOTTOM].y) / 2;
      const eyeW = Math.abs(face.landmarks[LANDMARK.LEFT_EYE_OUTER].x - face.landmarks[LANDMARK.LEFT_EYE_INNER].x);
      return {
        slimAmount: 0,
        slimLeftCheek: [0, 0],
        slimRightCheek: [0, 0],
        faceCenter: [0, 0],
        faceWidth: 0,
        bigEyesScale: params.scale ?? 1.8,
        bigEyesLeft: [lx, ly],
        bigEyesRight: [rx, ry],
        bigEyesRadius: eyeW * 1.2,
      };
    },
    [],
  );

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

    const face = lastLandmarksRef.current;

    if (effect.type === "distortion") {
      if (face && postProcessorRef.current) {
        postProcessorRef.current.setFaceDistortion(
          buildDistortionData(face, effect as DistortionEffect, paramsRef.current),
        );
      } else {
        postProcessorRef.current?.setFaceDistortion(null);
      }
      const overlayCtx = overlay.getContext("2d");
      if (overlayCtx) overlayCtx.clearRect(0, 0, w, h);
    } else {
      const overlayCtx = overlay.getContext("2d");
      if (!overlayCtx) return;
      overlayCtx.clearRect(0, 0, w, h);
      if (face && rendererRef.current) {
        rendererRef.current.render(overlayCtx, face, effect, w, h, video, paramsRef.current);
      }
    }

    const compositeCtx = composite.getContext("2d");
    if (!compositeCtx) return;
    compositeCtx.drawImage(webgl, 0, 0);
    if (effect.type === "overlay") {
      compositeCtx.drawImage(overlay, 0, 0);
    }
  }, [videoRef, webglCanvasRef, postProcessorRef, buildDistortionData]);

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
        postProcessorRef.current?.setFaceDistortion(null);
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

      if (effect.type === "overlay") {
        postProcessorRef.current?.setFaceDistortion(null);
        if (rendererRef.current) {
          await rendererRef.current.preloadAssets(effect);
        }
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
    [isModelLoaded, registerCallback, unregisterCallback, postProcessorRef],
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
