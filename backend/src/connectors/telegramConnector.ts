
import axios from 'axios';
import AIService from '../services/aiService';
import logger from '../utils/logger';
import { IConnector } from './IConnector';

export class TelegramConnector implements IConnector {
    async deploy(deployment: any): Promise<void> {
        
        const { botToken } = deployment.config;

        if (!botToken) {
            logger.error('Telegram deployment configuration missing botToken');
            throw new Error('Telegram deployment configuration missing botToken');
        }

        const webhookUrl = `${process.env.BACKEND_URL}/api/webhooks/telegram/${deployment._id}`;

        try {
            // Set the webhook for the Telegram bot
            await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
                url: webhookUrl,
            });
            logger.info(`Telegram bot deployed and webhook set to ${webhookUrl}`);
        } catch (error) {
            logger.error('Error setting Telegram webhook:', error);
            throw new Error('Failed to set Telegram webhook');
        }
    }

    async handleWebhook(payload: any, deployment: any): Promise<void> {
        logger.info('Received Telegram webhook payload:', payload);

        try {
            const message = payload.message;
            if (!message || !message.text || !message.chat || !message.chat.id) {
                logger.warn('Invalid Telegram webhook payload: Missing message, text, or chat info.', payload);
                return; // Nothing to process
            }

            const chatId = message.chat.id;
            const userMessage = message.text;

            const botToken = deployment.config.botToken; // Retrieve botToken from deployment config

            if (!botToken) {
                logger.error('Telegram bot token not found in deployment config for handling webhook.');
                return;
            }

            // Generate AI response
            const aiResponse = await AIService.generateResponse(userMessage);

            // Send response back to Telegram
            await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                chat_id: chatId,
                text: aiResponse,
            });
            logger.info(`Sent Telegram response to chat ${chatId}: ${aiResponse}`);

        } catch (error) {
            logger.error('Error handling Telegram webhook:', error);
        }
    }
}
