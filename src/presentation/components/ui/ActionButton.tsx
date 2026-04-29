import { ReactNode } from "react";

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}

export function ActionButton({
  label,
  onClick,
  danger,
  children,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all duration-150 active:scale-95 ${
        danger
          ? "bg-red-500/15 text-red-400 active:bg-red-500/25"
          : "bg-white/10 text-white active:bg-white/20"
      }`}
    >
      {children}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
