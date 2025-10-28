import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import Memory, { IMemory } from '../models/Memory';
import TrainJob from '../models/TrainJob';
import { TrainingQueueService } from '../services/queueService';
import Agent from '../models/Agent';
import { embedText } from '../services/geminiService';
import { GeminiAudioTranscriber } from '../utils/audioTranscribe';
import { chunkText, generateContentHash, getContentVersion } from '../utils/chunkText';
import { parseFile } from '../utils/parseFile';
import { scrapeAllRoutes } from '../utils/scrapeWebsite';
import { sanitizeRequest, SECURITY_CONFIG, validateFileUpload } from '../utils/security';
import { VideoProcessor } from '../utils/videoProcess';
import { cleanTranscript, fetchYouTubeTranscript, summarizeYouTubeVideoWithGemini } from '../utils/youtubeTranscript';

const router = express.Router();

// Enhanced multer configuration with security
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: SECURITY_CONFIG.MAX_FILE_SIZE,
    files: SECURITY_CONFIG.MAX_FILES_PER_REQUEST
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Use our security validation
    const validation = validateFileUpload(file);
    if (validation.isValid) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Enhanced input validation middleware with security
const validateTrainRequest = (req: Request, res: Response, next: NextFunction) => {
  // Use comprehensive security sanitization
  const sanitization = sanitizeRequest(req);
  if (!sanitization.isValid) {
    return res.status(400).json({
      error: sanitization.error,
      field: 'input_validation'
    });
  }
  
  // Replace request body with sanitized data
  req.body = { ...req.body, ...sanitization.sanitized };
  
  const { agentId, text, source, sourceUrl, sourceMetadata, fileType } = req.body;
  const files = (req as any).files && Array.isArray((req as any).files) ? (req as any).files : [];

  // agentId is always required
  if (!agentId || typeof agentId !== 'string') {
    return res.status(400).json({
      error: 'agentId is required and must be a string',
      field: 'agentId'
    });
  }

  // Validate source if provided
  if (source && !['audio', 'video', 'document', 'website', 'youtube'].includes(source)) {
    return res.status(400).json({
      error: 'source must be one of: audio, video, document, website, youtube',
      field: 'source'
    });
  }

  // For audio/video, require files
  if ((source === 'audio' || source === 'video')) {
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'For audio or video training, files must be provided',
        field: 'files'
      });
    }
    // fileType is required for files
    if (!fileType) {
      return res.status(400).json({
        error: 'fileType is required when uploading files',
        field: 'fileType'
      });
    }
    return next();
  }

  // For website/youtube, require sourceUrl
  if ((source === 'website' || source === 'youtube')) {
    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return res.status(400).json({
        error: 'sourceUrl is required for website or youtube training',
        field: 'sourceUrl'
      });
    }
    return next();
  }

  // For document or default, require text or files
  if ((!files || files.length === 0) && (!text || typeof text !== 'string')) {
    return res.status(400).json({
      error: 'Either text or files must be provided',
      field: 'text|files'
    });
  }
  // If files are present, fileType is required
  if (files && files.length > 0 && !fileType) {
    return res.status(400).json({
      error: 'fileType is required when uploading files',
      field: 'fileType'
    });
  }
  next();
};

// Async training job processor (DB version)
async function processTrainingJob(jobId: string, jobData: any) {
  try {
    console.log(`[DEBUG] Starting training job ${jobId} for agent ${jobData.agentId}`);
    await TrainJob.findOneAndUpdate({ jobId }, { status: 'processing', progress: 0, error: null });
    const { agentId, text, source, sourceUrl, sourceMetadata, fileType, files } = jobData;
    let trainingText = '';
    let usedFiles = false;
    let fileNames: string[] = [];

    console.log(`[DEBUG] Processing source: ${source}, sourceUrl: ${sourceUrl}, files count: ${files?.length || 0}`);

    // Website scraping support
    if (source === 'website' && sourceUrl) {
      console.log(`[DEBUG] Starting website scraping for: ${sourceUrl}`);
      const websiteResult = await scrapeAllRoutes(sourceUrl, { firstRouteOnly: true });
      console.log('[DEBUG] Website result:', websiteResult);
      if (typeof websiteResult === 'string') {
        trainingText = websiteResult;
        console.log(`Successfully scraped website for training: ${sourceUrl}`);
      } else {
        await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: websiteResult.error, source: 'website', url: sourceUrl } });
        return;
      }
    }
    // YouTube transcript support
    else if (source === 'youtube' && sourceUrl) {
      console.log(`[DEBUG] Starting YouTube processing for: ${sourceUrl}`);
      try {
        const rawTranscript = await fetchYouTubeTranscript(sourceUrl);
        trainingText = cleanTranscript(rawTranscript);
        console.log('[DEBUG] YouTube transcript:', trainingText);
        console.log(`Successfully fetched and cleaned transcript for URL: ${sourceUrl}`);
      } catch (ytError: any) {
        if (ytError.message?.includes('Transcript is disabled') || ytError.message?.includes('unavailable or empty')) {
          console.log(`[INFO] Transcript not available ('${ytError.message}'). Falling back to Gemini summary for ${sourceUrl}.`);
          try {
            const summary = await summarizeYouTubeVideoWithGemini(sourceUrl);
            console.log('[DEBUG] YouTube video summary:', summary);
            trainingText = summary;
            console.log(`Used Gemini to summarize YouTube video for training: ${sourceUrl}`);
          } catch (geminiError: any) {
            await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: geminiError.message, source: 'youtube-gemini', url: sourceUrl } });
            console.log(`Failed to summarize YouTube video with Gemini: ${geminiError.message}`);
            return;
          }
        } else {
          await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: ytError.message, source: 'youtube', url: sourceUrl } });
          return;
        }
      }
    }
    // Video processing support (multiple files)
    else if (source === 'video' && files && Array.isArray(files) && files.length > 0) {
      usedFiles = true;
      fileNames = files.map((f: any) => f.originalname);
      const processor = new VideoProcessor();
      let allText = '';
      let videoErrors: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileBuffer = files[i].buffer;
        const fileName = files[i].originalname;
        const mimeType = files[i].mimetype;
        try {
          const transcript = await processor.processVideo(fileBuffer, fileName, mimeType);
          console.log('[DEBUG] Video transcript:', transcript);
          allText += transcript + '\n';
        } catch (err: any) {
          videoErrors.push({ file: fileName, error: err.message });
        }
      }
      if (videoErrors.length === files.length) {
        await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: 'Failed to process all video files', details: videoErrors } });
        return;
      }
      if (videoErrors.length > 0) {
        await TrainJob.findOneAndUpdate({ jobId }, { error: { warning: 'Some video files failed to process', details: videoErrors } });
      }
      trainingText = allText;
    }
    // Audio transcription support (multiple files)
    else if (source === 'audio' && files && Array.isArray(files) && files.length > 0) {
      usedFiles = true;
      fileNames = files.map((f: any) => f.originalname);
      const transcriber = new GeminiAudioTranscriber();
      let allText = '';
      let audioErrors: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileBuffer = files[i].buffer;
        const fileName = files[i].originalname;
        try {
          const transcript = await transcriber.transcribeAudio(fileBuffer, fileName);
          allText += transcript + '\n';
        } catch (err: any) {
          audioErrors.push({ file: fileName, error: err.message });
        }
      }
      if (audioErrors.length === files.length) {
        await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: 'Failed to transcribe all audio files', details: audioErrors } });
        return;
      }
      if (audioErrors.length > 0) {
        await TrainJob.findOneAndUpdate({ jobId }, { error: { warning: 'Some audio files failed to transcribe', details: audioErrors } });
      }
      trainingText = allText;
      console.log('[DEBUG] Text after audio transcription:', trainingText.substring(0, 500) + '...');
    }
    // Document parsing support
    else if (source === 'document' && files && Array.isArray(files) && files.length > 0) {
      usedFiles = true;
      let fileTypes: string[] = [];
      if (Array.isArray(fileType)) {
        fileTypes = fileType;
      } else if (typeof fileType === 'string') {
        fileTypes = fileType.includes(',') ? fileType.split(',').map(f => f.trim()) : [fileType];
      }
      if (fileTypes.length !== files.length) {
        fileTypes = files.map((f: any, i: number) => fileTypes[i] || f.originalname.split('.').pop() || 'txt');
      }
      let allText = '';
      for (let i = 0; i < files.length; i++) {
        const fileBuffer = files[i].buffer;
        const type = fileTypes[i] || files[i].originalname.split('.').pop() || 'txt';
        fileNames.push(files[i].originalname);
        const parsed = await parseFile(fileBuffer, type);
        if (typeof parsed === 'string') {
          allText += parsed + '\n';
        } else {
          await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: parsed.error, source: parsed.source, file: files[i].originalname } });
          return;
        }
      }
      trainingText = allText;
    }
    // Fallback to raw text if provided
    else if (text) {
      trainingText = text;
    }

    if (!trainingText || trainingText.trim().length === 0) {
      console.log(`[DEBUG] No training text found for job ${jobId}`);
      await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: 'No valid training text found in input or files.' } });
      return;
    }

    console.log(`[DEBUG] Text ready for chunking. Length: ${trainingText.length}`);
    
    // Check if text is too large and truncate if necessary
    const MAX_TRAINING_TEXT_LENGTH = 50 * 1024 * 1024; // 50MB limit for training data
    if (trainingText.length > MAX_TRAINING_TEXT_LENGTH) {
      console.log(`[WARNING] Training text too large (${trainingText.length} chars), truncating to ${MAX_TRAINING_TEXT_LENGTH} chars`);
      trainingText = trainingText.substring(0, MAX_TRAINING_TEXT_LENGTH);
    }
    
    const chunksWithMetadata = chunkText(trainingText);
    console.log(`[DEBUG] Text chunked. Number of chunks: ${chunksWithMetadata.length}`);

    if (chunksWithMetadata.length === 0) {
      console.log(`[DEBUG] No chunks created for job ${jobId}`);
      await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: 'Failed to create chunks from training text.' } });
      return;
    }

    const existingCount = await Memory.countDocuments({ agentId });
    await TrainJob.findOneAndUpdate({ jobId }, {
      totalChunks: chunksWithMetadata.length,
      fileNames,
      usedFiles,
      chunksProcessed: 0,
      successCount: 0,
      errorCount: 0,
      status: 'processing',
    });

    const entries: Partial<IMemory>[] = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < chunksWithMetadata.length; i++) {
      try {
        const chunkWithMetadata = chunksWithMetadata[i];
        const chunkText = chunkWithMetadata.text;
        const chunkMetadata = chunkWithMetadata.metadata;
        
        console.log(`[DEBUG] Processing chunk ${i + 1}/${chunksWithMetadata.length} (${chunkText.length} chars)`);
        
        // Generate content hash for deduplication
        const contentHash = generateContentHash(chunkText);
        
        // Check if content already exists
        const existingContent = await Memory.findOne({ 
          agentId, 
          contentHash,
          ...(sourceUrl && { sourceUrl })
        });
        
        if (existingContent) {
          console.log(`[DEBUG] Skipping duplicate chunk ${i + 1}/${chunksWithMetadata.length} (hash: ${contentHash.substring(0, 8)}...)`);
          skippedCount++;
          continue;
        }
        
        // Get content version
        const contentVersion = await getContentVersion(agentId, contentHash, sourceUrl);
        
        let vector: number[];
        try {
          console.log(`[DEBUG] Generating embedding for chunk ${i + 1}`);
          vector = await embedText(chunkText);
          console.log(`[DEBUG] Embedding generated successfully for chunk ${i + 1}`);
        } catch (embedError) {
          console.log(`[WARNING] Embedding failed for chunk ${i + 1}, using fallback: ${embedError}`);
          vector = new Array(768).fill(0);
        }
        
        // Add file-specific metadata for file-based sources
        const enhancedChunkMetadata = {
          ...chunkMetadata,
          fileName: usedFiles && fileNames.length > 0 ? fileNames[0] : undefined
        };
        
        entries.push({ 
          agentId, 
          text: chunkText, 
          embedding: vector, 
          source, 
          sourceUrl, 
          sourceMetadata,
          chunkIndex: chunkMetadata.chunkIndex,
          contentHash,
          contentVersion,
          chunkMetadata: enhancedChunkMetadata
        } as Partial<IMemory>);
        successCount++;
        console.log(`[DEBUG] Successfully processed chunk ${i + 1}`);
      } catch (chunkError) {
        console.log(`[ERROR] Failed to process chunk ${i + 1}: ${chunkError}`);
        errorCount++;
      }
      
      // Update progress more frequently for better feedback
      await TrainJob.findOneAndUpdate({ jobId }, {
        chunksProcessed: i + 1,
        progress: Math.round(((i + 1) / chunksWithMetadata.length) * 100),
        successCount,
        errorCount,
        skippedCount
      });
    }

    if (entries.length === 0) {
      // Check if all chunks were skipped due to duplicates
      if (skippedCount > 0 && skippedCount === chunksWithMetadata.length) {
        console.log(`[DEBUG] All chunks were duplicates for job ${jobId}`);
        await TrainJob.findOneAndUpdate({ jobId }, {
          status: 'completed',
          result: {
            agentId,
            chunksStored: 0,
            totalChunks: chunksWithMetadata.length,
            successCount: 0,
            errorCount: 0,
            skippedCount,
            fileNames,
            usedFiles,
            source,
            sourceUrl,
            sourceMetadata,
            message: 'All content was already trained (duplicates skipped)'
          }
        });
      } else {
        console.log(`[DEBUG] No chunks processed successfully for job ${jobId}`);
        await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: 'Failed to process any chunks' } });
      }
      return;
    }

    console.log(`[DEBUG] Storing ${entries.length} chunks to database for job ${jobId}`);
    await Memory.insertMany(entries);
    console.log(`[DEBUG] Successfully stored ${entries.length} chunks for job ${jobId}`);
    
    // Update agent status to trained
    await Agent.findOneAndUpdate(
      { _id: agentId },
      { status: 'trained' }
    );
    
    await TrainJob.findOneAndUpdate({ jobId }, {
      status: 'completed',
      result: {
        agentId,
        chunksStored: entries.length,
        totalChunks: chunksWithMetadata.length,
        successCount,
        errorCount,
        skippedCount,
        fileNames,
        usedFiles,
        source,
        sourceUrl,
        sourceMetadata
      }
    });
    console.log(`[DEBUG] Training job ${jobId} completed successfully`);
  } catch (error: unknown) {
    console.error(`[ERROR] Training job ${jobId} failed:`, error);
    await TrainJob.findOneAndUpdate({ jobId }, { status: 'failed', error: { error: error instanceof Error ? error.message : String(error) } });
  }
}

/**
 * @swagger
 * /api/train:
 *   post:
 *     summary: Train an AI agent with knowledge
 *     description: Upload documents, text, audio, video, or scrape websites to train an AI agent with specific knowledge
 *     tags: [AI Agent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: string
 *                 description: Unique identifier for the AI agent to train
 *                 example: "sales-agent-001"
 *                 maxLength: 100
 *               text:
 *                 type: string
 *                 description: Text content to train the agent with (alternative to files)
 *                 example: "Our company offers premium customer support with 24/7 availability..."
 *                 maxLength: 1000000
 *               source:
 *                 type: string
 *                 enum: [audio, video, document, website, youtube]
 *                 description: Type of source being processed
 *                 example: "document"
 *               sourceUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL for website scraping or YouTube video processing
 *                 example: "https://example.com"
 *               sourceMetadata:
 *                 type: object
 *                 description: Additional metadata about the source
 *                 example: {"author": "John Doe", "date": "2024-01-01"}
 *               fileType:
 *                 type: string
 *                 description: Type of file being uploaded (required when files are present)
 *                 example: "pdf"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (PDF, DOCX, TXT, MP3, MP4, etc.)
 *     responses:
 *       200:
 *         description: Training job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   description: Unique identifier for the training job
 *                   example: "train-job-12345"
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, completed, failed]
 *                   description: Current status of the training job
 *                 message:
 *                   type: string
 *                   description: Human-readable status message
 *                 agentId:
 *                   type: string
 *                   description: The agent being trained
 *                 progress:
 *                   type: number
 *                   format: float
 *                   minimum: 0
 *                   maximum: 100
 *                   description: Training progress percentage
 *                 estimatedTime:
 *                   type: number
 *                   description: Estimated completion time in seconds
 *                 chunksCreated:
 *                   type: integer
 *                   description: Number of knowledge chunks created
 *                 tokensUsed:
 *                   type: integer
 *                   description: Number of tokens consumed during training
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                 field:
 *                   type: string
 *                   description: Field that caused the error
 *       401:
 *         description: Unauthorized - Invalid API token
 *       413:
 *         description: Request too large
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                 maxSize:
 *                   type: string
 *                   description: Maximum allowed size
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 path:
 *                   type: string
 *                 method:
 *                   type: string
 */
router.post('/', upload.array('files', SECURITY_CONFIG.MAX_FILES_PER_REQUEST), validateTrainRequest, async (req: Request, res: Response) => {
  try {
    const { agentId, text, source = 'document', sourceUrl, sourceMetadata = {}, fileType } = req.body;
    const files = (req as any).files && Array.isArray((req as any).files) ? (req as any).files : [];
    const jobId = uuidv4();
    
    // Verify agent exists and belongs to user
    const agent = await Agent.findOne({ _id: agentId, userId: (req.user as any).id });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found or access denied' });
    }
    
    await TrainJob.create({
      jobId,
      agentId,
      userId: (req.user as any).id,
      status: 'queued',
      progress: 0,
      error: null,
      result: null,
      fileNames: files.map((f: any) => f.originalname),
      usedFiles: files.length > 0,
      source,
      sourceUrl,
      sourceMetadata,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Enqueue training job in Bull
    await TrainingQueueService.addTrainingJob({
      agentId,
      userId: (req.user as any).id,
      resources: [],
      priority: 'normal'
    });
    setImmediate(() => processTrainingJob(jobId, { agentId, text, source, sourceUrl, sourceMetadata, fileType, files }));
    res.json({ jobId, status: 'queued', message: 'Training started. Poll /api/train/status/:jobId for progress.' });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Failed to start training job', details: error instanceof Error ? error.message : String(error) });
  }
});

// GET /api/train/status/:jobId (DB version)
router.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await TrainJob.findOne({ jobId, userId: (req.user as any).id });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      error: job.error,
      result: job.result,
      createdAt: job.createdAt,
      fileNames: job.fileNames,
      usedFiles: job.usedFiles,
      chunksProcessed: job.chunksProcessed,
      totalChunks: job.totalChunks,
      successCount: job.successCount,
      errorCount: job.errorCount,
      skippedCount: job.skippedCount
    });
  } catch (error: unknown) {
    console.error('Error fetching training job status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch training job status',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/train/jobs - Get all training jobs for user
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await TrainJob.find({ userId: (req.user as any).id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(jobs);
  } catch (error: unknown) {
    console.error('Error fetching training jobs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch training jobs',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/train/jobs/:agentId - Get training jobs for specific agent
router.get('/jobs/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    
    // Verify agent belongs to user
    const agent = await Agent.findOne({ _id: agentId, userId: (req.user as any).id });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found or access denied' });
    }
    
    const jobs = await TrainJob.find({ agentId, userId: (req.user as any).id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(jobs);
  } catch (error: unknown) {
    console.error('Error fetching agent training jobs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch agent training jobs',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
