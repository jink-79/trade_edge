import { Schema, model, Document } from 'mongoose'

// Read-only model — this collection is written by the Python scanner pipeline,
// never by the API. No userId — signals are global (not per-user).

export interface ISignal extends Document {
  symbol: string
  week_key: string       // e.g. "2025-W03" — used for grouping
  signal_week: string    // human-readable label e.g. "Week of Jan 13, 2025"
  close: number
  breakout_level: number
  volume: number
  avg_volume_20: number
}

const SignalSchema = new Schema<ISignal>(
  {
    symbol: { type: String, required: true, trim: true, uppercase: true },
    week_key: { type: String, required: true, index: true },
    signal_week: { type: String, required: true },
    close: { type: Number, required: true },
    breakout_level: { type: Number, required: true },
    volume: { type: Number, required: true },
    avg_volume_20: { type: Number, required: true },
  },
  {
    timestamps: false,
    collection: 'weekly_entry_scanner', // matches your Atlas collection exactly
  }
)

export const Signal = model<ISignal>('Signal', SignalSchema)
