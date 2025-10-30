import Memory from '../models/Memory';
import logger from '../utils/logger';
import { embedText, generateWithContext } from './geminiService';

class AIService {
    // Overloads for backward compatibility
    async generateResponse(message: string): Promise<string>;
    async generateResponse(agentId: string, message: string, systemPrompt?: string): Promise<string>;
    async generateResponse(arg1: string, arg2?: string, arg3?: string): Promise<string> {
        // Determine call form
        const isSimpleCall = arg2 === undefined; // generateResponse(message)
        const agentId = isSimpleCall ? '' : arg1;
        const message = isSimpleCall ? arg1 : (arg2 as string);
        const systemPrompt = isSimpleCall ? undefined : arg3;
        logger.info(`AI Service received message: ${message}`);

        // Fallback general response if no context available
        const defaultResponse = 'I can help with your questions. Could you provide more details?';

        try {
            // Compute embedding for message
            const queryEmbedding = await embedText(message);
            // Retrieve top similar memories for this agent (if provided)
            const similar = agentId ? await (Memory as any).findSimilar(agentId, queryEmbedding, 5) : [];
            const context = Array.isArray(similar) ? similar.map((m: any) => m.text) : [];
            if (context.length === 0) {
                return defaultResponse;
            }
            const reply = await generateWithContext(context, message, { name: 'CortexDesk Assistant', tone: 'friendly', systemPrompt });
            return reply || defaultResponse;
        } catch (err) {
            logger.error('AIService error generating response:', err);
            return defaultResponse;
        }
    }
}

export default new AIService();
