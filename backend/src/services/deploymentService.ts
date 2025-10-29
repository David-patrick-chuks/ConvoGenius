
import { IConnector } from '../connectors/IConnector';
import { DiscordConnector } from '../connectors/discordConnector';
import { EmailAgentConnector } from '../connectors/emailAgentConnector';
import { HashnodeConnector } from '../connectors/hashnodeConnector';
import { NotionConnector } from '../connectors/notionConnector';
import { SlackConnector } from '../connectors/slackConnector';
import { TelegramConnector } from '../connectors/telegramConnector';
import { TwitterConnector } from '../connectors/twitterConnector';
import { WebsiteEmbedConnector } from '../connectors/websiteEmbedConnector';
import Agent from '../models/Agent';
import Deployment from '../models/Deployment';
import logger from '../utils/logger';

class DeploymentService {
    private connectors: { [key: string]: IConnector } = {};

    constructor() {
        this.connectors['discord'] = new DiscordConnector();
        this.connectors['email'] = new EmailAgentConnector();
        this.connectors['hashnode'] = new HashnodeConnector();
        this.connectors['notion'] = new NotionConnector();
        this.connectors['slack'] = new SlackConnector();
        this.connectors['telegram'] = new TelegramConnector();
        this.connectors['twitter'] = new TwitterConnector();
        this.connectors['websiteEmbed'] = new WebsiteEmbedConnector();
    }

    async deploy(deploymentId: string) {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            throw new Error('Deployment not found');
        }

        const agent = await Agent.findById((deployment as any).agentId);
        if (!agent) {
            throw new Error('Agent not found');
        }

        
        if (agent.status !== 'trained') {
            throw new Error('Agent is not trained');
        }

        const connector = this.connectors[deployment.platform];
        if (!connector) {
            throw new Error(`Connector for platform ${deployment.platform} not found`);
        }

        try {
            await connector.deploy(deployment);
            (deployment as any).status = 'active';
            await (deployment as any).save();
        } catch (error) {
            (deployment as any).status = 'error';
            await (deployment as any).save();
            throw error;
        }
    }

    async handleWebhook(platform: string, deploymentId: string, payload: any, headers?: Record<string, any>, rawBody?: string): Promise<void> {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            logger.error(`Webhook received for unknown deployment ID: ${deploymentId}`);
            throw new Error('Deployment not found');
        }

        if (deployment.platform !== platform) {
            logger.error(`Webhook platform mismatch for deployment ${deploymentId}: Expected ${deployment.platform}, got ${platform}`);
            throw new Error('Platform mismatch');
        }

        const connector = this.connectors[platform];
        if (!connector) {
            logger.error(`No connector found for platform: ${platform}`);
            throw new Error(`Connector for platform ${platform} not found`);
        }

        try {
            await connector.handleWebhook(payload, deployment, headers, rawBody);
            logger.info(`Webhook handled successfully for deployment ${deploymentId} on platform ${platform}`);
        } catch (error) {
            logger.error(`Error handling webhook for deployment ${deploymentId} on platform ${platform}:`, error);
            throw error;
        }
    }
}

export default new DeploymentService();
