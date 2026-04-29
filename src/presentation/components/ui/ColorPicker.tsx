"use client";

const PRESET_COLORS = [
  "#ffffff", "#000000", "#ef4444", "#3b82f6",
  "#22c55e", "#eab308", "#f97316", "#a855f7",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  inactive?: boolean;
}

export function ColorPicker({ value, onChange, inactive }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`h-8 w-8 rounded-full border-2 transition-transform active:scale-90 ${
            value === c && !inactive
              ? "border-white scale-110"
              : "border-zinc-600"
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <label
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-bold text-white ${
          !PRESET_COLORS.includes(value) && !inactive
            ? "border-white"
            : "border-zinc-600"
        }`}
        style={{
          background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </label>
    </div>
  );
}
