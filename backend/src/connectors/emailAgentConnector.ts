import logger from '../utils/logger';
import { IConnector } from './IConnector';

export class EmailAgentConnector implements IConnector {
    async deploy(deployment: any): Promise<void> {
        
        const { smtpCredentials, mailchimpKey, brevoKey, senderInfo } = deployment.config;

        if (!smtpCredentials && !mailchimpKey && !brevoKey) {
            logger.error('Email Agent deployment configuration missing credentials (SMTP, Mailchimp, or Brevo)');
            throw new Error('Email Agent deployment configuration missing credentials (SMTP, Mailchimp, or Brevo)');
        }

        logger.info('Email Agent deployed with provided credentials.');
        // In a real scenario, you might verify credentials or set up sender profiles.
    }

    async handleWebhook(payload: any, deployment: any, headers?: Record<string, any>): Promise<void> {
        // Brevo (Sendinblue) webhook handling
        const provider = payload?.event ? 'brevo' : undefined;

        if (provider === 'brevo') {
            // Optional: verify Brevo signature if enabled (Brevo provides a key in dashboard)
            logger.info('Processing Brevo webhook');
            const event = payload.event; // delivered, opened, clicked, hard_bounce, soft_bounce, spam, unsubscribed, invalid_email, deferred
            const email = payload.email;
            const messageId = payload.messageId || payload['message-id'];
            const reason = payload.reason || payload['reason'] || payload.error;

            switch (event) {
                case 'hard_bounce':
                case 'invalid_email':
                    // mark contact as invalid in your DB
                    logger.warn(`Brevo hard bounce for ${email} msg=${messageId} reason=${reason}`);
                    break;
                case 'soft_bounce':
                case 'deferred':
                    logger.warn(`Brevo soft bounce/deferred for ${email} msg=${messageId} reason=${reason}`);
                    break;
                case 'spam':
                case 'unsubscribed':
                    logger.warn(`Brevo complaint/unsubscribe for ${email}`);
                    break;
                case 'opened':
                case 'clicked':
                case 'delivered':
                    logger.info(`Brevo ${event} for ${email}`);
                    break;
                default:
                    logger.info(`Brevo event ${event} received`);
            }

            // Handle inbound replies via separate inbound parsing service if configured
            return;
        }

        logger.info('Received Email Agent webhook payload (unknown provider):', payload);
    }
}