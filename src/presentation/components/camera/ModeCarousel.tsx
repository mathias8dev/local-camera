import { motion } from "framer-motion";

type CameraMode = "photo" | "video";

interface ModeCarouselProps {
  mode: CameraMode;
  setMode: (mode: CameraMode) => void;
}

const haptic = (ms = 10) => navigator.vibrate?.(ms);

export function ModeCarousel({ mode, setMode }: ModeCarouselProps) {
  return (
    <div className="mb-4 flex items-center justify-center">
      <div className="relative flex gap-6">
        <button
          onClick={() => {
            setMode("photo");
            haptic();
          }}
          className={`relative text-[13px] font-semibold uppercase tracking-wide transition-colors ${
            mode === "photo" ? "text-yellow-400" : "text-white/50"
          }`}
        >
          Photo
          {mode === "photo" && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute -bottom-1.5 left-0 right-0 mx-auto h-0.5 rounded-full bg-yellow-400"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => {
            setMode("video");
            haptic();
          }}
          className={`relative text-[13px] font-semibold uppercase tracking-wide transition-colors ${
            mode === "video" ? "text-yellow-400" : "text-white/50"
          }`}
        >
          Vidéo
          {mode === "video" && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute -bottom-1.5 left-0 right-0 mx-auto h-0.5 rounded-full bg-yellow-400"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
