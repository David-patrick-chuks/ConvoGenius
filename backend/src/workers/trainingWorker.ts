import Memory from '../models/Memory';
import TrainJob from '../models/TrainJob';
import { embedText } from '../services/geminiService';
import { trainingQueue } from '../services/queueService';
import { GeminiAudioTranscriber } from '../utils/audioTranscribe';
import { chunkText, generateContentHash, getContentVersion } from '../utils/chunkText';
import logger from '../utils/logger';
import { scrapeAllRoutes } from '../utils/scrapeWebsite';
import { VideoProcessor } from '../utils/videoProcess';
import { cleanTranscript, fetchYouTubeTranscript, summarizeYouTubeVideoWithGemini } from '../utils/youtubeTranscript';

// Minimal worker that logs and could later move full processing here
trainingQueue.process('train-agent', async (job) => {
    logger.info(`Worker processing train-agent job ${job.id}`);
    // Find most recent queued TrainJob and process using full pipeline
    const queuedJob = await TrainJob.findOne({ status: 'queued' }).sort({ createdAt: 1 });
    if (!queuedJob) {
        logger.warn('No queued TrainJob found');
        return true;
    }

    const jobId = queuedJob.jobId;
    const { agentId } = queuedJob as any;
    const payload = (queuedJob.result as any)?.payload || {};
    const { text, source, sourceUrl, sourceMetadata, fileType } = payload;
    const filesInfo = (queuedJob.result as any)?.filesInfo || [];

    await TrainJob.findOneAndUpdate({ jobId }, { status: 'processing', progress: 0, error: null });

    let trainingText = '';
    let usedFiles = filesInfo.length > 0;
    const fileNames: string[] = filesInfo.map((f: any) => f.originalname);

    try {
        if (source === 'website' && sourceUrl) {
            const websiteResult = await scrapeAllRoutes(sourceUrl, { firstRouteOnly: true });
            if ((websiteResult as any).success && (websiteResult as any).content) {
                trainingText = (websiteResult as any).content;
            } else if (typeof websiteResult === 'string') {
                trainingText = websiteResult as any;
            } else {
                await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: (websiteResult as any).error, source: 'website', url: sourceUrl } });
                return;
            }
        } else if (source === 'youtube' && sourceUrl) {
            try {
                const rawTranscript = await fetchYouTubeTranscript(sourceUrl);
                trainingText = cleanTranscript(rawTranscript);
            } catch (ytError: any) {
                if (ytError.message?.includes('Transcript is disabled') || ytError.message?.includes('unavailable or empty')) {
                    const summary = await summarizeYouTubeVideoWithGemini(sourceUrl);
                    trainingText = summary;
                } else {
                    await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: ytError.message, source: 'youtube', url: sourceUrl } });
                    return;
                }
            }
        } else if (source === 'video' && filesInfo.length > 0) {
            const processor = new VideoProcessor();
            let allText = '';
            for (const f of filesInfo) {
                // Worker does not have buffers; expect future storage integration
                allText += `[Video placeholder content for ${f.originalname}]\n`;
            }
            trainingText = allText;
        } else if (source === 'audio' && filesInfo.length > 0) {
            const transcriber = new GeminiAudioTranscriber();
            let allText = '';
            for (const f of filesInfo) {
                allText += `[Audio placeholder content for ${f.originalname}]\n`;
            }
            trainingText = allText;
        } else if (source === 'document' && filesInfo.length > 0) {
            let allText = '';
            for (const f of filesInfo) {
                const type = (fileType || f.originalname.split('.').pop() || 'txt');
                // Worker lacks direct file buffers; assume processing via separate resource ingestion path
                allText += `[Document placeholder content for ${f.originalname} type=${type}]\n`;
            }
            trainingText = allText;
        } else if (text) {
            trainingText = text;
        }

        if (!trainingText || trainingText.trim().length === 0) {
            await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: 'No valid training text found.' } });
            return true;
        }

        const chunksWithMetadata = chunkText(trainingText);
        if (chunksWithMetadata.length === 0) {
            await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: 'Failed to create chunks.' } });
            return true;
        }

        await TrainJob.findOneAndUpdate({ jobId }, {
            totalChunks: chunksWithMetadata.length,
            fileNames,
            usedFiles,
            chunksProcessed: 0,
            successCount: 0,
            errorCount: 0,
            status: 'processing',
        });

        const entries: any[] = [];
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < chunksWithMetadata.length; i++) {
            try {
                const chunkWithMetadata = chunksWithMetadata[i];
                const chunkTextVal = chunkWithMetadata.text;
                const chunkMetadata = chunkWithMetadata.metadata;
                const contentHash = generateContentHash(chunkTextVal);
                const existingContent = await Memory.findOne({ agentId, contentHash, ...(sourceUrl && { sourceUrl }) });
                if (existingContent) {
                    skippedCount++;
                    continue;
                }
                const contentVersion = await getContentVersion(agentId as any, contentHash, sourceUrl);
                let vector: number[];
                try {
                    vector = await embedText(chunkTextVal);
                } catch {
                    vector = new Array(768).fill(0);
                }
                entries.push({ 
                    agentId, 
                    text: chunkTextVal, 
                    embedding: vector, 
                    source, 
                    sourceUrl, 
                    sourceMetadata,
                    chunkIndex: chunkMetadata.chunkIndex,
                    contentHash,
                    contentVersion,
                    chunkMetadata
                });
                successCount++;
            } catch (e) {
                errorCount++;
            }
            await TrainJob.findOneAndUpdate({ jobId }, {
                chunksProcessed: i + 1,
                progress: Math.round(((i + 1) / chunksWithMetadata.length) * 100),
                successCount,
                errorCount,
                skippedCount
            });
        }

        if (entries.length > 0) {
            await Memory.insertMany(entries);
        }

        await TrainJob.findOneAndUpdate({ jobId }, {
            status: 'completed',
            result: {
                agentId,
                chunksStored: entries.length,
                totalChunks: chunksWithMetadata.length
            }
        });

        return true;
    } catch (err) {
        logger.error('Worker training error:', err);
        await TrainJob.findOneAndUpdate({ jobId: (queuedJob as any).jobId }, { status: 'failed', error: { error: err instanceof Error ? err.message : String(err) } });
        return true;
    }
});

trainingQueue.on('active', (job) => logger.info(`Training job active: ${job.id}`));
trainingQueue.on('stalled', (job) => logger.warn(`Training job stalled: ${job.id}`));
trainingQueue.on('error', (err) => logger.error('Training queue error', err));

import { Job } from 'bull';
import Agent from '../models/Agent';
import Resource from '../models/Resource';
import { ITrainingJob } from '../types';

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

            // Process resources if provided: chunk + embed extractedText into Memory
            if (resources && resources.length > 0) {
                logger.info(`Processing ${resources.length} resources for training`);
                for (let i = 0; i < resources.length; i++) {
                    const resourceId = resources[i];
                    const resource = await Resource.findById(resourceId);
                    if (resource && resource.status === 'processed') {
                        const text = resource.metadata?.extractedText || '';
                        if (text && text.length > 0) {
                            const chunks = chunkText(text);
                            const entries: any[] = [];
                            for (const chunk of chunks) {
                                const chunkTextVal = chunk.text;
                                const contentHash = generateContentHash(chunkTextVal);
                                const existing = await Memory.findOne({ agentId: String(agent._id), contentHash });
                                if (existing) continue;
                                let vector: number[];
                                try {
                                    vector = await embedText(chunkTextVal);
                                } catch {
                                    vector = new Array(768).fill(0);
                                }
                                entries.push({
                                    agentId: String(agent._id),
                                    text: chunkTextVal,
                                    embedding: vector,
                                    source: (resource.type as any),
                                    sourceUrl: resource.url,
                                    sourceMetadata: resource.metadata,
                                    chunkIndex: chunk.metadata.chunkIndex,
                                    contentHash,
                                    contentVersion: 1,
                                    chunkMetadata: chunk.metadata
                                });
                            }
                            if (entries.length > 0) {
                                await Memory.insertMany(entries);
                            }
                            // Track that this resource was used to train this agent
                            await Resource.findByIdAndUpdate(resource._id, { $addToSet: { trainedAgents: agent._id } });
                            // Add resource to agent sources list for UI
                            agent.sources.push({
                                _id: (resource._id as any).toString(),
                                name: resource.name,
                                type: resource.type,
                                size: this.formatFileSize(resource.size),
                                uploadDate: resource.uploadDate,
                                status: 'processed',
                                url: resource.url,
                                content: resource.metadata?.extractedText
                            });
                        }
                    }
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
