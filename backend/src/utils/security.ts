import * as path from 'path';
import * as crypto from 'crypto';

export interface SecurityConfig {
  MAX_FILE_SIZE: number;
  MAX_FILES_PER_REQUEST: number;
  ALLOWED_FILE_TYPES: string[];
  ALLOWED_MIME_TYPES: string[];
  MAX_TEXT_LENGTH: number;
  MAX_URL_LENGTH: number;
}

export const SECURITY_CONFIG: SecurityConfig = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES_PER_REQUEST: 10,
  ALLOWED_FILE_TYPES: ['pdf', 'docx', 'doc', 'txt', 'csv', 'json', 'md', 'mp3', 'mp4', 'wav', 'avi', 'mov'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/csv',
    'application/json',
    'text/markdown',
    'text/x-markdown',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'video/mp4',
    'video/avi',
    'video/quicktime'
  ],
  MAX_TEXT_LENGTH: 1000000, // 1MB of text
  MAX_URL_LENGTH: 2048
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface SanitizationResult {
  isValid: boolean;
  error?: string;
  sanitized?: any;
}

export function validateFileUpload(file: Express.Multer.File): ValidationResult {
  // Check file size
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file extension
  const fileExt = path.extname(file.originalname).toLowerCase().slice(1);
  if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(fileExt)) {
    return {
      isValid: false,
      error: `File type '${fileExt}' is not allowed. Allowed types: ${SECURITY_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`
    };
  }

  // Check MIME type
  if (!SECURITY_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      isValid: false,
      error: `MIME type '${file.mimetype}' is not allowed. Allowed types: ${SECURITY_CONFIG.ALLOWED_MIME_TYPES.join(', ')}`
    };
  }

  // Check for suspicious file names
  if (containsSuspiciousContent(file.originalname)) {
    return {
      isValid: false,
      error: 'File name contains suspicious content'
    };
  }

  return { isValid: true };
}

export function sanitizeRequest(req: any): SanitizationResult {
  try {
    const sanitized: any = {};

    // Sanitize text input
    if (req.body.text && typeof req.body.text === 'string') {
      if (req.body.text.length > SECURITY_CONFIG.MAX_TEXT_LENGTH) {
        return {
          isValid: false,
          error: `Text length exceeds maximum allowed length of ${SECURITY_CONFIG.MAX_TEXT_LENGTH} characters`
        };
      }
      sanitized.text = sanitizeText(req.body.text);
    }

    // Sanitize source URL
    if (req.body.sourceUrl && typeof req.body.sourceUrl === 'string') {
      if (req.body.sourceUrl.length > SECURITY_CONFIG.MAX_URL_LENGTH) {
        return {
          isValid: false,
          error: `URL length exceeds maximum allowed length of ${SECURITY_CONFIG.MAX_URL_LENGTH} characters`
        };
      }
      sanitized.sourceUrl = sanitizeUrl(req.body.sourceUrl);
    }

    // Sanitize agent ID
    if (req.body.agentId && typeof req.body.agentId === 'string') {
      sanitized.agentId = sanitizeAgentId(req.body.agentId);
    }

    // Sanitize source
    if (req.body.source && typeof req.body.source === 'string') {
      sanitized.source = sanitizeSource(req.body.source);
    }

    // Sanitize file type
    if (req.body.fileType && typeof req.body.fileType === 'string') {
      sanitized.fileType = sanitizeFileType(req.body.fileType);
    }

    // Sanitize source metadata
    if (req.body.sourceMetadata) {
      sanitized.sourceMetadata = sanitizeMetadata(req.body.sourceMetadata);
    }

    return {
      isValid: true,
      sanitized
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to sanitize request data'
    };
  }
}

function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    return parsedUrl.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

function sanitizeAgentId(agentId: string): string {
  return agentId
    .replace(/[^a-zA-Z0-9-_]/g, '') // Only allow alphanumeric, hyphens, and underscores
    .substring(0, 100); // Limit length
}

function sanitizeSource(source: string): string {
  const allowedSources = ['audio', 'video', 'document', 'website', 'youtube', 'text'];
  return allowedSources.includes(source) ? source : 'text';
}

function sanitizeFileType(fileType: string): string {
  return fileType
    .replace(/[^a-zA-Z0-9,]/g, '') // Only allow alphanumeric and commas
    .substring(0, 50); // Limit length
}

function sanitizeMetadata(metadata: any): any {
  if (typeof metadata !== 'object' || metadata === null) {
    return {};
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof key === 'string' && key.length <= 50) {
      if (typeof value === 'string' && value.length <= 1000) {
        sanitized[key] = sanitizeText(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

function containsSuspiciousContent(filename: string): boolean {
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /[<>:"|?*]/, // Invalid filename characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved Windows names
    /\.(exe|bat|cmd|com|scr|pif|vbs|js|jar|sh|ps1)$/i // Executable extensions
  ];

  return suspiciousPatterns.some(pattern => pattern.test(filename));
}

export function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${random}${ext}`;
}

export function validateAgentId(agentId: string): ValidationResult {
  if (!agentId || typeof agentId !== 'string') {
    return {
      isValid: false,
      error: 'Agent ID is required and must be a string'
    };
  }

  if (agentId.length > 100) {
    return {
      isValid: false,
      error: 'Agent ID must be 100 characters or less'
    };
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(agentId)) {
    return {
      isValid: false,
      error: 'Agent ID can only contain letters, numbers, hyphens, and underscores'
    };
  }

  return { isValid: true };
}
