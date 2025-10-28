import mongoose, { Document, Schema } from 'mongoose';

export interface IMemory extends Document {
  agentId: string;
  text: string;
  embedding: number[];
  source?: string;
  sourceUrl?: string;
  sourceMetadata?: any;
  chunkIndex?: number;
  contentHash: string;
  contentVersion: number;
  chunkMetadata?: {
    chunkIndex: number;
    totalChunks: number;
    fileName?: string;
    pageNumber?: number;
    sectionTitle?: string;
    timestamp?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>({
  agentId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  source: { type: String, enum: ['audio', 'video', 'document', 'website', 'youtube', 'text'] },
  sourceUrl: { type: String },
  sourceMetadata: { type: Schema.Types.Mixed },
  chunkIndex: { type: Number },
  contentHash: { type: String, required: true, index: true },
  contentVersion: { type: Number, default: 1 },
  chunkMetadata: {
    chunkIndex: { type: Number },
    totalChunks: { type: Number },
    fileName: { type: String },
    pageNumber: { type: Number },
    sectionTitle: { type: String },
    timestamp: { type: Number }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
MemorySchema.index({ agentId: 1, contentHash: 1 });
MemorySchema.index({ agentId: 1, source: 1 });
MemorySchema.index({ agentId: 1, createdAt: -1 });

// Virtual for memory ID
MemorySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Static method to find memories by agent
MemorySchema.statics.findByAgent = function(agentId: string) {
  return this.find({ agentId }).sort({ createdAt: -1 });
};

// Static method to find similar memories using vector similarity
MemorySchema.statics.findSimilar = function(agentId: string, embedding: number[], limit: number = 5) {
  return this.aggregate([
    { $match: { agentId } },
    {
      $addFields: {
        similarity: {
          $reduce: {
            input: { $range: [0, { $size: "$embedding" }] },
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $pow: [
                    { $subtract: [{ $arrayElemAt: ["$embedding", "$$this"] }, { $arrayElemAt: [embedding, "$$this"] }] },
                    2
                  ]
                }
              ]
            }
          }
        }
      }
    },
    { $addFields: { similarity: { $sqrt: "$similarity" } } },
    { $sort: { similarity: 1 } },
    { $limit: limit }
  ]);
};

// Static method to get memory statistics
MemorySchema.statics.getStats = function(agentId: string) {
  return this.aggregate([
    { $match: { agentId } },
    {
      $group: {
        _id: null,
        totalMemories: { $sum: 1 },
        totalChunks: { $sum: 1 },
        sources: { $addToSet: "$source" },
        avgTextLength: { $avg: { $strLenCP: "$text" } }
      }
    }
  ]);
};

export default mongoose.model<IMemory>('Memory', MemorySchema);
