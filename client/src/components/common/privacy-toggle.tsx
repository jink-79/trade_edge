import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setHidden, useAmountsHidden } from "@/lib/privacy";

export function PrivacyToggle() {
  const hidden = useAmountsHidden();
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={() => setHidden(!hidden)}
      aria-label={hidden ? "Show amounts" : "Hide amounts"}
      aria-pressed={hidden}
      className="text-muted-foreground"
    >
      {hidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </Button>
  );
}
