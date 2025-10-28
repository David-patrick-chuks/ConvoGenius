import crypto from 'crypto';

export interface ChunkWithMetadata {
  text: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    fileName?: string;
    pageNumber?: number;
    sectionTitle?: string;
    timestamp?: number;
  };
}

export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): ChunkWithMetadata[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: ChunkWithMetadata[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    
    // If adding this sentence would exceed chunk size, save current chunk
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: {
          chunkIndex,
          totalChunks: 0, // Will be updated later
          fileName: undefined,
          pageNumber: undefined,
          sectionTitle: undefined,
          timestamp: undefined
        }
      });
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + ' ' + sentence;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk.length > 0 ? '. ' : '') + sentence;
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      metadata: {
        chunkIndex,
        totalChunks: 0, // Will be updated below
        fileName: undefined,
        pageNumber: undefined,
        sectionTitle: undefined,
        timestamp: undefined
      }
    });
  }
  
  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });
  
  return chunks;
}

export function generateContentHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function getContentVersion(agentId: string, contentHash: string, sourceUrl?: string): Promise<number> {
  // This would typically query the database to get the latest version
  // For now, return 1 as default
  return 1;
}

export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim();
}

export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Simple keyword extraction - in production, you might want to use a more sophisticated approach
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3) // Filter out short words
    .filter(word => !isStopWord(word)); // Filter out stop words
  
  // Count word frequency
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
    'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);
  return stopWords.has(word);
}
