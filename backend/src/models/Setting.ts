import mongoose, { Document, Schema } from 'mongoose';

export interface ISetting extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    emailNotifications: boolean;
    darkMode: boolean;
    language: string;
}

const SettingSchema: Schema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Each user has only one settings document
    },
    emailNotifications: {
        type: Boolean,
        default: true,
    },
    darkMode: {
        type: Boolean,
        default: false,
    },
    language: {
        type: String,
        default: 'en',
    },
});

export default mongoose.model<ISetting>('Setting', SettingSchema);
