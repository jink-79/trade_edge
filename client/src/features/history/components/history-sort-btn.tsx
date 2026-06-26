import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { type SortCol, type SortState } from "../types/history.types";

interface HistorySortBtnProps {
  col: SortCol;
  label: string;
  sortState: SortState;
  onSort: (col: SortCol) => void;
}

export function HistorySortBtn({
  col,
  label,
  sortState,
  onSort,
}: HistorySortBtnProps) {
  return (
    <button
      onClick={() => onSort(col)}
      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
    >
      {label}
      {sortState.col !== col ? (
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      ) : sortState.dir === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )}
    </button>
  );
}
