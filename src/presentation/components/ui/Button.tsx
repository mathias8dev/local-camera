import { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "outline"
  | "danger"
  | "destructive"
  | "ghost"
  | "toggle";

type ButtonSize = "default" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-40";

const sizes: Record<ButtonSize, string> = {
  default: "rounded-xl px-4 py-3",
  sm: "rounded-lg px-5 py-2.5",
};

function variantClass(variant: ButtonVariant, active?: boolean): string {
  switch (variant) {
    case "primary":
      return "bg-white font-semibold text-black hover:bg-zinc-200 active:bg-zinc-300";
    case "outline":
      return "border border-zinc-700 font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white active:bg-zinc-700";
    case "danger":
      return "border border-red-500/50 font-medium text-red-400 hover:bg-red-500/10 active:bg-red-500/20";
    case "destructive":
      return "bg-red-600 font-medium text-white hover:bg-red-700";
    case "ghost":
      return "font-medium text-zinc-400 hover:text-white";
    case "toggle":
      return active
        ? "bg-white font-medium text-black"
        : "border border-zinc-700 font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white";
  }
}

export function Button({
  variant = "outline",
  size = "default",
  active,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${sizes[size]} ${variantClass(variant, active)}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
