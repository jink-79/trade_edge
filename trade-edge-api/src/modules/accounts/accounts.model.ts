import { Schema, model, Document, Types } from "mongoose";
import { ACCOUNT_TYPES, MF_CATEGORIES, type AccountType } from "./accounts.types";

// ── Account ──────────────────────────────────────────────────────────────────
// One thing you own or owe: a mutual fund, a broker account, a bank account,
// a loan or a credit card.

export interface IAccount extends Document {
  userId: Types.ObjectId;
  type: AccountType;
  name: string;
  institution?: string;
  mfCategory?: string;
  closed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    institution: { type: String, trim: true, maxlength: 60 },
    mfCategory: { type: String, enum: MF_CATEGORIES },
    closed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Account = model<IAccount>("Account", AccountSchema);

// ── Snapshot ─────────────────────────────────────────────────────────────────
// What one account was worth (or how much was owed) at the end of one month.
// Loans and cards store the amount owed as a positive number.

export interface ISnapshot extends Document {
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  month: string; // "YYYY-MM"
  value: number;
  invested?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SnapshotSchema = new Schema<ISnapshot>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    value: { type: Number, required: true, min: 0 },
    invested: { type: Number, min: 0 },
  },
  { timestamps: true },
);

SnapshotSchema.index({ accountId: 1, month: 1 }, { unique: true });

export const Snapshot = model<ISnapshot>("Snapshot", SnapshotSchema);
