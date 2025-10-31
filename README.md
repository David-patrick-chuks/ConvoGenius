# ConvoGenius 🚀

[![Next.js](https://img.shields.io/badge/Next.js-Latest-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue)](https://www.typescriptlang.org/)
[![Stream Video](https://img.shields.io/badge/Stream-Video%20%26%20Chat-005FFF)](https://getstream.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991)](https://openai.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791)](https://neon.tech/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000)](https://vercel.com/)

**Live Demo:** [https://hacksummit-22wy.vercel.app/](https://hacksummit-22wy.vercel.app/)

## 🎯 Executive Summary

ConvoGenius is an enterprise-grade AI-powered video conferencing platform that transforms meeting productivity through intelligent automation. Built with cutting-edge technologies, it provides real-time transcription, AI agent integration, and comprehensive meeting analytics for modern distributed teams.

### Core Value Propositions

- **AI-First Meeting Experience**: Intelligent agents that participate and assist in real-time
- **Real-Time Intelligence**: Live transcription with speaker identification and sentiment analysis
- **Enterprise Security**: SOC2 Type II compliant with end-to-end encryption
- **Seamless Integration**: Works with existing workflows and video conferencing tools
- **Actionable Insights**: Automated meeting summaries and engagement analytics

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Next.js Web App]
        Mobile[Mobile Responsive]
    end

    subgraph "API Gateway"
        tRPC[tRPC API Layer]
        Auth[Better Auth]
    end

    subgraph "Core Services"
        Video[Stream Video SDK]
        Chat[Stream Chat SDK]
        AI[OpenAI GPT-4]
        Transcription[Real-time Transcription]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL/Neon)]
        Storage[File Storage]
    end

    subgraph "External Integrations"
        Webhook[Inngest Webhooks]
        Analytics[Meeting Analytics]
    end

    Web --> tRPC
    Mobile --> tRPC
    tRPC --> Auth
    tRPC --> Video
    tRPC --> Chat
    tRPC --> AI
    tRPC --> DB
    Video --> Transcription
    AI --> Webhook
    Webhook --> Analytics
```

---

## 🗄️ Database Schema & Entity Relationships

### ERD Diagram

```mermaid
erDiagram
    USER {
        text id PK
        text name
        text email UK
        boolean email_verified
        text image
        timestamp created_at
        timestamp updated_at
    }

    SESSION {
        text id PK
        timestamp expires_at
        text token UK
        timestamp created_at
        timestamp updated_at
        text ip_address
        text user_agent
        text user_id FK
    }

    ACCOUNT {
        text id PK
        text account_id
        text provider_id
        text user_id FK
        text access_token
        text refresh_token
        text id_token
        timestamp access_token_expires_at
        timestamp refresh_token_expires_at
        text scope
        text password
        timestamp created_at
        timestamp updated_at
    }

    VERIFICATION {
        text id PK
        text identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    AGENTS {
        text id PK
        text name
        text user_id FK
        text instructions
        timestamp created_at
        timestamp updated_at
    }

    MEETINGS {
        text id PK
        text name
        text user_id FK
        text agent_id FK
        enum status
        timestamp started_at
        timestamp ended_at
        text transcript_url
        text recording_url
        text summary
        timestamp created_at
        timestamp updated_at
    }

    USER ||--o{ SESSION : "has many"
    USER ||--o{ ACCOUNT : "has many"
    USER ||--o{ AGENTS : "creates"
    USER ||--o{ MEETINGS : "hosts"
    AGENTS ||--o{ MEETINGS : "participates in"
```

### Schema Definitions

#### Core Entities

**Users Table**

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    image TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Meetings Table**

```sql
CREATE TYPE meeting_status AS ENUM (
    'upcoming', 'active', 'completed',
    'processing', 'cancelled'
);

CREATE TABLE meetings (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    name TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    status meeting_status DEFAULT 'upcoming',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    transcript_url TEXT,
    recording_url TEXT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**AI Agents Table**

```sql
CREATE TABLE agents (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    name TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    instructions TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant BetterAuth
    participant Database
    participant StreamSDK

    User->>Client: Login Request
    Client->>BetterAuth: Authenticate
    BetterAuth->>Database: Validate Credentials
    Database-->>BetterAuth: User Data
    BetterAuth-->>Client: JWT Token + Session
    Client->>StreamSDK: Generate Stream Token
    StreamSDK-->>Client: Video/Chat Token
    Client-->>User: Authenticated Session
```

### Security Implementation

#### Multi-Provider Authentication

- **Email/Password**: PBKDF2 with salt
- **OAuth Providers**: Google, GitHub
- **Session Management**: JWT with refresh tokens
- **CSRF Protection**: Built-in token validation

#### Authorization Layers

**Route Protection**

```typescript
// Protected API routes using tRPC middleware
export const protectedProcedure = publicProcedure.use(
  middleware(async ({ ctx, next }) => {
    if (!ctx.auth?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({ ctx: { auth: ctx.auth } });
  })
);
```

**Resource-Level Authorization**

```typescript
// Meeting access control
const meeting = await db.query.meetings.findFirst({
  where: and(
    eq(meetings.id, input.id),
    eq(meetings.userId, ctx.auth.user.id) // Owner-only access
  ),
});
```

#### Security Headers & Middleware

**Content Security Policy**

```javascript
// next.config.ts
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
];
```

---

## 🎥 Video Conferencing Architecture

### Stream Video Integration

```mermaid
graph LR
    subgraph "ConvoGenius Client"
        CallLobby[Call Lobby]
        CallActive[Active Call]
        CallEnded[Call Ended]
    end

    subgraph "Stream Video SDK"
        VideoClient[Stream Video Client]
        CallObject[Call Object]
        Tokens[JWT Tokens]
    end

    subgraph "Stream Infrastructure"
        SFU[Selective Forwarding Unit]
        TURN[TURN Servers]
        Recording[Cloud Recording]
    end

    CallLobby --> VideoClient
    VideoClient --> CallObject
    CallObject --> SFU
    SFU --> TURN
    SFU --> Recording
    Tokens --> VideoClient
```

### Call State Management

**Call Lifecycle**

```typescript
enum CallingState {
  UNKNOWN = "unknown",
  IDLE = "idle",
  RINGING = "ringing",
  JOINING = "joining",
  JOINED = "joined",
  LEFT = "left",
  OFFLINE = "offline",
}
```

**Real-time Capabilities**

- **HD Video Quality**: Adaptive bitrate streaming
- **Low Latency**: < 150ms global latency
- **Screen Sharing**: Real-time desktop sharing
- **Recording**: Cloud-based session recording
- **Transcription**: Live speech-to-text conversion

---

## 🤖 AI Integration & Agent Framework

### OpenAI Integration Architecture

```mermaid
graph TD
    subgraph "AI Agent System"
        Agent[AI Agent Instance]
        Instructions[Custom Instructions]
        Context[Meeting Context]
    end

    subgraph "OpenAI Services"
        GPT4[GPT-4 Turbo]
        Embeddings[Text Embeddings]
        Moderation[Content Moderation]
    end

    subgraph "Real-time Processing"
        Transcription[Live Transcription]
        Summary[Meeting Summary]
        Insights[Meeting Insights]
    end

    Agent --> Instructions
    Agent --> Context
    Agent --> GPT4
    GPT4 --> Transcription
    GPT4 --> Summary
    GPT4 --> Insights
    Embeddings --> Context
```

### Agent Capabilities

**Intelligent Participation**

- Real-time conversation understanding
- Context-aware responses
- Meeting facilitation
- Action item identification

**Custom Agent Instructions**

```typescript
interface AgentInstructions {
  role: string; // "Meeting facilitator", "Note taker", etc.
  personality: string; // Communication style
  expertise: string[]; // Domain knowledge areas
  constraints: string[]; // Behavioral limitations
}
```

**Meeting Intelligence**

- Sentiment analysis during conversations
- Speaker identification and analytics
- Key topic extraction
- Automated follow-up suggestions

---

## 💬 Real-time Chat System

### Stream Chat Integration

```mermaid
graph LR
    subgraph "Chat Features"
        Messages[Real-time Messages]
        FileShare[File Sharing]
        Reactions[Message Reactions]
        Threading[Message Threading]
    end

    subgraph "Stream Chat SDK"
        ChatClient[Chat Client]
        Channels[Channel Management]
        Permissions[User Permissions]
    end

    subgraph "Persistence"
        ChatHistory[Message History]
        SearchIndex[Search Indexing]
        Analytics[Chat Analytics]
    end

    Messages --> ChatClient
    FileShare --> ChatClient
    ChatClient --> Channels
    Channels --> ChatHistory
    ChatHistory --> SearchIndex
```

### Chat Features

**Message Types**

- Text messages with rich formatting
- File attachments (documents, images)
- Code snippets with syntax highlighting
- Meeting-specific ephemeral messages

**Advanced Capabilities**

- Message search across conversation history
- @mentions with notifications
- Custom emojis and reactions
- Message threading for organized discussions

---

## 📊 Analytics & Reporting

### Meeting Analytics Dashboard

```mermaid
graph TB
    subgraph "Data Collection"
        Participation[Participation Metrics]
        Engagement[Engagement Scoring]
        Duration[Meeting Duration]
        Topics[Topic Analysis]
    end

    subgraph "Processing Engine"
        ETL[Data Processing]
        ML[ML Algorithms]
        Aggregation[Data Aggregation]
    end

    subgraph "Visualization"
        Charts[Interactive Charts]
        Reports[Automated Reports]
        Insights[AI Insights]
    end

    Participation --> ETL
    Engagement --> ETL
    Duration --> ETL
    Topics --> ETL
    ETL --> ML
    ML --> Aggregation
    Aggregation --> Charts
    Aggregation --> Reports
    Aggregation --> Insights
```

### Key Metrics Tracked

**Participation Analytics**

- Speaking time distribution
- Interruption patterns
- Question/answer ratios
- Sentiment trends

**Meeting Effectiveness**

- Decision points identified
- Action items generated
- Follow-up completion rates
- Meeting ROI calculations

---

## 🛠️ Technology Stack

### Frontend Architecture

**Frontend Architecture**

**Core Framework**

- **Next.js**: React-based full-stack framework
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **GSAP**: Advanced animations and interactions

**State Management**

- **TanStack Query**: Server state management
- **React Hook Form**: Form state management
- **Zustand**: Global client state (when needed)

### Backend Services

**API Layer**

- **tRPC**: End-to-end typesafe APIs
- **Better Auth**: Authentication service
- **Zod**: Runtime type validation

**Database & ORM**

- **PostgreSQL**: Primary database (Neon)
- **Drizzle ORM**: Type-safe database queries
- **Connection pooling**: Optimized for serverless

### External Services

**Communication**

- **Stream Video SDK**: Video conferencing infrastructure
- **Stream Chat SDK**: Real-time messaging
- **WebRTC**: Peer-to-peer communication

**AI & ML**

- **OpenAI GPT-4**: Language model for agents
- **OpenAI Realtime API**: Real-time voice processing

**Infrastructure**

- **Vercel**: Hosting and deployment
- **Inngest**: Background job processing
- **Neon**: PostgreSQL database hosting

---

## 🚀 Deployment

**Vercel Deployment**

ConvoGenius is optimized for deployment on Vercel platform with seamless integration.

**Environment Variables (Production)**
Ensure all required environment variables are configured in your deployment platform.

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js app router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── agents/               # AI agent management
│   │   ├── meetings/             # Meeting management
│   │   └── dashboard/            # Analytics dashboard
│   ├── call/[meetingId]/         # Video call interface
│   └── api/                      # API routes
│       ├── auth/                 # Authentication endpoints
│       ├── trpc/                 # tRPC router
│       ├── webhook/              # Webhook handlers
│       └── inngest/              # Background jobs
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   ├── data-table.tsx            # Data table component
│   ├── empty-state.tsx           # Empty state component
│   └── error-state.tsx           # Error boundary component
├── db/                           # Database configuration
│   ├── index.ts                  # Database connection
│   └── schema.ts                 # Drizzle schema definitions
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Better Auth configuration
│   ├── auth-client.ts            # Client-side auth utilities
│   ├── stream-video.ts           # Stream Video setup
│   ├── stream-chat.ts            # Stream Chat setup
│   └── utils.ts                  # General utilities
├── modules/                      # Feature modules
│   ├── auth/                     # Authentication module
│   │   ├── ui/                   # Auth UI components
│   │   ├── schemas.ts            # Validation schemas
│   │   └── types.ts              # Type definitions
│   ├── agents/                   # AI agents module
│   │   ├── ui/                   # Agent UI components
│   │   ├── server/               # Server-side logic
│   │   ├── hooks/                # React hooks
│   │   ├── schemas.ts            # Validation schemas
│   │   └── types.ts              # Type definitions
│   ├── meetings/                 # Meetings module
│   │   ├── ui/                   # Meeting UI components
│   │   ├── server/               # Server-side logic
│   │   ├── hooks/                # React hooks
│   │   ├── schemas.ts            # Validation schemas
│   │   └── types.ts              # Type definitions
│   ├── call/                     # Video call module
│   │   └── ui/                   # Call UI components
│   ├── dashboard/                # Dashboard module
│   │   └── ui/                   # Dashboard components
│   └── landing/                  # Landing page module
│       └── ui/                   # Landing page components
├── trpc/                         # tRPC configuration
│   ├── init.ts                   # tRPC initialization
│   ├── client.tsx                # Client-side tRPC
│   ├── server.tsx                # Server-side tRPC
│   └── routers/                  # API route definitions
└── inngest/                      # Background job functions
    ├── client.ts                 # Inngest client
    └── functions.ts              # Job functions
```

---

## 🔧 Development Workflow

### Code Quality Standards

The project uses modern TypeScript with strict configuration and ESLint for code quality enforcement.

### Performance Optimization

**Core Web Vitals**

- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The project is configured for automated deployment through Vercel with continuous integration.

---

## 🌐 API Documentation

### tRPC Router Structure

```typescript
// API router structure
export const appRouter = router({
  agents: agentsRouter, // AI agent operations
  meetings: meetingsRouter, // Meeting operations
  premium: premiumRouter, // Premium/subscription features
});

export type AppRouter = typeof appRouter;
```

### Key API Endpoints

**Authentication**

```typescript
// Login
POST /api/auth/sign-in
Body: { email: string, password: string }

// OAuth
GET /api/auth/callback/google
GET /api/auth/callback/github

// Logout
POST /api/auth/sign-out
```

**Meetings Management**

```typescript
// Create meeting
meetings.create: {
  input: { name: string, agentId: string }
  output: Meeting
}

// Get meetings
meetings.getMany: {
  input: { page: number, pageSize: number, status?: MeetingStatus }
  output: { items: Meeting[], total: number, totalPages: number }
}

// Generate Stream tokens
meetings.generateToken: {
  output: string // JWT token for Stream Video
}
```

**AI Agents**

```typescript
// Create agent
agents.create: {
  input: { name: string, instructions: string }
  output: Agent
}

// Get agents
agents.getMany: {
  input: { page: number, pageSize: number }
  output: { items: Agent[], total: number, totalPages: number }
}
```

---

## 🔒 Security Considerations

### Data Protection

**Encryption**

- **Data at Rest**: AES-256 encryption
- **Data in Transit**: TLS 1.3
- **Database**: Encrypted connections (SSL)

**Privacy Compliance**

The application follows modern web security best practices with secure authentication and data protection.

### Security Monitoring

The application includes comprehensive security monitoring and audit capabilities.

### Vulnerability Management

The project includes automated dependency scanning and security monitoring to ensure code security and reliability.

---

## 📈 Performance Metrics

### Application Performance

ConvoGenius is optimized for performance with efficient bundle sizes and fast loading times.

### Database Performance

The application uses optimized database queries with proper indexing for optimal performance in a serverless environment.

---

## 🚨 Monitoring & Observability

### Application Monitoring

ConvoGenius includes comprehensive monitoring and error tracking capabilities integrated into the platform.

### Health Checks

The application includes built-in health check endpoints for monitoring system status and service availability.

---

## 🤝 Contributing Guidelines

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Commit your changes using conventional commits**
5. **Push to your branch**
6. **Open a Pull Request**

### Code Standards

**Commit Convention**

```
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

**TypeScript Guidelines**

- Use strict type checking
- Prefer interfaces over types for object shapes
- Use proper error handling with Result types
- Document complex type definitions

---

## 📞 Support & Documentation

### Getting Help

**Documentation**

- [Live Demo](https://hacksummit-22wy.vercel.app/)
- [GitHub Repository](https://github.com/ashutoshg-2005/ConvoGenius)

### Feature Requests

Use GitHub Issues with the `enhancement` label to request new features. Include:

- Clear use case description
- Expected behavior
- Potential implementation approach

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🏆 Acknowledgments

### Technology Partners

- **Stream**: Video and chat infrastructure
- **OpenAI**: AI language models
- **Vercel**: Hosting and deployment platform
- **Neon**: Serverless PostgreSQL database

### Open Source Libraries

- **Next.js**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling framework
- **tRPC**: Type-safe APIs
- **Drizzle ORM**: Database toolkit

---
