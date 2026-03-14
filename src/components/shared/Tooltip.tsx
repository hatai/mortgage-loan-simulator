import { useState } from "react";
import { Info } from "lucide-react";
import { GLOSSARY } from "#/lib/glossary";

interface TooltipProps {
  termKey: string;
  children?: React.ReactNode;
}

export function GlossaryTooltip({ termKey, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[termKey];
  if (!entry) return <>{children}</>;

  return (
    <span className="relative inline-flex items-center gap-1">
      {children ?? entry.term}
      <button
        type="button"
        className="inline-flex cursor-help text-muted-foreground hover:text-foreground"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        aria-label={`${entry.term}の説明`}
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-lg">
          <span className="mb-1 block font-semibold">{entry.term}</span>
          {entry.description}
        </span>
      )}
    </span>
  );
}
