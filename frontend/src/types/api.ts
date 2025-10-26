export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthStatus {
  status: string;
  services: Record<string, { status: string; error?: string }>;
  uptime: number;
  responseTime: number;
  timestamp: string;
  version: string;
  environment: string;
}

export interface Metrics {
  system: {
    uptime: { seconds: number; minutes: number; hours: number; days: number };
    memory: { rss: number; heapTotal: number; heapUsed: number; external: number; arrayBuffers: number };
    cpu: { user: number; system: number };
    platform: string;
    nodeVersion: string;
    pid: number;
  };
  database: Record<string, unknown> | null;
  collections: Record<string, number>;
  environment: { nodeEnv?: string; port?: string; corsOrigin?: string };
  timestamp: string;
}

// Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
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
  user: User;
  token: string;
}

// Agent Types
export interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'support' | 'sales' | 'content' | 'general';
  avatar?: string;
  status: 'trained' | 'training' | 'failed';
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
  conversations: number;
  platforms: string[];
  sources: AgentSource[];
  apis: string[];
  tone: 'friendly' | 'formal' | 'techy' | 'fun';
  config: {
    searchEnabled: boolean;
    newsEnabled: boolean;
    expressAgentEnabled: boolean;
  };
}

export interface AgentSource {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: 'processed' | 'processing' | 'failed';
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
export interface ChatMessage {
  id: string;
  agentId: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: string;
  apiUsed?: string;
}

export interface SendMessageRequest {
  agentId: string;
  message: string;
}

// Deployment Types
export interface Deployment {
  id: string;
  agentId: string;
  platform: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalViews: number;
    uniqueVisitors: number;
    totalChats: number;
    avgResponseTime: string;
    satisfactionRate: number;
  };
}

export interface DeploymentConfig {
  platform: string;
  config: Record<string, any>;
}

// Resource Types
export interface Resource {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  linkedAgents: string[];
  status: 'processed' | 'processing' | 'failed';
  url?: string;
}

export interface UploadResourceRequest {
  file: File;
  linkedAgents?: string[];
}

// Analytics Types
export interface Analytics {
  totalViews: number;
  uniqueVisitors: number;
  totalChats: number;
  avgResponseTime: string;
  satisfactionRate: number;
  platformBreakdown: Record<string, number>;
  dailyStats: Array<{
    date: string;
    views: number;
    chats: number;
    visitors: number;
  }>;
}

// Settings Types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    agentTraining: boolean;
  };
  privacy: {
    dataAnalytics: boolean;
    marketingEmails: boolean;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'inactive';
  lastUsed: string;
  createdAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}