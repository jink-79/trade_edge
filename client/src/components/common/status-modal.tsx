import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const toneVariants = cva(
  "flex size-14 items-center justify-center rounded-2xl border shadow-sm",
  {
    variants: {
      variant: {
        error: "border-destructive/20 bg-destructive/10 text-destructive",
        info: "border-primary/20 bg-primary/10 text-primary",
        success: "border-success/20 bg-success/10 text-success",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

const iconMap = {
  error: AlertTriangle,
  info: Info,
  success: CheckCircle2,
} as const;

export type StatusModalVariant = "error" | "info" | "success";

export interface StatusModalAction {
  label: string;
  onClick?: () => void;
  loading?: boolean;
  autoClose?: boolean;
}

export interface StatusModalProps {
  variant?: StatusModalVariant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  primaryAction?: StatusModalAction;
  secondaryAction?: StatusModalAction;
  className?: string;
}

function StatusModal({
  variant = "info",
  open,
  onOpenChange,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  className,
}: StatusModalProps) {
  const Icon = iconMap[variant];

  const handleAction = (action?: StatusModalAction) => {
    if (!action) return;
    action.onClick?.();
    if (action.autoClose !== false) {
      onOpenChange(false);
    }
  };

  const primaryToneClass = {
    error: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    info: "bg-primary text-primary-foreground hover:bg-primary/90",
    success: "bg-success text-success-foreground hover:bg-success/90",
  }[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-md gap-0 overflow-hidden border-border/60 bg-card p-0 shadow-2xl",
          className,
        )}
      >
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <div className={cn(toneVariants({ variant }), "mb-5")}>
            <Icon className="size-7" strokeWidth={2} />
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          {children && <div className="mt-4 w-full text-left">{children}</div>}
        </div>

        {(primaryAction || secondaryAction) && (
          <DialogFooter className="flex-col-reverse gap-2 border-t border-border/60 bg-secondary/30 px-6 py-4 sm:flex-row sm:justify-center sm:gap-3">
            {secondaryAction && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleAction(secondaryAction)}
                disabled={secondaryAction.loading}
              >
                {secondaryAction.loading ? "Loading…" : secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                className={cn("w-full sm:w-auto", primaryToneClass)}
                onClick={() => handleAction(primaryAction)}
                disabled={primaryAction.loading}
              >
                {primaryAction.loading ? "Loading…" : primaryAction.label}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Imperative hook for toasts-like modal calls                                */
/* -------------------------------------------------------------------------- */

export interface StatusModalState {
  open: boolean;
  variant: StatusModalVariant;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  primaryAction?: StatusModalAction;
  secondaryAction?: StatusModalAction;
}

export function useStatusModal() {
  const [state, setState] = React.useState<StatusModalState>({
    open: false,
    variant: "info",
    title: "",
  });

  const open = React.useCallback((config: Omit<StatusModalState, "open">) => {
    setState({ ...config, open: true });
  }, []);

  const close = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const update = React.useCallback((partial: Partial<StatusModalState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const modal = React.useMemo(
    () => (
      <StatusModal
        {...state}
        onOpenChange={(open) => setState((s) => ({ ...s, open }))}
        primaryAction={
          state.primaryAction
            ? {
                ...state.primaryAction,
                onClick: () => {
                  state.primaryAction?.onClick?.();
                  if (state.primaryAction?.autoClose !== false) {
                    close();
                  }
                },
              }
            : undefined
        }
        secondaryAction={
          state.secondaryAction
            ? {
                ...state.secondaryAction,
                onClick: () => {
                  state.secondaryAction?.onClick?.();
                  if (state.secondaryAction?.autoClose !== false) {
                    close();
                  }
                },
              }
            : undefined
        }
      />
    ),
    [state, close],
  );

  return { modal, open, close, update };
}

export { StatusModal };
