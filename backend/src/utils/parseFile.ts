import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.js');

export interface ParseResult {
  success: boolean;
  text?: string;
  error?: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    language?: string;
    extractedText?: string;
  };
}

export async function parseFile(fileBuffer: Buffer, fileType: string): Promise<ParseResult> {
  try {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return await parsePDF(fileBuffer);
      case 'docx':
        return await parseDocx(fileBuffer);
      case 'doc':
        return await parseDoc(fileBuffer);
      case 'txt':
        return await parseText(fileBuffer);
      case 'csv':
        return await parseCSV(fileBuffer);
      case 'json':
        return await parseJSON(fileBuffer);
      case 'md':
      case 'markdown':
        return await parseMarkdown(fileBuffer);
      default:
        return {
          success: false,
          error: `Unsupported file type: ${fileType}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return {
      success: true,
      text: fullText.trim(),
      metadata: {
        pages: pdf.numPages,
        wordCount: fullText.split(/\s+/).length,
        extractedText: fullText.substring(0, 500) + '...'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    return {
      success: true,
      text: text.trim(),
      metadata: {
        wordCount: text.split(/\s+/).length,
        extractedText: text.substring(0, 500) + '...'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function parseDoc(buffer: Buffer): Promise<ParseResult> {
  // For .doc files, we'll try to extract text using mammoth
  // Note: This might not work for all .doc files
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    return {
      success: true,
      text: text.trim(),
      metadata: {
        wordCount: text.split(/\s+/).length,
        extractedText: text.substring(0, 500) + '...'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `DOC parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Note: .doc files may not be fully supported.`
    };
  }
}

async function parseText(buffer: Buffer): Promise<ParseResult> {
  try {
    const text = buffer.toString('utf-8');
    
    return {
      success: true,
      text: text.trim(),
      metadata: {
        wordCount: text.split(/\s+/).length,
        extractedText: text.substring(0, 500) + '...'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Text parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function parseCSV(buffer: Buffer): Promise<ParseResult> {
  try {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer);
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          // Convert CSV data to readable text
          const text = results.map(row => 
            Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ')
          ).join('\n');
          
          resolve({
            success: true,
            text: text.trim(),
            metadata: {
              wordCount: text.split(/\s+/).length,
              extractedText: text.substring(0, 500) + '...'
            }
          });
        })
        .on('error', (error) => {
          reject({
            success: false,
            error: `CSV parsing failed: ${error.message}`
          });
        });
    });
  } catch (error) {
    return {
      success: false,
      error: `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function parseJSON(buffer: Buffer): Promise<ParseResult> {
  try {
    const jsonData = JSON.parse(buffer.toString('utf-8'));
    const text = JSON.stringify(jsonData, null, 2);
    
    return {
      success: true,
      text: text.trim(),
      metadata: {
        wordCount: text.split(/\s+/).length,
        extractedText: text.substring(0, 500) + '...'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function parseMarkdown(buffer: Buffer): Promise<ParseResult> {
  try {
    const text = buffer.toString('utf-8');
    
    return {
      success: true,
      text: text.trim(),
      metadata: {
        wordCount: text.split(/\s+/).length,
        extractedText: text.substring(0, 500) + '...'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Markdown parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export function getFileTypeFromMimeType(mimeType: string): string {
  const mimeToType: { [key: string]: string } = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/json': 'json',
    'text/markdown': 'md',
    'text/x-markdown': 'md'
  };
  
  return mimeToType[mimeType] || 'txt';
}

export function getFileTypeFromExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return ext || 'txt';
}
