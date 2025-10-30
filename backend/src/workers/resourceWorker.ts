import fs from 'fs';
import Resource from '../models/Resource';
import { resourceProcessingQueue } from '../services/queueService';
import { GeminiAudioTranscriber } from '../utils/audioTranscribe';
import logger from '../utils/logger';
import { getFileTypeFromExtension, parseFile } from '../utils/parseFile';
import { scrapeAllRoutes } from '../utils/scrapeWebsite';
import { VideoProcessor } from '../utils/videoProcess';
import { cleanTranscript, fetchYouTubeTranscript, summarizeYouTubeVideoWithGemini } from '../utils/youtubeTranscript';

// Process document/audio/video files by filePath for now (documents fully parsed; media placeholder)
resourceProcessingQueue.process('process-resource', async (job) => {
  const { resourceId, filePath } = job.data as { resourceId: string; filePath: string };
  try {
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      logger.warn(`Resource ${resourceId} not found`);
      return true;
    }
    // URL-based resources (website/youtube)
    if (resource.type === 'website' && resource.url) {
      try {
        const result = await scrapeAllRoutes(resource.url, { firstRouteOnly: true });
        const text = typeof result === 'string' ? result : (result as any).content || '';
        if (!text) throw new Error((result as any)?.error || 'No content');
        await Resource.findByIdAndUpdate(resourceId, {
          status: 'processed',
          metadata: {
            wordCount: text.split(/\s+/).length,
            extractedText: text
          }
        });
        return true;
      } catch (err: any) {
        await Resource.findByIdAndUpdate(resourceId, { status: 'failed', metadata: { error: err?.message || 'Website scrape failed' } });
        return true;
      }
    }
    if (resource.type === 'youtube' && resource.url) {
      try {
        let text = '';
        try {
          const raw = await fetchYouTubeTranscript(resource.url);
          text = cleanTranscript(raw);
        } catch (ytErr: any) {
          if (ytErr.message?.includes('Transcript is disabled') || ytErr.message?.includes('unavailable or empty')) {
            text = await summarizeYouTubeVideoWithGemini(resource.url);
          } else {
            throw ytErr;
          }
        }
        await Resource.findByIdAndUpdate(resourceId, {
          status: 'processed',
          metadata: {
            wordCount: text.split(/\s+/).length,
            extractedText: text
          }
        });
        return true;
      } catch (err: any) {
        await Resource.findByIdAndUpdate(resourceId, { status: 'failed', metadata: { error: err?.message || 'YouTube processing failed' } });
        return true;
      }
    }
    // File-based resource
    if (!filePath || !fs.existsSync(filePath)) {
      await Resource.findByIdAndUpdate(resourceId, { status: 'failed', metadata: { error: 'File not found' } });
      return true;
    }
    const fileBuffer = fs.readFileSync(filePath);
    const type = (getFileTypeFromExtension(resource.originalName || resource.name) || '').toLowerCase();
    const audioExts = ['mp3','wav','m4a','aac','ogg','flac'];
    const videoExts = ['mp4','webm','mov','avi','mkv'];
    let finalText = '';

    try {
      if (audioExts.includes(type)) {
        const transcriber = new GeminiAudioTranscriber();
        finalText = await transcriber.transcribeAudio(fileBuffer, resource.originalName || resource.name);
      } else if (videoExts.includes(type)) {
        const processor = new VideoProcessor();
        const mime = videoExts.includes(type) ? `video/${type === 'mkv' ? 'x-matroska' : type}` : 'application/octet-stream';
        finalText = await processor.processVideo(fileBuffer, resource.originalName || resource.name, mime);
      } else {
        const result = await parseFile(fileBuffer, type);
        if (result.success && result.text) {
          finalText = result.text;
        } else {
          throw new Error(result.error || 'Failed to process file');
        }
      }

      await Resource.findByIdAndUpdate(resourceId, {
        status: 'processed',
        metadata: {
          wordCount: finalText.split(/\s+/).length,
          extractedText: finalText
        }
      });
    } catch (fileErr: any) {
      await Resource.findByIdAndUpdate(resourceId, {
        status: 'failed',
        metadata: { error: fileErr?.message || 'Failed to process file' }
      });
    }
    return true;
  } catch (err) {
    logger.error('Resource processing error', err);
    await Resource.findByIdAndUpdate(resourceId, { status: 'failed', metadata: { error: err instanceof Error ? err.message : 'Unknown error' } });
    return true;
  }
});

resourceProcessingQueue.on('active', (job) => logger.info(`Resource job active: ${job.id}`));
resourceProcessingQueue.on('stalled', (job) => logger.warn(`Resource job stalled: ${job.id}`));
resourceProcessingQueue.on('error', (err) => logger.error('Resource queue error', err));


