import { Schema, model, Document, Types } from 'mongoose';
import { IFitnessProgram } from './FitnessProgram';

export interface IExercise extends Document {
    name: string;
    description: string;
    dayNumber: number;
    orderInDay: number;
    images: string[];
    sets: number;
    reps: number;
    equipment?: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    targetMuscles: string[];
    FitnessProgram: Types.ObjectId | IFitnessProgram;
}

const ExerciseSchema = new Schema<IExercise>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    sets: {
        type: Number,
        required: true,
        min: 1
    },
    dayNumber: {
        type: Number,
        required: true,
        min: 1
    },
    orderInDay: {
        type: Number,
        required: true,
        min: 1
    },
    reps: {
        type: Number,
        required: true,
        min: 1
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    equipment: [{
        type: String,
        trim: true
    }],
    targetMuscles: [{
        type: String,
        trim: true
    }],
    FitnessProgram: {
        type: Schema.Types.ObjectId,
        ref: 'FitnessProgram',
        required: true
    }
}, {
    timestamps: true
});

export const Exercise = model<IExercise>('Exercise', ExerciseSchema);