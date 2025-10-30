
import { Request, Response } from 'express';
import Agent from '../models/Agent';
import ChatMessage from '../models/ChatMessage';
import AIService from '../services/aiService'; // Import the AI Service
import logger from '../utils/logger';

export const getChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).id;
        const { sessionId } = req.params;
        const chatHistory = await ChatMessage.find({ userId, sessionId }).sort({ timestamp: 1 });
        res.status(200).json(chatHistory);
        return;
    } catch (error) {
        logger.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
};

export const postChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).id;
        const { sessionId, message, agentId } = req.body;

        // Verify agent belongs to user
        const agent = await Agent.findOne({ _id: agentId, userId });
        if (!agent) {
            res.status(404).json({ message: 'Agent not found' });
            return;
        }

        // Save user message
        await ChatMessage.create({
            sessionId,
            type: 'user',
            content: message,
            userId,
            agentId,
        });

        logger.info(`Received message for agent ${agentId} in session ${sessionId}: ${message}`);

        // Generate agent response using the AI Service
        const systemPrompt = `You are ${agent.name}, a ${agent.type} AI with a ${agent.tone} tone. Description: ${agent.description}`;
        const agentResponseText = await AIService.generateResponse(String(agent._id), message, systemPrompt);

        // Save agent response
        await ChatMessage.create({
            sessionId,
            type: 'agent',
            content: agentResponseText,
            userId,
            agentId,
        });

        res.status(200).json({ reply: agentResponseText });
        return;
    } catch (error) {
        logger.error('Error posting chat message:', error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
};
