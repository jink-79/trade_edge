import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { type SortState } from "../types/mutual-funds.types";

interface SortBtnProps {
  col: string;
  label: string;
  sortState: SortState;
  onSort: (col: string) => void;
}

export function SortBtn({ col, label, sortState, onSort }: SortBtnProps) {
  const isCurrentCol = sortState.col === col;

  return (
    <button
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer whitespace-nowrap"
    >
      {label}
      {!isCurrentCol ? (
        <ChevronsUpDown className="size-3 text-muted-foreground/40" />
      ) : sortState.dir === "asc" ? (
        <ChevronUp className="size-3 text-primary" />
      ) : (
        <ChevronDown className="size-3 text-primary" />
      )}
    </button>
  );
}
