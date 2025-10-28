import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  agentId: string;
  userId: string;
  sessionId: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  metadata?: {
    responseTime?: number;
    tokensUsed?: number;
    confidence?: number;
    sources?: string[];
  };
}

const ChatMessageSchema = new Schema<IChatMessage>({
  agentId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  type: { type: String, enum: ['user', 'agent'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    responseTime: { type: Number },
    tokensUsed: { type: Number },
    confidence: { type: Number },
    sources: [{ type: String }]
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
ChatMessageSchema.index({ agentId: 1, sessionId: 1 });
ChatMessageSchema.index({ userId: 1, timestamp: -1 });
ChatMessageSchema.index({ sessionId: 1, timestamp: 1 });

// Virtual for message ID
ChatMessageSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Static method to find messages by session
ChatMessageSchema.statics.findBySession = function(sessionId: string) {
  return this.find({ sessionId }).sort({ timestamp: 1 });
};

// Static method to find messages by agent
ChatMessageSchema.statics.findByAgent = function(agentId: string) {
  return this.find({ agentId }).sort({ timestamp: -1 });
};

// Static method to find messages by user
ChatMessageSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).sort({ timestamp: -1 });
};

// Static method to get conversation statistics
ChatMessageSchema.statics.getStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        userMessages: { $sum: { $cond: [{ $eq: ["$type", "user"] }, 1, 0] } },
        agentMessages: { $sum: { $cond: [{ $eq: ["$type", "agent"] }, 1, 0] } },
        uniqueSessions: { $addToSet: "$sessionId" },
        uniqueAgents: { $addToSet: "$agentId" }
      }
    },
    {
      $addFields: {
        uniqueSessionsCount: { $size: "$uniqueSessions" },
        uniqueAgentsCount: { $size: "$uniqueAgents" }
      }
    }
  ]);
};

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);