import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';
import { IApiKey } from '../types';

const ApiKeySchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true },
    status: { 
        type: String, 
        enum: ['active', 'inactive'],
        default: 'active'
    },
    lastUsed: { type: Date },
    permissions: [{ type: String }]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
ApiKeySchema.index({ userId: 1 });
ApiKeySchema.index({ key: 1 });
ApiKeySchema.index({ status: 1 });

// Virtual for API key ID
ApiKeySchema.virtual('id').get(function() {
    return (this as any)._id.toHexString();
});

// Pre-save middleware to generate API key
ApiKeySchema.pre('save', function(next) {
    if (this.isNew) {
        this.key = `cd_${crypto.randomBytes(32).toString('hex')}`;
    }
    next();
});

// Method to update last used
ApiKeySchema.methods.updateLastUsed = function() {
    this.lastUsed = new Date();
    return this.save();
};

// Method to activate
ApiKeySchema.methods.activate = function() {
    this.status = 'active';
    return this.save();
};

// Method to deactivate
ApiKeySchema.methods.deactivate = function() {
    this.status = 'inactive';
    return this.save();
};

// Static method to find API keys by user
ApiKeySchema.statics.findByUser = function(userId: string) {
    return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to find active API keys
ApiKeySchema.statics.findActive = function() {
    return this.find({ status: 'active' });
};

// Static method to validate API key
ApiKeySchema.statics.validateKey = function(key: string) {
    return this.findOne({ key, status: 'active' }).populate('userId');
};

export default mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
