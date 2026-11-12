import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/common/field-styles";

interface Props {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// Rupee amount: numeric keypad on phones, ₹ prefix, digits only.
export function AmountInput({ id, value, onChange, placeholder = "0", autoFocus }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        ₹
      </span>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
        className={cn(fieldClass, "pl-7 tabular-nums")}
      />
    </div>
  );
}
