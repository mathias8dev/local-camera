"use client";

import { ParamDef } from "@/domain/entities/EditorOperation";

interface ParamControlProps {
  param: ParamDef;
  value: number;
  onChange: (value: number) => void;
}

export function ParamControl({ param, value, onChange }: ParamControlProps) {
  if (param.type === "toggle") {
    return (
      <button
        onClick={() => onChange(value ? 0 : 1)}
        className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
          value
            ? "bg-white text-black"
            : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        {param.label}
      </button>
    );
  }

  return (
    <label className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">{param.label}</span>
        <span className="min-w-[3ch] text-right text-sm tabular-nums text-zinc-500">
          {param.step < 1 ? value.toFixed(1) : value}
        </span>
      </div>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={param.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-white [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />
    </label>
  );
}
