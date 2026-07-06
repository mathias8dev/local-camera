import {
  FlipHorizontal2,
  Sparkles,
  Grid3x3,
  Zap,
  Timer,
} from "lucide-react";
import type { TimerMode } from "@/presentation/hooks/useCamera";

interface TopBarProps {
  torchSupported: boolean;
  torchEnabled: boolean;
  toggleTorch: () => void;
  isMirrored: boolean;
  toggleMirror: () => void;
  enhanceEnabled: boolean;
  toggleEnhance: () => void;
  showGrid: boolean;
  toggleGrid: () => void;
  timerMode: TimerMode;
  cycleTimer: () => void;
  mode: "photo" | "video";
}

export function TopBar({
  torchSupported,
  torchEnabled,
  toggleTorch,
  isMirrored,
  toggleMirror,
  enhanceEnabled,
  toggleEnhance,
  showGrid,
  toggleGrid,
  timerMode,
  cycleTimer,
  mode,
}: TopBarProps) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div>
        {torchSupported && (
          <button
            onClick={toggleTorch}
            aria-label="Activer/désactiver la lampe torche"
            className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
              torchEnabled ? "bg-yellow-400 text-black" : "bg-black/40 text-white"
            }`}
          >
            <Zap className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggleMirror}
          aria-label="Activer/désactiver le miroir"
          className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
            isMirrored ? "bg-white text-black" : "bg-black/40 text-white"
          }`}
        >
          <FlipHorizontal2 className="h-5 w-5" />
        </button>
        <button
          onClick={toggleEnhance}
          aria-label="Activer/désactiver les améliorations"
          className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
            enhanceEnabled ? "bg-white text-black" : "bg-black/40 text-white"
          }`}
        >
          <Sparkles className="h-5 w-5" />
        </button>
        <button
          onClick={toggleGrid}
          aria-label="Activer/désactiver la grille"
          className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
            showGrid ? "bg-white text-black" : "bg-black/40 text-white"
          }`}
        >
          <Grid3x3 className="h-5 w-5" />
        </button>
        {mode === "photo" && (
          <button
            onClick={cycleTimer}
            aria-label="Minuterie de capture"
            className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors active:scale-90 ${
              timerMode !== 0 ? "bg-white text-black" : "bg-black/40 text-white"
            }`}
          >
            <span className="relative flex items-center justify-center">
              <Timer className="h-5 w-5" />
              {timerMode !== 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[9px] font-bold text-black">
                  {timerMode}
                </span>
              )}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
