import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  agentId: string;
  userId: string;
  date: Date;
  totalViews: number;
  uniqueVisitors: number;
  totalChats: number;
  avgResponseTime: number;
  satisfactionRate: number;
  platformBreakdown: Record<string, number>;
  dailyStats: Array<{
    date: Date;
    views: number;
    chats: number;
    visitors: number;
  }>;
}

const AnalyticsSchema = new Schema<IAnalytics>({
  agentId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  totalViews: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  totalChats: { type: Number, default: 0 },
  avgResponseTime: { type: Number, default: 0 },
  satisfactionRate: { type: Number, default: 0 },
  platformBreakdown: { type: Schema.Types.Mixed, default: {} },
  dailyStats: [{
    date: { type: Date, required: true },
    views: { type: Number, default: 0 },
    chats: { type: Number, default: 0 },
    visitors: { type: Number, default: 0 }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
AnalyticsSchema.index({ agentId: 1, date: -1 });
AnalyticsSchema.index({ userId: 1, date: -1 });
AnalyticsSchema.index({ date: -1 });

// Virtual for analytics ID
AnalyticsSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Static method to find analytics by agent
AnalyticsSchema.statics.findByAgent = function(agentId: string) {
  return this.find({ agentId }).sort({ date: -1 });
};

// Static method to find analytics by user
AnalyticsSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).sort({ date: -1 });
};

// Static method to get analytics for date range
AnalyticsSchema.statics.findByDateRange = function(startDate: Date, endDate: Date, agentId?: string) {
  const query: any = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (agentId) {
    query.agentId = agentId;
  }
  
  return this.find(query).sort({ date: 1 });
};

// Static method to get aggregated analytics
AnalyticsSchema.statics.getAggregatedStats = function(userId: string, startDate: Date, endDate: Date) {
  return this.aggregate([
    { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$totalViews' },
        totalVisitors: { $sum: '$uniqueVisitors' },
        totalChats: { $sum: '$totalChats' },
        avgResponseTime: { $avg: '$avgResponseTime' },
        avgSatisfactionRate: { $avg: '$satisfactionRate' },
        platformBreakdown: {
          $mergeObjects: '$platformBreakdown'
        }
      }
    }
  ]);
};

// Method to update daily stats
AnalyticsSchema.methods.updateDailyStats = function(date: Date, stats: { views?: number; chats?: number; visitors?: number }) {
  const existingDay = this.dailyStats.find((day: any) => 
    day.date.toDateString() === date.toDateString()
  );
  
  if (existingDay) {
    existingDay.views += stats.views || 0;
    existingDay.chats += stats.chats || 0;
    existingDay.visitors += stats.visitors || 0;
  } else {
    this.dailyStats.push({
      date,
      views: stats.views || 0,
      chats: stats.chats || 0,
      visitors: stats.visitors || 0
    });
  }
  
  return this.save();
};

export default mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);