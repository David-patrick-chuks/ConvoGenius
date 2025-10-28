
import { Request, Response } from 'express';
import ChatMessage from '../models/ChatMessage';
import logger from '../utils/logger';
import AIService from '../services/aiService'; // Import the AI Service

export const getChat = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const { chatId } = req.params; // Assuming chat ID is passed as a parameter

        const chatHistory = await ChatMessage.find({ userId, chatId }).sort({ timestamp: 1 });
        res.status(200).json(chatHistory);
    } catch (error) {
        logger.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const postChat = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const { chatId, message, agentId } = req.body;

        // Save user message
        await ChatMessage.create({
            chatId,
            sender: 'user',
            message,
            userId,
            agentId,
        });

        logger.info(`Received message for agent ${agentId} in chat ${chatId}: ${message}`);

        // Generate agent response using the AI Service
        const agentResponseText = await AIService.generateResponse(message);

        // Save agent response
        await ChatMessage.create({
            chatId,
            sender: 'agent',
            message: agentResponseText,
            userId,
            agentId,
        });

        res.status(200).json({ reply: agentResponseText });
    } catch (error) {
        logger.error('Error posting chat message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
