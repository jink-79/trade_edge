import { type Bias, type Status } from "../types/playbook.types";

export const biasStyles: Record<Bias, string> = {
  Long: "text-success border-success/30 bg-success/10",
  Short: "text-destructive border-destructive/30 bg-destructive/10",
  Both: "text-primary border-primary/30 bg-primary/10",
};

export const statusStyles: Record<Status, string> = {
  Active: "text-success border-success/30 bg-success/10",
  Paused: "text-warning border-warning/30 bg-warning/10",
  Draft: "text-muted-foreground border-border bg-secondary/50",
};
