// Base API Response Type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Authentication Types
export interface IUser {
  _id: string;
  googleId?: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  company?: string;
  bio?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: Omit<IUser, 'password' | 'emailVerificationToken' | 'passwordResetToken' | 'passwordResetExpires'>;
  token: string;
}

// Agent Types
export interface IAgent {
  _id: string;
  userId: string;
  name: string;
  description: string;
  type: 'support' | 'sales' | 'content' | 'general';
  avatar?: string;
  status: 'trained' | 'training' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  conversations: number;
  platforms: string[];
  sources: IAgentSource[];
  apis: string[];
  tone: 'friendly' | 'formal' | 'techy' | 'fun';
  config: {
    searchEnabled: boolean;
    newsEnabled: boolean;
    expressAgentEnabled: boolean;
  };
  trainingData?: {
    documents: string[];
    conversations: string[];
    customInstructions: string;
  };
}

export interface IAgentSource {
  _id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: Date;
  status: 'processed' | 'processing' | 'failed';
  url?: string;
  content?: string;
}

export interface CreateAgentRequest {
  name: string;
  description: string;
  type: string;
  tone: string;
  config: {
    searchEnabled: boolean;
    newsEnabled: boolean;
    expressAgentEnabled: boolean;
  };
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {
  id: string;
}

// Chat Types
export interface IChatMessage {
  _id: string;
  agentId: string;
  userId?: string;
  sessionId: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  apiUsed?: string;
  metadata?: {
    responseTime?: number;
    tokensUsed?: number;
    confidence?: number;
  };
}

export interface SendMessageRequest {
  agentId: string;
  message: string;
  sessionId?: string;
}

// Deployment Types
export interface IDeployment {
  _id: string;
  agentId: string;
  userId: string;
  platform: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastPing?: Date;
  stats: {
    totalViews: number;
    uniqueVisitors: number;
    totalChats: number;
    avgResponseTime: number;
    satisfactionRate: number;
  };
  webhookUrl?: string;
  credentials?: {
    accessToken?: string;
    refreshToken?: string;
    botToken?: string;
    apiKey?: string;
    webhookSecret?: string;
  };
}

export interface DeploymentConfig {
  platform: string;
  config: Record<string, any>;
}

// Resource Types
export interface IResource {
  _id: string;
  userId: string;
  name: string;
  originalName: string;
  type: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  linkedAgents: string[];
  status: 'processed' | 'processing' | 'failed';
  url: string;
  path: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    language?: string;
    extractedText?: string;
  };
}

export interface UploadResourceRequest {
  file: Express.Multer.File;
  linkedAgents?: string[];
}

// Analytics Types
export interface IAnalytics {
  _id: string;
  agentId: string;
  userId: string;
  date: Date;
  totalViews: number;
  uniqueVisitors: number;
  totalChats: number;
  avgResponseTime: number;
  satisfactionRate: number;
  platformBreakdown: Record<string, number>;
  dailyStats: Array<{
    date: Date;
    views: number;
    chats: number;
    visitors: number;
  }>;
}

// Settings Types
export interface IUserSettings {
  _id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    agentTraining: boolean;
    deploymentStatus: boolean;
  };
  privacy: {
    dataAnalytics: boolean;
    marketingEmails: boolean;
    profileVisibility: 'public' | 'private';
  };
  api: {
    rateLimit: number;
    allowedOrigins: string[];
  };
}

export interface IApiKey {
  _id: string;
  userId: string;
  name: string;
  key: string;
  status: 'active' | 'inactive';
  lastUsed?: Date;
  createdAt: Date;
  permissions: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Job Queue Types
export interface ITrainingJob {
  agentId: string;
  userId: string;
  resources: string[];
  priority: 'low' | 'normal' | 'high';
}

export interface IDeploymentJob {
  deploymentId: string;
  agentId: string;
  userId: string;
  platform: string;
  config: Record<string, any>;
  action: 'deploy' | 'update' | 'undeploy';
}

// Webhook Types
export interface IWebhook {
  _id: string;
  deploymentId: string;
  platform: string;
  event: string;
  payload: any;
  processed: boolean;
  createdAt: Date;
}

// Platform Connector Types
export interface IConnectorConfig {
  platform: string;
  credentials: Record<string, any>;
  settings: Record<string, any>;
}

export interface IConnectorResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Express Request Extensions
// Commented out to avoid conflict with passport User type
// declare global {
//   namespace Express {
//     interface Request {
//       user?: any;
//       file?: Express.Multer.File;
//       files?: Express.Multer.File[];
//     }
//   }
// }

// Environment Variables
export interface IEnvironment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGO_URI: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_EXPIRE: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  CORS_ORIGIN: string;
  UPLOAD_PATH: string;
  MAX_FILE_SIZE: number;
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  FRONTEND_URL: string;
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
