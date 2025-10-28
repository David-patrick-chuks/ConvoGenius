import { trainingQueue } from '../services/queueService';
import logger from '../utils/logger';
import TrainJob from '../models/TrainJob';
import Memory from '../models/Memory';
import { chunkText, generateContentHash, getContentVersion } from '../utils/chunkText';
import { embedText } from '../services/geminiService';

// Minimal worker that logs and could later move full processing here
trainingQueue.process('train-agent', async (job) => {
    logger.info(`Worker processing train-agent job ${job.id}`);
    // This hook is ready for full migration of training logic from HTTP route
    return true;
});

trainingQueue.on('active', (job) => logger.info(`Training job active: ${job.id}`));
trainingQueue.on('stalled', (job) => logger.warn(`Training job stalled: ${job.id}`));
trainingQueue.on('error', (err) => logger.error('Training queue error', err));

import { Job } from 'bull';
import { ITrainingJob } from '../types';
import Agent from '../models/Agent';
import Resource from '../models/Resource';
import logger from '../utils/logger';

export class TrainingWorker {
    /**
     * Process agent training job
     */
    static async processTrainingJob(job: Job<ITrainingJob>) {
        const { agentId, userId, resources, priority } = job.data;
        
        try {
            logger.info(`Starting training for agent ${agentId}`);
            
            // Update job progress
            await job.progress(10);
            
            // Find the agent
            const agent = await Agent.findById(agentId);
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }

            // Update agent status to training
            agent.status = 'training';
            await agent.save();

            await job.progress(20);

            // Process resources if provided
            if (resources && resources.length > 0) {
                logger.info(`Processing ${resources.length} resources for training`);
                
                for (let i = 0; i < resources.length; i++) {
                    const resourceId = resources[i];
                    const resource = await Resource.findById(resourceId);
                    
                    if (resource && resource.status === 'processed') {
                        // Add resource to agent sources
                        agent.sources.push({
                            _id: resource._id,
                            name: resource.name,
                            type: resource.type,
                            size: this.formatFileSize(resource.size),
                            uploadDate: resource.uploadDate,
                            status: 'processed',
                            url: resource.url,
                            content: resource.metadata?.extractedText
                        });
                    }
                    
                    // Update progress
                    const progress = 20 + ((i + 1) / resources.length) * 40;
                    await job.progress(Math.min(progress, 60));
                }
            }

            await job.progress(70);

            // Simulate AI training process
            // In a real implementation, this would involve:
            // 1. Sending data to AI training service
            // 2. Processing documents and conversations
            // 3. Fine-tuning the model
            // 4. Validating the trained model
            
            logger.info(`Training AI model for agent ${agentId}`);
            
            // Simulate training time based on priority
            const trainingTime = priority === 'high' ? 2000 : priority === 'normal' ? 5000 : 10000;
            await this.sleep(trainingTime);

            await job.progress(90);

            // Update agent status to trained
            agent.status = 'trained';
            agent.lastActive = new Date();
            await agent.save();

            await job.progress(100);

            logger.info(`Training completed for agent ${agentId}`);
            
            return {
                success: true,
                agentId,
                message: 'Agent training completed successfully'
            };

        } catch (error) {
            logger.error(`Training failed for agent ${agentId}:`, error);
            
            // Update agent status to failed
            const agent = await Agent.findById(agentId);
            if (agent) {
                agent.status = 'failed';
                await agent.save();
            }
            
            throw error;
        }
    }

    /**
     * Format file size in human readable format
     */
    private static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Sleep utility function
     */
    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
