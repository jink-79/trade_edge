import { Schema, model } from "mongoose";

/** One doc per attempted send — audit trail for the daily cron, since
 * nothing else surfaces whether it actually ran or why it didn't. */
export interface INewsletterRun {
  userId: string;
  date: Date;
  symbols: string[];
  status: "sent" | "failed" | "no_positions";
  error: string | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterRunSchema = new Schema<INewsletterRun>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    symbols: { type: [String], default: [] },
    status: { type: String, enum: ["sent", "failed", "no_positions"], required: true },
    error: { type: String, default: null },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const NewsletterRun = model<INewsletterRun>(
  "NewsletterRun",
  NewsletterRunSchema,
  "newsletter_runs",
);
