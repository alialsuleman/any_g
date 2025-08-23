import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    gender: 'male' | 'female'
    role: 'user' | 'admin' | 'coach';
    avatarFilename: string;
    purchasedPrograms: Types.ObjectId[];

}

const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male'
    }, avatarFilename: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'coach'],
        default: 'user'
    },
    purchasedPrograms: [{
        type: Schema.Types.ObjectId,
        ref: 'FitnessProgram'
    }]
}, {
    timestamps: true
});

export const User = model<IUser>('User', UserSchema);