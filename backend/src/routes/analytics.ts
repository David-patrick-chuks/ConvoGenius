import express, { NextFunction, Request, Response } from 'express';
import Analytics from '../models/Analytics';
import Agent from '../models/Agent';
import ChatMessage from '../models/ChatMessage';
import TrainJob from '../models/TrainJob';
import Memory from '../models/Memory';
import Resource from '../models/Resource';

const router = express.Router();

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     description: Retrieve comprehensive analytics data for the user's dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalAgents:
 *                       type: number
 *                     activeAgents:
 *                       type: number
 *                     totalConversations:
 *                       type: number
 *                     totalTrainingJobs:
 *                       type: number
 *                     totalResources:
 *                       type: number
 *                 agents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       conversations:
 *                         type: number
 *                       lastActive:
 *                         type: string
 *                       status:
 *                         type: string
 *                 conversations:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     today:
 *                       type: number
 *                     thisWeek:
 *                       type: number
 *                     thisMonth:
 *                       type: number
 *                 training:
 *                   type: object
 *                   properties:
 *                     completed:
 *                       type: number
 *                     processing:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     totalMemories:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get overview statistics
    const [
      totalAgents,
      activeAgents,
      totalConversations,
      totalTrainingJobs,
      totalResources,
      agentsWithStats,
      conversationStats,
      trainingStats,
      memoryStats
    ] = await Promise.all([
      Agent.countDocuments({ userId }),
      Agent.countDocuments({ userId, status: 'trained' }),
      ChatMessage.countDocuments({ userId }),
      TrainJob.countDocuments({ userId }),
      Resource.countDocuments({ userId }),
      
      // Get agents with conversation counts
      Agent.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: 'chatmessages',
            localField: '_id',
            foreignField: 'agentId',
            as: 'conversations'
          }
        },
        {
          $project: {
            id: '$_id',
            name: 1,
            status: 1,
            lastActive: 1,
            conversations: { $size: '$conversations' }
          }
        },
        { $sort: { conversations: -1 } },
        { $limit: 10 }
      ]),
      
      // Get conversation statistics
      ChatMessage.aggregate([
        { $match: { userId, timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            today: {
              $sum: {
                $cond: [
                  { $gte: ['$timestamp', new Date(new Date().setHours(0, 0, 0, 0))] },
                  1,
                  0
                ]
              }
            },
            thisWeek: {
              $sum: {
                $cond: [
                  { $gte: ['$timestamp', new Date(new Date().setDate(new Date().getDate() - 7))] },
                  1,
                  0
                ]
              }
            },
            thisMonth: {
              $sum: {
                $cond: [
                  { $gte: ['$timestamp', new Date(new Date().setDate(new Date().getDate() - 30))] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      
      // Get training statistics
      TrainJob.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
          }
        }
      ]),
      
      // Get memory statistics
      Memory.aggregate([
        { $match: { agentId: { $in: await Agent.find({ userId }).distinct('_id') } } },
        {
          $group: {
            _id: null,
            totalMemories: { $sum: 1 }
          }
        }
      ])
    ]);

    const analytics = {
      overview: {
        totalAgents,
        activeAgents,
        totalConversations,
        totalTrainingJobs,
        totalResources
      },
      agents: agentsWithStats,
      conversations: conversationStats[0] || { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
      training: trainingStats[0] || { completed: 0, processing: 0, failed: 0 },
      memory: memoryStats[0] || { totalMemories: 0 }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

/**
 * @swagger
 * /api/analytics/agents/{agentId}:
 *   get:
 *     summary: Get agent-specific analytics
 *     description: Retrieve detailed analytics for a specific agent
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Agent analytics retrieved successfully
 *       404:
 *         description: Agent not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/agents/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const userId = (req.user as any).id;
    const { period = '30d' } = req.query;

    // Verify agent belongs to user
    const agent = await Agent.findOne({ _id: agentId, userId });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get agent-specific analytics
    const [
      conversationStats,
      trainingJobs,
      memoryStats,
      dailyStats
    ] = await Promise.all([
      // Conversation statistics
      ChatMessage.aggregate([
        { $match: { agentId, userId, timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            userMessages: { $sum: { $cond: [{ $eq: ['$type', 'user'] }, 1, 0] } },
            agentMessages: { $sum: { $cond: [{ $eq: ['$type', 'agent'] }, 1, 0] } },
            avgResponseTime: { $avg: '$metadata.responseTime' },
            avgConfidence: { $avg: '$metadata.confidence' }
          }
        }
      ]),
      
      // Training jobs
      TrainJob.find({ agentId }).sort({ createdAt: -1 }).limit(10),
      
      // Memory statistics
      Memory.getStats(agentId),
      
      // Daily conversation stats
      ChatMessage.aggregate([
        { $match: { agentId, userId, timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            messages: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' }
          }
        },
        {
          $addFields: {
            uniqueSessionsCount: { $size: '$uniqueSessions' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const analytics = {
      agent: {
        id: agent._id,
        name: agent.name,
        status: agent.status,
        createdAt: agent.createdAt
      },
      conversations: conversationStats[0] || {
        totalMessages: 0,
        userMessages: 0,
        agentMessages: 0,
        avgResponseTime: 0,
        avgConfidence: 0
      },
      training: {
        jobs: trainingJobs,
        memoryStats: memoryStats[0] || {
          totalMemories: 0,
          totalChunks: 0,
          sources: [],
          avgTextLength: 0
        }
      },
      dailyStats
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching agent analytics:', error);
    res.status(500).json({ error: 'Failed to fetch agent analytics' });
  }
});

/**
 * @swagger
 * /api/analytics/conversations:
 *   get:
 *     summary: Get conversation analytics
 *     description: Retrieve analytics about conversations across all agents
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Conversation analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get conversation analytics
    const [
      sessionStats,
      agentBreakdown,
      hourlyStats,
      responseTimeStats
    ] = await Promise.all([
      // Session statistics
      ChatMessage.aggregate([
        { $match: { userId, timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: '$sessionId',
            messageCount: { $sum: 1 },
            firstMessage: { $min: '$timestamp' },
            lastMessage: { $max: '$timestamp' }
          }
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            avgMessagesPerSession: { $avg: '$messageCount' },
            avgSessionDuration: {
              $avg: {
                $subtract: ['$lastMessage', '$firstMessage']
              }
            }
          }
        }
      ]),
      
      // Agent breakdown
      ChatMessage.aggregate([
        { $match: { userId, timestamp: { $gte: startDate } } },
        {
          $lookup: {
            from: 'agents',
            localField: 'agentId',
            foreignField: '_id',
            as: 'agent'
          }
        },
        {
          $group: {
            _id: '$agentId',
            agentName: { $first: { $arrayElemAt: ['$agent.name', 0] } },
            messageCount: { $sum: 1 },
            sessionCount: { $addToSet: '$sessionId' }
          }
        },
        {
          $addFields: {
            sessionCount: { $size: '$sessionCount' }
          }
        },
        { $sort: { messageCount: -1 } }
      ]),
      
      // Hourly statistics
      ChatMessage.aggregate([
        { $match: { userId, timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            messageCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Response time statistics
      ChatMessage.aggregate([
        { 
          $match: { 
            userId, 
            timestamp: { $gte: startDate },
            'metadata.responseTime': { $exists: true }
          } 
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$metadata.responseTime' },
            minResponseTime: { $min: '$metadata.responseTime' },
            maxResponseTime: { $max: '$metadata.responseTime' },
            p95ResponseTime: {
              $percentile: {
                input: '$metadata.responseTime',
                p: [0.95],
                method: 'approximate'
              }
            }
          }
        }
      ])
    ]);

    const analytics = {
      sessions: sessionStats[0] || {
        totalSessions: 0,
        avgMessagesPerSession: 0,
        avgSessionDuration: 0
      },
      agentBreakdown,
      hourlyStats,
      responseTime: responseTimeStats[0] || {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: [0]
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching conversation analytics:', error);
    res.status(500).json({ error: 'Failed to fetch conversation analytics' });
  }
});

/**
 * @swagger
 * /api/analytics/training:
 *   get:
 *     summary: Get training analytics
 *     description: Retrieve analytics about training jobs and memory usage
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Training analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/training', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;

    // Get training analytics
    const [
      jobStats,
      memoryStats,
      recentJobs,
      sourceBreakdown
    ] = await Promise.all([
      // Job statistics
      TrainJob.getStats(userId),
      
      // Memory statistics
      Memory.aggregate([
        { $match: { agentId: { $in: await Agent.find({ userId }).distinct('_id') } } },
        {
          $group: {
            _id: null,
            totalMemories: { $sum: 1 },
            totalChunks: { $sum: 1 },
            sources: { $addToSet: '$source' },
            avgTextLength: { $avg: { $strLenCP: '$text' } }
          }
        }
      ]),
      
      // Recent training jobs
      TrainJob.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('agentId', 'name'),
      
      // Source breakdown
      Memory.aggregate([
        { $match: { agentId: { $in: await Agent.find({ userId }).distinct('_id') } } },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            avgLength: { $avg: { $strLenCP: '$text' } }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    const analytics = {
      jobs: jobStats[0] || {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        activeJobs: 0,
        avgProgress: 0
      },
      memory: memoryStats[0] || {
        totalMemories: 0,
        totalChunks: 0,
        sources: [],
        avgTextLength: 0
      },
      recentJobs,
      sourceBreakdown
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching training analytics:', error);
    res.status(500).json({ error: 'Failed to fetch training analytics' });
  }
});

export default router;