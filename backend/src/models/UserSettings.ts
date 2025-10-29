import mongoose, { Schema } from 'mongoose';
import { IUserSettings } from '../types';

const UserSettingsSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    theme: { 
        type: String, 
        enum: ['light', 'dark', 'system'],
        default: 'system'
    },
    notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        agentTraining: { type: Boolean, default: true },
        deploymentStatus: { type: Boolean, default: true }
    },
    privacy: {
        dataAnalytics: { type: Boolean, default: true },
        marketingEmails: { type: Boolean, default: false },
        profileVisibility: { 
            type: String, 
            enum: ['public', 'private'],
            default: 'private'
        }
    },
    api: {
        rateLimit: { type: Number, default: 1000 },
        allowedOrigins: [{ type: String }]
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for better performance
UserSettingsSchema.index({ userId: 1 });

// Virtual for settings ID
UserSettingsSchema.virtual('id').get(function() {
    return (this as any)._id.toHexString();
});

// Static method to find settings by user
UserSettingsSchema.statics.findByUser = function(userId: string) {
    return this.findOne({ userId });
};

// Static method to create default settings
UserSettingsSchema.statics.createDefault = function(userId: string) {
    return this.create({
        userId,
        theme: 'system',
        notifications: {
            email: true,
            push: true,
            agentTraining: true,
            deploymentStatus: true
        },
        privacy: {
            dataAnalytics: true,
            marketingEmails: false,
            profileVisibility: 'private'
        },
        api: {
            rateLimit: 1000,
            allowedOrigins: []
        }
    });
};

export default mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
