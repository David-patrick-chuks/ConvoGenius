import mongoose, { Document, Schema } from 'mongoose';

export interface IResource extends Document {
  userId: string;
  name: string;
  originalName: string;
  type: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  linkedAgents: string[];
  status: 'processed' | 'processing' | 'failed';
  url: string;
  path: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    language?: string;
    extractedText?: string;
    error?: string;
  };
}

const ResourceSchema = new Schema<IResource>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  type: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  linkedAgents: [{ type: Schema.Types.ObjectId, ref: 'Agent' }],
  status: { 
    type: String, 
    enum: ['processed', 'processing', 'failed'], 
    default: 'processing' 
  },
  url: { type: String, required: true },
  path: { type: String, required: true },
  metadata: {
    pages: { type: Number },
    wordCount: { type: Number },
    language: { type: String },
    extractedText: { type: String },
    error: { type: String }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
ResourceSchema.index({ userId: 1, uploadDate: -1 });
ResourceSchema.index({ userId: 1, status: 1 });
ResourceSchema.index({ userId: 1, type: 1 });
ResourceSchema.index({ linkedAgents: 1 });

// Virtual for resource ID
ResourceSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual for file size in human readable format
ResourceSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Static method to find resources by user
ResourceSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).sort({ uploadDate: -1 });
};

// Static method to find resources by agent
ResourceSchema.statics.findByAgent = function(agentId: string) {
  return this.find({ linkedAgents: agentId }).sort({ uploadDate: -1 });
};

// Static method to get resource statistics
ResourceSchema.statics.getStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalResources: { $sum: 1 },
        totalSize: { $sum: '$size' },
        processedResources: { $sum: { $cond: [{ $eq: ['$status', 'processed'] }, 1, 0] } },
        processingResources: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
        failedResources: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        types: { $addToSet: '$type' }
      }
    }
  ]);
};

// Method to update status
ResourceSchema.methods.updateStatus = function(status: 'processed' | 'processing' | 'failed', metadata?: any) {
  this.status = status;
  if (metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

export default mongoose.model<IResource>('Resource', ResourceSchema);