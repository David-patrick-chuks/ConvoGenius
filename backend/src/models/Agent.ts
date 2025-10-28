import mongoose, { Schema } from 'mongoose';
import { IAgent } from '../types';

const AgentSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { 
        type: String, 
        required: true, 
        enum: ['support', 'sales', 'content', 'general'],
        default: 'general'
    },
    avatar: { type: String },
    status: { 
        type: String, 
        required: true, 
        enum: ['trained', 'training', 'failed'],
        default: 'training'
    },
    lastActive: { type: Date },
    conversations: { type: Number, default: 0 },
    platforms: [{ type: String }],
    sources: [{
        _id: { type: Schema.Types.ObjectId, ref: 'Resource' },
        name: { type: String, required: true },
        type: { type: String, required: true },
        size: { type: String, required: true },
        uploadDate: { type: Date, required: true },
        status: { 
            type: String, 
            enum: ['processed', 'processing', 'failed'],
            default: 'processing'
        },
        url: { type: String },
        content: { type: String }
    }],
    apis: [{ type: String }],
    tone: { 
        type: String, 
        required: true, 
        enum: ['friendly', 'formal', 'techy', 'fun'],
        default: 'friendly'
    },
    config: {
        searchEnabled: { type: Boolean, default: true },
        newsEnabled: { type: Boolean, default: false },
        expressAgentEnabled: { type: Boolean, default: true }
    },
    trainingData: {
        documents: [{ type: String }],
        conversations: [{ type: String }],
        customInstructions: { type: String }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
AgentSchema.index({ userId: 1 });
AgentSchema.index({ status: 1 });
AgentSchema.index({ type: 1 });
AgentSchema.index({ createdAt: -1 });

// Virtual for agent ID
AgentSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// Method to update last active
AgentSchema.methods.updateLastActive = function() {
    this.lastActive = new Date();
    return this.save();
};

// Method to increment conversations
AgentSchema.methods.incrementConversations = function() {
    this.conversations += 1;
    return this.save();
};

// Static method to find agents by user
AgentSchema.statics.findByUser = function(userId: string) {
    return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to find active agents
AgentSchema.statics.findActive = function() {
    return this.find({ status: 'trained' });
};

export default mongoose.model<IAgent>('Agent', AgentSchema);