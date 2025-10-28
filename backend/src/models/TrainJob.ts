import mongoose, { Document, Schema } from 'mongoose';

export interface ITrainJob extends Document {
  jobId: string;
  agentId: string;
  userId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error: any;
  result: any;
  createdAt: Date;
  updatedAt: Date;
  fileNames: string[];
  usedFiles: boolean;
  chunksProcessed?: number;
  totalChunks?: number;
  successCount?: number;
  errorCount?: number;
  skippedCount?: number;
  source?: string;
  sourceUrl?: string;
  sourceMetadata?: any;
}

const TrainJobSchema = new Schema<ITrainJob>({
  jobId: { type: String, required: true, unique: true, index: true },
  agentId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['queued', 'processing', 'completed', 'failed'], 
    required: true,
    default: 'queued'
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  error: { type: Schema.Types.Mixed, default: null },
  result: { type: Schema.Types.Mixed, default: null },
  fileNames: { type: [String], default: [] },
  usedFiles: { type: Boolean, default: false },
  chunksProcessed: { type: Number, default: 0 },
  totalChunks: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  source: { type: String, enum: ['audio', 'video', 'document', 'website', 'youtube', 'text'] },
  sourceUrl: { type: String },
  sourceMetadata: { type: Schema.Types.Mixed }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
TrainJobSchema.index({ agentId: 1, status: 1 });
TrainJobSchema.index({ userId: 1, createdAt: -1 });
TrainJobSchema.index({ status: 1, createdAt: -1 });

// Virtual for job ID
TrainJobSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Static method to find jobs by agent
TrainJobSchema.statics.findByAgent = function(agentId: string) {
  return this.find({ agentId }).sort({ createdAt: -1 });
};

// Static method to find jobs by user
TrainJobSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to find active jobs
TrainJobSchema.statics.findActive = function() {
  return this.find({ status: { $in: ['queued', 'processing'] } });
};

// Static method to get job statistics
TrainJobSchema.statics.getStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        completedJobs: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        failedJobs: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        activeJobs: { $sum: { $cond: [{ $in: ["$status", ["queued", "processing"]] }, 1, 0] } },
        avgProgress: { $avg: "$progress" }
      }
    }
  ]);
};

export default mongoose.model<ITrainJob>('TrainJob', TrainJobSchema);
