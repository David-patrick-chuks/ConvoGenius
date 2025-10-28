import mongoose, { Schema } from 'mongoose';
import { IDeployment } from '../types';

const DeploymentSchema: Schema = new Schema({
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    platform: { 
        type: String, 
        required: true,
        enum: ['website', 'telegram', 'slack', 'discord', 'twitter', 'hashnode', 'notion', 'email']
    },
    status: { 
        type: String,
        required: true, 
        enum: ['active', 'inactive', 'error', 'pending'],
        default: 'pending'
    },
    config: { type: Schema.Types.Mixed, required: true },
    lastPing: { type: Date },
    stats: {
        totalViews: { type: Number, default: 0 },
        uniqueVisitors: { type: Number, default: 0 },
        totalChats: { type: Number, default: 0 },
        avgResponseTime: { type: Number, default: 0 },
        satisfactionRate: { type: Number, default: 0 }
    },
    webhookUrl: { type: String },
    credentials: {
        accessToken: { type: String },
        refreshToken: { type: String },
        botToken: { type: String },
        apiKey: { type: String },
        webhookSecret: { type: String }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
DeploymentSchema.index({ agentId: 1 });
DeploymentSchema.index({ userId: 1 });
DeploymentSchema.index({ platform: 1 });
DeploymentSchema.index({ status: 1 });
DeploymentSchema.index({ createdAt: -1 });

// Virtual for deployment ID
DeploymentSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// Method to update stats
DeploymentSchema.methods.updateStats = function(stats: Partial<IDeployment['stats']>) {
    this.stats = { ...this.stats, ...stats };
    return this.save();
};

// Method to ping (update lastPing)
DeploymentSchema.methods.ping = function() {
    this.lastPing = new Date();
    return this.save();
};

// Method to activate deployment
DeploymentSchema.methods.activate = function() {
    this.status = 'active';
    this.lastPing = new Date();
    return this.save();
};

// Method to deactivate deployment
DeploymentSchema.methods.deactivate = function() {
    this.status = 'inactive';
    return this.save();
};

// Static method to find deployments by user
DeploymentSchema.statics.findByUser = function(userId: string) {
    return this.find({ userId }).populate('agentId').sort({ createdAt: -1 });
};

// Static method to find active deployments
DeploymentSchema.statics.findActive = function() {
    return this.find({ status: 'active' }).populate('agentId');
};

// Static method to find deployments by platform
DeploymentSchema.statics.findByPlatform = function(platform: string) {
    return this.find({ platform, status: 'active' }).populate('agentId');
};

export default mongoose.model<IDeployment>('Deployment', DeploymentSchema);