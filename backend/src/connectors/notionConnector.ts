import { Client as NotionClient } from '@notionhq/client';
import logger from '../utils/logger';
import { IConnector } from './IConnector';

export class NotionConnector implements IConnector {
    async deploy(deployment: any): Promise<void> {
        
        const { notionAccessToken, databaseId, pageId } = deployment.config;

        if (!notionAccessToken || (!databaseId && !pageId)) {
            logger.error('Notion deployment configuration missing access token or target (databaseId/pageId)');
            throw new Error('Notion deployment configuration missing access token or target (databaseId/pageId)');
        }

        const notion = new NotionClient({ auth: notionAccessToken });
        // Minimal verification call
        if (databaseId) {
            await notion.databases.retrieve({ database_id: databaseId });
        } else if (pageId) {
            await notion.pages.retrieve({ page_id: pageId });
        }
        logger.info(`Notion agent deployed with verified access to ${databaseId ? 'database ' + databaseId : 'page ' + pageId}.`);
    }

    async handleWebhook(payload: any): Promise<void> {
        // Process Notion change events (e.g., page updated) as needed
        logger.info('Received Notion webhook payload:', payload);
    }
}