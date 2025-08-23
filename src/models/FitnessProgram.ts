import { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './User';
import { IExercise } from './Exercise';

export interface IFitnessProgram extends Document {
    name: string;
    description: string;
    createdBy: Types.ObjectId | IUser;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    price: number;
    ratings: {
        user: Types.ObjectId;
        rating: number;
        comment?: string;
        createdAt: Date;
    }[];
    averageRating: number;
}

const FitnessProgramSchema = new Schema<IFitnessProgram>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    category: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },

    price: {
        type: Number,
        min: 0
    },

    ratings: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
}, {
    timestamps: true
});

FitnessProgramSchema.pre('save', function (next) {
    if (this.ratings.length > 0) {
        const total = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
        this.averageRating = Math.round((total / this.ratings.length) * 10) / 10;
    } else {
        this.averageRating = 0;
    }
    next();
});

// Indexes for better query performance
FitnessProgramSchema.index({ createdBy: 1 });
FitnessProgramSchema.index({ category: 1 });
FitnessProgramSchema.index({ difficulty: 1 });
FitnessProgramSchema.index({ averageRating: -1 });

export const FitnessProgram = model<IFitnessProgram>('FitnessProgram', FitnessProgramSchema);