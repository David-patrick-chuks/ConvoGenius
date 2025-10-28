import crypto from 'crypto';
import AIService from '../services/aiService';
import OAuth from 'oauth-1.0a';
import axios from 'axios';
import logger from '../utils/logger';
import { IConnector } from './IConnector';

export class TwitterConnector implements IConnector {
    async deploy(deployment: any): Promise<void> {
        
        const { consumerKey, consumerSecret, accessToken, accessSecret, postingFrequency } = deployment.config;

        if (!consumerKey || !consumerSecret || !accessToken || !accessSecret) {
            logger.error('Twitter deployment configuration missing OAuth credentials');
            throw new Error('Twitter deployment configuration missing OAuth credentials');
        }

        logger.info('Twitter agent deployed with provided OAuth credentials.');
        // In a real scenario, you might verify the credentials or set up scheduled tasks based on postingFrequency.
    }

    async handleWebhook(payload: any, deployment: any, headers?: Record<string, any>, rawBody?: string): Promise<void> {
        // Optional: Verify Twitter CRC challenge
        if (payload.crc_token) {
            const consumerSecret = deployment.config.consumerSecret;
            const hash = crypto.createHmac('sha256', consumerSecret).update(payload.crc_token).digest('base64');
            logger.info('Respond with response_token=sha256=' + hash);
            return;
        }

        logger.info('Received Twitter webhook payload:', payload);

        // Example: respond to mentions (pseudo-structure)
        const mention = payload.tweet_create_events?.[0];
        if (mention && mention.text) {
            const text = mention.text;
            const reply = await AIService.generateResponse(text);
            // Post reply via Twitter API v2 using OAuth 1.0a
            const { consumerKey, consumerSecret, accessToken, accessSecret } = deployment.config;
            const oauth = new OAuth({
                consumer: { key: consumerKey, secret: consumerSecret },
                signature_method: 'HMAC-SHA1',
                hash_function(base_string, key) {
                    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
                }
            });
            const url = 'https://api.twitter.com/2/tweets';
            const data = {
                text: reply,
                reply: { in_reply_to_tweet_id: mention.id_str }
            };
            const requestData = { url, method: 'POST' as const };
            const headers = oauth.toHeader(oauth.authorize(requestData, { key: accessToken, secret: accessSecret }));
            await axios.post(url, data, { headers: { ...headers, 'Content-Type': 'application/json' } });
            logger.info('Replied to mention via Twitter API');
        }
    }
}