
import { Client, GatewayIntentBits } from 'discord.js';
import nacl from 'tweetnacl';
import AIService from '../services/aiService';
import logger from '../utils/logger';
import { IConnector } from './IConnector';

export class DiscordConnector implements IConnector {
    private client: Client | null = null;

    async deploy(deployment: any): Promise<void> {
        const { botToken, guildId } = deployment.config;

        if (!botToken || !guildId) {
            logger.error('Discord deployment configuration missing botToken or guildId');
            throw new Error('Discord deployment configuration missing botToken or guildId');
        }

        // Initialize Discord client (only once per deployment)
        if (!this.client) {
            this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
            this.client.login(botToken);
            this.client.on('ready', () => {
                logger.info(`Discord bot logged in as ${this.client?.user?.tag}!`);
            });
            this.client.on('error', (error) => {
                logger.error('Discord client error:', error);
            });
        }

        logger.info(`Discord bot deployed to guild ${guildId} with token ${botToken.substring(0, 5)}...`);
        // In a real scenario, you would use the botToken to configure the Discord bot,
        // e.g., register slash commands, set up event listeners, etc.
        // For now, we'll consider it deployed if the token is present.
    }

    async handleWebhook(payload: any, deployment: any, headers?: Record<string, any>, rawBody?: string): Promise<any> {
        logger.info('Received Discord webhook payload:', payload);

        // Verify Discord signature for interactions
        const signature = headers?.['x-signature-ed25519'];
        const timestamp = headers?.['x-signature-timestamp'];
        const publicKey = deployment.config.publicKey;
        if (!signature || !timestamp || !rawBody || !publicKey) {
            throw new Error('Missing Discord signature headers or public key');
        }
        const isValid = nacl.sign.detached.verify(
            Buffer.from(timestamp + rawBody),
            Buffer.from(signature, 'hex'),
            Buffer.from(publicKey, 'hex')
        );
        if (!isValid) {
            throw new Error('Invalid Discord signature');
        }

        try {
            // PING
            if (payload.type === 1) {
                return { type: 1 };
            }
            // APPLICATION_COMMAND (slash command)
            if (payload.type === 2) {
                const messageText = payload.data?.options?.[0]?.value || payload.data?.name || '';
                const aiResponse = await AIService.generateResponse(messageText);
                return { type: 4, data: { content: aiResponse } };
            }

            // Fallback to posting via bot
            const message = payload.data?.options?.[0]?.value || payload.data?.name || payload.content;
            const channelId = payload.channel_id || payload.data?.channel_id;
            const userId = payload.member?.user?.id || payload.user?.id;

            if (!message || !channelId || !userId) {
                logger.warn('Invalid Discord webhook payload: Missing message, channelId, or userId.', payload);
                return;
            }

            const aiResponse = await AIService.generateResponse(message);
            if (this.client && this.client.isReady()) {
                const channel = await this.client.channels.fetch(channelId);
                if (channel?.isTextBased() && 'send' in channel) {
                    await (channel as any).send(aiResponse);
                    logger.info(`Sent Discord response to channel ${channelId}: ${aiResponse}`);
                }
            } else {
                logger.error('Discord client not ready to send message.');
            }

        } catch (error) {
            logger.error('Error handling Discord webhook:', error);
        }
    }
}
