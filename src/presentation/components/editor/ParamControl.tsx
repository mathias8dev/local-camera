
import { ParamDef } from "@/domain/entities/EditorOperation";
import { Button } from "@/presentation/components/ui/Button";

interface ParamControlProps {
  param: ParamDef;
  value: number;
  onChange: (value: number) => void;
}

export function ParamControl({ param, value, onChange }: ParamControlProps) {
  if (param.type === "toggle") {
    return (
      <Button
        variant="toggle"
        active={!!value}
        onClick={() => onChange(value ? 0 : 1)}
        className="active:scale-95"
      >
        {param.label}
      </Button>
    );
  }

  return (
    <label className="flex flex-col gap-1.5 lg:gap-2">
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
        className="h-2 w-full cursor-pointer touch-pan-x appearance-none rounded-full bg-zinc-700 accent-white [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
      />
    </label>
  );
}
