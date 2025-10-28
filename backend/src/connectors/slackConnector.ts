import axios from 'axios';
import crypto from 'crypto';
import AIService from '../services/aiService';
import logger from '../utils/logger';
import { IConnector } from './IConnector';

export class SlackConnector implements IConnector {
    async deploy(deployment: any): Promise<void> {
        
        const { accessToken, teamId } = deployment.config;

        if (!accessToken || !teamId) {
            logger.error('Slack deployment configuration missing accessToken or teamId');
            throw new Error('Slack deployment configuration missing accessToken or teamId');
        }

        logger.info(`Slack app deployed for team ${teamId} with token ${accessToken.substring(0, 5)}...`);
        // In a real scenario, you would use the accessToken to configure the Slack app,
        // e.g., subscribe to events, set up slash commands, etc.
        // For now, we'll consider it deployed if the token is present.
    }

    async handleWebhook(payload: any, deployment: any, headers?: Record<string, any>, rawBody?: string): Promise<void> {
        // Verify Slack signature
        const signingSecret = deployment.config.signingSecret;
        if (!signingSecret) {
            logger.error('Slack signing secret missing in deployment config');
            throw new Error('Missing Slack signing secret');
        }

        const timestamp = headers?.['x-slack-request-timestamp'];
        const signature = headers?.['x-slack-signature'];

        if (!timestamp || !signature || !rawBody) {
            logger.warn('Missing Slack signature headers or raw body');
            throw new Error('Invalid Slack webhook');
        }

        // Prevent replay attacks (5 minutes window)
        const fiveMinutes = 60 * 5;
        if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)) > fiveMinutes) {
            throw new Error('Slack request timestamp out of range');
        }

        const baseString = `v0:${timestamp}:${rawBody}`;
        const hmac = crypto.createHmac('sha256', signingSecret).update(baseString).digest('hex');
        const expectedSignature = `v0=${hmac}`;

        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            throw new Error('Slack signature verification failed');
        }

        // Handle Slack URL verification challenge
        if (payload.type === 'url_verification' && payload.challenge) {
            logger.info('Slack URL verification received');
            return;
        }

        // Handle events
        if (payload.type === 'event_callback') {
            const event = payload.event;
            if (event && event.type === 'app_mention') {
                const text: string = event.text || '';
                const channel: string = event.channel;
                const accessToken: string = deployment.config.accessToken;

                if (!accessToken) {
                    throw new Error('Slack access token missing');
                }

                const aiResponse = await AIService.generateResponse(text);
                await axios.post('https://slack.com/api/chat.postMessage', {
                    channel,
                    text: aiResponse
                }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                logger.info(`Sent Slack response to channel ${channel}`);
            }
        }
    }
}