import { YoutubeTranscript } from 'youtube-transcript';
import { generateReply } from '../services/geminiService';

export interface TranscriptResult {
  success: boolean;
  transcript?: string;
  error?: string;
  source: 'transcript' | 'summary';
}

export async function fetchYouTubeTranscript(videoUrl: string): Promise<string> {
  try {
    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      throw new Error('Transcript is disabled or unavailable for this video');
    }

    // Combine transcript segments
    const fullTranscript = transcript
      .map(segment => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (fullTranscript.length === 0) {
      throw new Error('Transcript is empty');
    }

    return fullTranscript;
  } catch (error) {
    throw new Error(`Failed to fetch YouTube transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function cleanTranscript(transcript: string): string {
  return transcript
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\[.*?\]/g, '') // Remove timestamps and speaker labels
    .replace(/\(.*?\)/g, '') // Remove parenthetical content
    .replace(/[^\w\s.,!?;:'"-]/g, '') // Remove special characters except basic punctuation
    .trim();
}

export async function summarizeYouTubeVideoWithGemini(videoUrl: string): Promise<string> {
  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const prompt = `
Please provide a comprehensive summary of the YouTube video with ID: ${videoId}
URL: ${videoUrl}

The summary should include:
1. Main topics discussed
2. Key points and insights
3. Important details that would be useful for training an AI agent

Please provide a detailed summary that captures the essence of the video content.
`;

    const summary = await generateReply(prompt);
    return summary;
  } catch (error) {
    throw new Error(`Failed to summarize YouTube video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

export async function processYouTubeVideo(videoUrl: string): Promise<TranscriptResult> {
  try {
    // First try to get transcript
    try {
      const transcript = await fetchYouTubeTranscript(videoUrl);
      const cleanedTranscript = cleanTranscript(transcript);
      
      return {
        success: true,
        transcript: cleanedTranscript,
        source: 'transcript'
      };
    } catch (transcriptError) {
      console.log('Transcript not available, trying Gemini summary...');
      
      // If transcript fails, try Gemini summary
      try {
        const summary = await summarizeYouTubeVideoWithGemini(videoUrl);
        
        return {
          success: true,
          transcript: summary,
          source: 'summary'
        };
      } catch (summaryError) {
        throw new Error(`Both transcript and summary failed: ${summaryError instanceof Error ? summaryError.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      source: 'transcript'
    };
  }
}
