import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import Agent from '../models/Agent';
import ChatMessage from '../models/ChatMessage';
import Memory from '../models/Memory';
import { embedText, generateWithContext } from '../services/geminiService';

const router = express.Router();
// Public chat endpoint (no auth) for embeds/share links
router.post('/public', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { agentId, message, sessionId } = req.body as any;
    if (!agentId || !message) { res.status(400).json({ error: 'agentId and message are required' }); return; }

    const agent = await Agent.findById(agentId);
    if (!agent) { res.status(404).json({ error: 'Agent not found' }); return; }

    const finalSessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const context = await retrieveRelevantContext(agentId, message, 5);
    const response = await generateContextualResponse(context, message, {
      name: agent.name,
      description: agent.description,
      tone: agent.tone,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxTokens: 1024
    });
    const responseTime = Date.now() - startTime;

    // Store messages tagged as public
    const userMessage = new ChatMessage({ agentId, sessionId: finalSessionId, type: 'user', content: message, timestamp: new Date() });
    const agentMessage = new ChatMessage({ agentId, sessionId: finalSessionId, type: 'agent', content: response, timestamp: new Date(), metadata: { responseTime, confidence: context.length>0?0.8:0.5 } });
    await Promise.all([userMessage.save(), agentMessage.save()]);

    res.json({ message: response, sessionId: finalSessionId, agentId, timestamp: new Date() });
    return;
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to process chat message', details: e?.message });
    return;
  }
});

// Interface for chat request
interface ChatRequest {
  agentId: string;
  message: string;
  sessionId?: string;
}

// Interface for chat response
interface ChatResponse {
  message: string;
  sessionId: string;
  agentId: string;
  timestamp: Date;
  metadata?: {
    responseTime?: number;
    tokensUsed?: number;
    confidence?: number;
    sources?: string[];
  };
}

// Validation middleware for chat requests
const validateChatRequest: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const { agentId, message, sessionId } = req.body as ChatRequest;

  if (!agentId || typeof agentId !== 'string') {
    res.status(400).json({
      error: 'agentId is required and must be a string',
      field: 'agentId'
    });
    return;
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({
      error: 'message is required and must be a non-empty string',
      field: 'message'
    });
    return;
  }

  if (message.length > 10000) {
    res.status(400).json({
      error: 'message is too long (maximum 10000 characters)',
      field: 'message'
    });
    return;
  }

  next();
  return;
};

// Function to retrieve relevant context using RAG
async function retrieveRelevantContext(agentId: string, userMessage: string, limit: number = 5): Promise<string[]> {
  try {
    // Generate embedding for user message
    const userEmbedding = await embedText(userMessage);
    
    // Find similar memories using vector similarity
    const similarMemories = await Memory.findSimilar(agentId, userEmbedding, limit);
    
    // Extract text content from similar memories
    const contextTexts = similarMemories.map((memory: any) => memory.text);
    
    return contextTexts;
  } catch (error) {
    console.error('Error retrieving context:', error);
    return [];
  }
}

// Function to generate response using context
async function generateContextualResponse(
  context: string[], 
  userMessage: string, 
  agentConfig: any
): Promise<string> {
  try {
    return await generateWithContext(context, userMessage, agentConfig);
  } catch (error) {
    console.error('Error generating contextual response:', error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
  }
}

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Send a message to an AI agent
 *     description: Send a message to an AI agent and receive a contextual response using RAG
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *               - message
 *             properties:
 *               agentId:
 *                 type: string
 *                 description: Unique identifier for the AI agent
 *                 example: "sales-agent-001"
 *               message:
 *                 type: string
 *                 description: The user's message
 *                 example: "What are your business hours?"
 *                 maxLength: 10000
 *               sessionId:
 *                 type: string
 *                 description: Optional session identifier for conversation tracking
 *                 example: "session-12345"
 *     responses:
 *       200:
 *         description: Chat response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: The agent's response
 *                 sessionId:
 *                   type: string
 *                   description: Session identifier
 *                 agentId:
 *                   type: string
 *                   description: Agent identifier
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     responseTime:
 *                       type: number
 *                       description: Response time in milliseconds
 *                     tokensUsed:
 *                       type: number
 *                       description: Number of tokens used
 *                     confidence:
 *                       type: number
 *                       description: Confidence score
 *                     sources:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Source documents used
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Internal server error
 */
router.post('/', validateChatRequest, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    const { agentId, message, sessionId } = req.body as ChatRequest;
    const userId = (req.user as any).id;
    
    // Verify agent exists and belongs to user
    const agent = await Agent.findOne({ _id: agentId, userId });
    if (!agent) {
      res.status(404).json({ error: 'Agent not found or access denied' });
      return;
    }

    // Check if agent is trained
    if (agent.status !== 'trained') {
      res.status(400).json({ 
        error: 'Agent is not ready for chat. Please complete training first.',
        agentStatus: agent.status
      });
      return;
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Retrieve relevant context using RAG
    const context = await retrieveRelevantContext(agentId, message, 5);
    
    // Generate response using context
    const response = await generateContextualResponse(context, message, {
      name: agent.name,
      description: agent.description,
      tone: agent.tone,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxTokens: 2048
    });

    const responseTime = Date.now() - startTime;

    // Save chat messages to database
    const userMessage = new ChatMessage({
      agentId,
      userId,
      sessionId: finalSessionId,
      type: 'user',
      content: message,
      timestamp: new Date()
    });

    const agentMessage = new ChatMessage({
      agentId,
      userId,
      sessionId: finalSessionId,
      type: 'agent',
      content: response,
      timestamp: new Date(),
      metadata: {
        responseTime,
        tokensUsed: response.length, // Approximate token count
        confidence: context.length > 0 ? 0.8 : 0.5,
        sources: context.length > 0 ? ['knowledge_base'] : []
      }
    });

    await Promise.all([userMessage.save(), agentMessage.save()]);

    // Update agent's conversation count and last active
    await (agent as any).incrementConversations();
    await (agent as any).updateLastActive();

    const chatResponse: ChatResponse = {
      message: response,
      sessionId: finalSessionId,
      agentId,
      timestamp: new Date(),
      metadata: {
        responseTime,
        tokensUsed: response.length,
        confidence: context.length > 0 ? 0.8 : 0.5,
        sources: context.length > 0 ? ['knowledge_base'] : []
      }
    };

    res.json(chatResponse);
    return;

  } catch (error: unknown) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : String(error)
    });
    return;
  }
});

/**
 * @swagger
 * /api/chat/sessions:
 *   get:
 *     summary: Get chat sessions for a user
 *     description: Retrieve all chat sessions for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *         description: Filter sessions by agent ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of sessions to return
 *     responses:
 *       200:
 *         description: Chat sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sessionId:
 *                     type: string
 *                   agentId:
 *                     type: string
 *                   agentName:
 *                     type: string
 *                   messageCount:
 *                     type: number
 *                   lastMessage:
 *                     type: string
 *                   lastActivity:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any).id;
    const { agentId, limit = 20 } = req.query;

    const matchQuery: any = { userId };
    if (agentId) {
      matchQuery.agentId = agentId;
    }

    const sessions = await ChatMessage.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$sessionId',
          agentId: { $first: '$agentId' },
          messageCount: { $sum: 1 },
          lastMessage: { $last: '$content' },
          lastActivity: { $max: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'agents',
          localField: 'agentId',
          foreignField: '_id',
          as: 'agent'
        }
      },
      {
        $addFields: {
          agentName: { $arrayElemAt: ['$agent.name', 0] }
        }
      },
      {
        $project: {
          sessionId: '$_id',
          agentId: 1,
          agentName: 1,
          messageCount: 1,
          lastMessage: 1,
          lastActivity: 1,
          _id: 0
        }
      },
      { $sort: { lastActivity: -1 } },
      { $limit: parseInt(limit as string) }
    ]);

    res.json(sessions);
    return;

  } catch (error: unknown) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chat sessions',
      details: error instanceof Error ? error.message : String(error)
    });
    return;
  }
});

/**
 * @swagger
 * /api/chat/sessions/{sessionId}:
 *   get:
 *     summary: Get messages for a specific chat session
 *     description: Retrieve all messages in a specific chat session
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session identifier
 *     responses:
 *       200:
 *         description: Chat messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [user, agent]
 *                   content:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   metadata:
 *                     type: object
 *       404:
 *         description: Session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const userId = (req.user as any).id;

    const messages = await ChatMessage.find({ 
      sessionId, 
      userId 
    }).sort({ timestamp: 1 });

    if (messages.length === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(messages);
    return;

  } catch (error: unknown) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chat messages',
      details: error instanceof Error ? error.message : String(error)
    });
    return;
  }
});

export default router;