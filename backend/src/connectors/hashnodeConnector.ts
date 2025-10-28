import { IConnector } from './IConnector';
import logger from '../utils/logger';
import AIService from '../services/aiService';
import axios from 'axios';

export class HashnodeConnector implements IConnector {
    async deploy(deployment: any): Promise<void> {
        
        const { hashnodeApiKey, publicationId, contentTemplate } = deployment.config;

        if (!hashnodeApiKey || !publicationId) {
            logger.error('Hashnode deployment configuration missing API key or publication ID');
            throw new Error('Hashnode deployment configuration missing API key or publication ID');
        }

        // Placeholder for API key and publication ID verification
        // In a real scenario, you would make a test API call to Hashnode
        // to verify the credentials and publication access.
    
        logger.info(`Hashnode agent deployed for publication ${publicationId}.`);
    }

    async handleWebhook(payload: any, deployment: any): Promise<void> {
        logger.info('Received Hashnode webhook payload:', payload);

        try {
            // Hashnode webhooks typically notify about events like new posts, post updates, or comments.
            // The structure of the payload would depend on the specific event.
            // For this example, let's assume we are interested in new comments.

            const eventType = payload.event;
            const commentContent = payload.comment?.content?.markdown;
            const postId = payload.post?.id;
            const commentId = payload.comment?.id;

            if (eventType === 'COMMENT_CREATED' && commentContent && postId && commentId) {
                logger.info(`New comment on Hashnode post ${postId}: ${commentContent}`);

                // Generate AI response/analysis for the comment
                const aiAnalysis = await AIService.generateResponse(`Analyze this Hashnode comment: ${commentContent}`);

                logger.info(`AI analysis for Hashnode comment ${commentId}: ${aiAnalysis}`);

                // Reply to the comment via Hashnode GraphQL API
                const apiKey = deployment.config.hashnodeApiKey;
                const mutation = `mutation($input: PublishCommentInput!) { publishComment(input: $input) { comment { id } } }`;
                const variables = {
                    input: {
                        parentId: commentId,
                        postId,
                        contentMarkdown: aiAnalysis
                    }
                };
                await axios.post('https://gql.hashnode.com', { query: mutation, variables }, {
                    headers: { 'Content-Type': 'application/json', Authorization: apiKey }
                });

            } else {
                logger.warn('Unsupported or incomplete Hashnode webhook payload.', payload);
            }

        } catch (error) {
            logger.error('Error handling Hashnode webhook:', error);
        }
    }

    // Helper to create a new post using deployment's template
    async createPost(deployment: any, title: string, contentMarkdown: string): Promise<string> {
        const apiKey = deployment.config.hashnodeApiKey;
        const publicationId = deployment.config.publicationId;
        const mutation = `mutation($input: PublishPostInput!) { publishPost(input: $input) { post { id } } }`;
        const variables = {
            input: {
                publicationId,
                title,
                contentMarkdown,
                tags: []
            }
        };
        const res = await axios.post('https://gql.hashnode.com', { query: mutation, variables }, {
            headers: { 'Content-Type': 'application/json', Authorization: apiKey }
        });
        return res.data?.data?.publishPost?.post?.id;
    }
}