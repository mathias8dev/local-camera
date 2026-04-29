import { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
      {children}
    </p>
  );
}
