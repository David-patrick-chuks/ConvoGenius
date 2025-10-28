import Queue from 'bull';
import Redis from 'ioredis';
import { ITrainingJob, IDeploymentJob } from '../types';
import logger from '../utils/logger';

// Redis connection
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
});

// Queue configurations
const queueOptions = {
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
};

// Create queues
export const trainingQueue = new Queue('agent training', queueOptions);
export const deploymentQueue = new Queue('agent deployment', queueOptions);
export const resourceProcessingQueue = new Queue('resource processing', queueOptions);
export const notificationQueue = new Queue('notifications', queueOptions);

// Training Queue Jobs
export class TrainingQueueService {
    /**
     * Add agent training job
     */
    static async addTrainingJob(jobData: ITrainingJob) {
        try {
            const job = await trainingQueue.add('train-agent', jobData, {
                priority: jobData.priority === 'high' ? 1 : jobData.priority === 'normal' ? 5 : 10,
                delay: 0,
            });

            logger.info(`Training job added: ${job.id} for agent ${jobData.agentId}`);
            return job;
        } catch (error) {
            logger.error('Error adding training job:', error);
            throw error;
        }
    }

    /**
     * Get training job status
     */
    static async getJobStatus(jobId: string) {
        try {
            const job = await trainingQueue.getJob(jobId);
            if (!job) {
                return null;
            }

            return {
                id: job.id,
                data: job.data,
                progress: job.progress(),
                state: await job.getState(),
                returnvalue: job.returnvalue,
                failedReason: job.failedReason,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
            };
        } catch (error) {
            logger.error('Error getting job status:', error);
            throw error;
        }
    }

    /**
     * Cancel training job
     */
    static async cancelJob(jobId: string) {
        try {
            const job = await trainingQueue.getJob(jobId);
            if (job) {
                await job.remove();
                logger.info(`Training job cancelled: ${jobId}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error cancelling job:', error);
            throw error;
        }
    }
}

// Deployment Queue Jobs
export class DeploymentQueueService {
    /**
     * Add deployment job
     */
    static async addDeploymentJob(jobData: IDeploymentJob) {
        try {
            const job = await deploymentQueue.add('deploy-agent', jobData, {
                priority: 1,
                delay: 0,
            });

            logger.info(`Deployment job added: ${job.id} for agent ${jobData.agentId}`);
            return job;
        } catch (error) {
            logger.error('Error adding deployment job:', error);
            throw error;
        }
    }

    /**
     * Add undeployment job
     */
    static async addUndeploymentJob(jobData: IDeploymentJob) {
        try {
            const job = await deploymentQueue.add('undeploy-agent', jobData, {
                priority: 1,
                delay: 0,
            });

            logger.info(`Undeployment job added: ${job.id} for agent ${jobData.agentId}`);
            return job;
        } catch (error) {
            logger.error('Error adding undeployment job:', error);
            throw error;
        }
    }

    /**
     * Get deployment job status
     */
    static async getJobStatus(jobId: string) {
        try {
            const job = await deploymentQueue.getJob(jobId);
            if (!job) {
                return null;
            }

            return {
                id: job.id,
                data: job.data,
                progress: job.progress(),
                state: await job.getState(),
                returnvalue: job.returnvalue,
                failedReason: job.failedReason,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
            };
        } catch (error) {
            logger.error('Error getting deployment job status:', error);
            throw error;
        }
    }
}

// Resource Processing Queue Jobs
export class ResourceProcessingQueueService {
    /**
     * Add resource processing job
     */
    static async addProcessingJob(resourceId: string, userId: string, filePath: string) {
        try {
            const job = await resourceProcessingQueue.add('process-resource', {
                resourceId,
                userId,
                filePath,
            }, {
                priority: 5,
                delay: 0,
            });

            logger.info(`Resource processing job added: ${job.id} for resource ${resourceId}`);
            return job;
        } catch (error) {
            logger.error('Error adding resource processing job:', error);
            throw error;
        }
    }

    /**
     * Get processing job status
     */
    static async getJobStatus(jobId: string) {
        try {
            const job = await resourceProcessingQueue.getJob(jobId);
            if (!job) {
                return null;
            }

            return {
                id: job.id,
                data: job.data,
                progress: job.progress(),
                state: await job.getState(),
                returnvalue: job.returnvalue,
                failedReason: job.failedReason,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
            };
        } catch (error) {
            logger.error('Error getting processing job status:', error);
            throw error;
        }
    }
}

// Notification Queue Jobs
export class NotificationQueueService {
    /**
     * Add notification job
     */
    static async addNotificationJob(userId: string, type: string, data: any) {
        try {
            const job = await notificationQueue.add('send-notification', {
                userId,
                type,
                data,
            }, {
                priority: 10,
                delay: 0,
            });

            logger.info(`Notification job added: ${job.id} for user ${userId}`);
            return job;
        } catch (error) {
            logger.error('Error adding notification job:', error);
            throw error;
        }
    }
}

// Queue event listeners
trainingQueue.on('completed', (job) => {
    logger.info(`Training job completed: ${job.id}`);
});

trainingQueue.on('failed', (job, err) => {
    logger.error(`Training job failed: ${job.id}`, err);
});

deploymentQueue.on('completed', (job) => {
    logger.info(`Deployment job completed: ${job.id}`);
});

deploymentQueue.on('failed', (job, err) => {
    logger.error(`Deployment job failed: ${job.id}`, err);
});

resourceProcessingQueue.on('completed', (job) => {
    logger.info(`Resource processing job completed: ${job.id}`);
});

resourceProcessingQueue.on('failed', (job, err) => {
    logger.error(`Resource processing job failed: ${job.id}`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('Shutting down queues...');
    await Promise.all([
        trainingQueue.close(),
        deploymentQueue.close(),
        resourceProcessingQueue.close(),
        notificationQueue.close(),
    ]);
    await redis.quit();
    logger.info('Queues shut down successfully');
});

export { redis };
