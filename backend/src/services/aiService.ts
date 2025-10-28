import Memory from '../models/Memory';
import logger from '../utils/logger';
import { embedText, generateWithContext } from './geminiService';

class AIService {
    async generateResponse(message: string): Promise<string> {
        logger.info(`AI Service received message: ${message}`);

        // Fallback general response if no context available
        const defaultResponse = 'I can help with your questions. Could you provide more details?';

        try {
            // Compute embedding for message
            const queryEmbedding = await embedText(message);
            // Retrieve top similar memories across all agents (or scope by agent if provided later)
            const similar = await Memory.findSimilar(undefined as any, queryEmbedding, 5);
            const context = Array.isArray(similar) ? similar.map((m: any) => m.text) : [];
            if (context.length === 0) {
                return defaultResponse;
            }
            const reply = await generateWithContext(context, message, { name: 'CortexDesk Assistant', tone: 'friendly' });
            return reply || defaultResponse;
        } catch (err) {
            logger.error('AIService error generating response:', err);
            return defaultResponse;
        }
    }
}

export default new AIService();
