import { Schema, model, Document, Types } from 'mongoose'
import { FUND_TYPES, FundType } from './funds.types'

export interface IFund extends Document {
  userId: Types.ObjectId
  name: string
  type: FundType
  date: Date
  amount: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const FundSchema = new Schema<IFund>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    type: {
      type: String,
      enum: FUND_TYPES,
      required: [true, 'Type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes must be at most 500 characters'],
    },
  },
  {
    timestamps: true,
  }
)

export const Fund = model<IFund>('Fund', FundSchema)
