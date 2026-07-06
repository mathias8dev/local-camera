import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import type { CameraFilter, FilterKey } from "@/data/operations/cameraFilters";
import { FILTER_PARAM_META } from "@/data/operations/cameraFilters";
import type { FaceEffect, DistortionEffect } from "@/domain/entities/FaceEffect";

export type EffectsTab = "filters" | "face";
export type TrayState = "collapsed" | "peek" | "expanded";

interface EffectsTrayProps {
  trayState: TrayState;
  setTrayState: (state: TrayState) => void;
  activeTab: EffectsTab;
  setActiveTab: (tab: EffectsTab) => void;
  cameraFilters: CameraFilter[];
  activeFilter: CameraFilter;
  filterIntensity: number;
  filterValues: Partial<Record<FilterKey, number>>;
  selectFilter: (f: CameraFilter) => void;
  setFilterIntensity: (v: number) => void;
  setFilterParam: (key: FilterKey, value: number) => void;
  faceEffects: FaceEffect[];
  activeFaceEffect: FaceEffect;
  selectFaceEffect: (f: FaceEffect) => void;
  faceEffectParams: Record<string, number>;
  setFaceEffectParam: (key: string, value: number) => void;
}

const haptic = (ms = 10) => navigator.vibrate?.(ms);

export function EffectsTray({
  trayState,
  setTrayState,
  activeTab,
  setActiveTab,
  cameraFilters,
  activeFilter,
  filterIntensity,
  filterValues,
  selectFilter,
  setFilterIntensity,
  setFilterParam,
  faceEffects,
  activeFaceEffect,
  selectFaceEffect,
  faceEffectParams,
  setFaceEffectParam,
}: EffectsTrayProps) {
  const hasFaceEffect = activeFaceEffect.id !== "none";
  const hasFilter = activeFilter.id !== "none";

  const showTuneButton =
    (activeTab === "filters" && hasFilter) ||
    (activeTab === "face" && hasFaceEffect && activeFaceEffect.type === "distortion");

  const handleTune = () => {
    setTrayState(trayState === "expanded" ? "peek" : "expanded");
  };

  const handleTabChange = (tab: EffectsTab) => {
    setActiveTab(tab);
    if (trayState === "collapsed") {
      setTrayState("peek");
    } else if (trayState === "expanded") {
      setTrayState("peek");
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.velocity.y > 200 || info.offset.y > 40) {
      if (trayState === "expanded") setTrayState("peek");
      else setTrayState("collapsed");
    } else if (info.velocity.y < -200 || info.offset.y < -40) {
      if (trayState === "collapsed") setTrayState("peek");
      else if (showTuneButton) setTrayState("expanded");
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      className="mb-2 rounded-2xl bg-black/80 backdrop-blur-xl"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="h-1 w-10 rounded-full bg-white/30" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-center gap-1 px-4 pb-2">
        <button
          onClick={() => handleTabChange("filters")}
          className={`relative flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "filters" ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          Filtres
          {hasFilter && activeTab !== "filters" && (
            <span className="absolute top-1.5 right-3 h-2 w-2 rounded-full bg-white" />
          )}
        </button>
        <button
          onClick={() => handleTabChange("face")}
          className={`relative flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "face" ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          Visage
          {hasFaceEffect && activeTab !== "face" && (
            <span className="absolute top-1.5 right-3 h-2 w-2 rounded-full bg-purple-400" />
          )}
        </button>
      </div>

      {/* Effect pills + tune button */}
      <AnimatePresence mode="wait">
        {trayState !== "collapsed" && (
          <motion.div
            key="pills"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pb-2">
              <div className="-ml-2 flex flex-1 gap-2 overflow-x-auto pl-4 pr-2 scrollbar-none">
                {activeTab === "filters" &&
                  cameraFilters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        selectFilter(f);
                        haptic();
                      }}
                      className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-medium backdrop-blur-sm transition-colors ${
                        activeFilter.id === f.id
                          ? "bg-white text-black"
                          : "bg-white/15 text-white/80 active:bg-white/25"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                {activeTab === "face" &&
                  faceEffects.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        selectFaceEffect(f);
                        haptic();
                      }}
                      className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-medium backdrop-blur-sm transition-colors ${
                        activeFaceEffect.id === f.id
                          ? "bg-purple-500 text-white"
                          : "bg-white/15 text-white/80 active:bg-white/25"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
              </div>
              {showTuneButton && (
                <button
                  onClick={handleTune}
                  aria-label="Réglages"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
                    trayState === "expanded"
                      ? activeTab === "face"
                        ? "bg-purple-500 text-white"
                        : "bg-white text-black"
                      : "bg-white/20 text-white"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parameter sliders */}
      <AnimatePresence>
        {trayState === "expanded" && (
          <motion.div
            key="sliders"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden overscroll-contain"
          >
            <div className="space-y-2 px-4 pb-3">
              {activeTab === "filters" && hasFilter && (
                <>
                  <SliderRow
                    label="Intensité"
                    min={0}
                    max={100}
                    step={1}
                    value={filterIntensity}
                    onChange={setFilterIntensity}
                    format={(v) => `${v}%`}
                  />
                  {(Object.keys(activeFilter.values) as FilterKey[]).map((key) => {
                    const meta = FILTER_PARAM_META[key];
                    const value = filterValues[key] ?? 0;
                    return (
                      <SliderRow
                        key={key}
                        label={meta.label}
                        min={meta.min}
                        max={meta.max}
                        step={meta.step}
                        value={value}
                        onChange={(v) => setFilterParam(key, v)}
                        format={(v) => v.toFixed(1)}
                      />
                    );
                  })}
                </>
              )}
              {activeTab === "face" &&
                hasFaceEffect &&
                activeFaceEffect.type === "distortion" &&
                (activeFaceEffect as DistortionEffect).params.map((p) => (
                  <SliderRow
                    key={p.key}
                    label={p.label}
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={faceEffectParams[p.key] ?? p.defaultValue}
                    onChange={(v) => setFaceEffectParam(p.key, v)}
                    format={(v) => v.toFixed(1)}
                  />
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-right text-[11px] text-white/60">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 appearance-none rounded-full bg-white/20 accent-white [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />
      <span className="w-10 text-[11px] text-white/60 tabular-nums">{format(value)}</span>
    </div>
  );
}
