import { Schema, model, Document, Types } from 'mongoose';

export interface IBuy extends Document {
    program: Types.ObjectId;   // Reference to the FitnessProgram
    user: Types.ObjectId;      // Reference to the User who bought the program
    purchaseDate: Date;
    status: 'pending' | 'cancelled' | 'completed';
    totalAmount: number;
    createdAt: Date;
}

const BuySchema = new Schema<IBuy>({
    program: {
        type: Schema.Types.ObjectId,
        ref: 'FitnessProgram',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'cancelled', 'completed'],
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    }

}, {
    timestamps: true
});

// Indexes for better query performance
BuySchema.index({ user: 1 });
BuySchema.index({ program: 1 });
BuySchema.index({ status: 1 });
BuySchema.index({ createdAt: -1 });

export const Buy = model<IBuy>('Buy', BuySchema);