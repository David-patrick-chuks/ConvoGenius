
# 🧠 ConvoGenius Documentation

This documentation provides an overview of **ConvoGenius** — an **enterprise-grade AI-powered video conferencing platform** built for the **You.com Hackathon (Track 1: Enterprise-Grade Solutions)**.

It showcases intelligent meeting automation using **You.com APIs** as the core retrieval and reasoning layer, integrated with **OpenAI GPT-4 Turbo**, **Stream SDKs**, and **tRPC** for a seamless and secure enterprise experience.

---

## 📑 Table of Contents

* [Executive Summary](#executive-summary)
* [System Architecture](#system-architecture)
* [Database Schema](#database-schema)
* [Authentication & Authorization](#authentication--authorization)
* [Video Conferencing](#video-conferencing)
* [AI Integration & Agent Framework](#ai-integration--agent-framework)
* [Real-time Chat System](#real-time-chat-system)
* [Analytics & Reporting](#analytics--reporting)
* [Technology Stack](#technology-stack)
* [Deployment](#deployment)
* [Project Structure](#project-structure)
* [Development Workflow](#development-workflow)
* [CI/CD Pipeline](#cicd-pipeline)
* [API Documentation](#api-documentation)
* [Security Considerations](#security-considerations)
* [Performance Metrics](#performance-metrics)
* [Monitoring & Observability](#monitoring--observability)
* [Contributing Guidelines](#contributing-guidelines)
* [Support & Documentation](#support--documentation)
* [License](#license)
* [Acknowledgments](#acknowledgments)

---

## 🧩 Executive Summary

**ConvoGenius** redefines enterprise collaboration by merging **AI, real-time communication**, and **search-powered intelligence**.

It enhances productivity with AI-driven meeting summaries, live transcription, and **You.com’s Retrieval-Augmented Generation (RAG)** integration to bring **contextual, external knowledge** directly into your meetings and post-meeting insights.

### 🎯 Core Value Propositions

* 🤖 **AI-First Meeting Experience:** Smart meeting agents powered by GPT-4 Turbo and grounded by You.com Search APIs.
* ⚡ **Real-Time Intelligence:** Live transcription, speaker identification, and sentiment detection.
* 🔒 **Enterprise Security:** End-to-end encryption with SOC2 Type II compliance.
* 🌐 **Scalable Integrations:** Built on modular APIs with You.com, OpenAI, and Stream SDKs.
* 📊 **Actionable Insights:** Automatic summaries and analytics enriched with live web and news data.

**Live Demo:** [https://hacksummit-22wy.vercel.app/](https://hacksummit-22wy.vercel.app/)
**Track:** You.com Hackathon — **Enterprise-Grade Solutions**

**You.com Endpoints Integrated:**

* `/v1/search`
* `/v1/search?livecrawl=web`
* `/v1/search?livecrawl=news`
* `/v1/agents/runs`
* `/v1/contents`

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
        AI[OpenAI GPT-4 Turbo]
        Transcription[Real-time Transcription]

        subgraph "You.com API Layer"
            YouSearch[/v1/search - Context Retrieval/]
            YouWeb[/v1/search?livecrawl=web - Web Crawl/]
            YouNews[/v1/search?livecrawl=news - News Feed/]
            YouAgent[/v1/agents/runs - Express Agent/]
            YouContent[/v1/contents - Content Extraction/]
        end
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

    AI --> YouSearch
    AI --> YouWeb
    AI --> YouNews
    AI --> YouAgent
    AI --> YouContent

    AI --> Webhook
    Webhook --> Analytics
```

---

## 🗃️ Database Schema

### Entity Relationship Diagram (ERD)

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

---

## 🔐 Authentication & Authorization

Multi-provider authentication via **Better Auth**, supporting Email/Password, Google, and GitHub OAuth.
Implements **JWT** for sessions, **CSRF protection**, and **Stream SDK tokens** for chat/video access.

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

---

## 🎥 Video Conferencing

Powered by **Stream Video SDK**, providing:

* High-quality video/audio calls
* Screen sharing and recording
* Live transcription and AI summaries

---

## 🧠 AI Integration & Agent Framework

The **AI Agent System** uses **OpenAI GPT-4 Turbo** augmented by **You.com APIs** for retrieval-augmented generation (RAG).
Agents dynamically pull real-time data from web, news, and content endpoints for context-aware responses.

### You.com Endpoints in Use

| Endpoint                    | Description                         |
| --------------------------- | ----------------------------------- |
| `/v1/search`                | Contextual knowledge retrieval      |
| `/v1/search?livecrawl=web`  | Latest web page content             |
| `/v1/search?livecrawl=news` | Live news stream data               |
| `/v1/agents/runs`           | Agent task execution                |
| `/v1/contents`              | Full content extraction & summaries |

### Architecture

```mermaid
graph TD
    subgraph "AI Agent System"
        Agent[AI Agent Instance]
        Instructions[Custom Instructions]
        Context[Meeting Context]
        Retrieval[You.com Retrieval]
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
    Agent --> Retrieval
    Retrieval --> GPT4
    Agent --> GPT4
    GPT4 --> Transcription
    GPT4 --> Summary
    GPT4 --> Insights
    Embeddings --> Context
```

---

## 💬 Real-time Chat System

Built on **Stream Chat SDK** — supports:

* Threaded messaging
* Reactions and mentions
* File sharing
* Post-meeting AI-assisted discussions

---

## 📊 Analytics & Reporting

* Real-time participation metrics
* Engagement insights
* Meeting summaries enriched with live **You.com news and web data**

---

## 🧰 Technology Stack

| Layer         | Tools                                |
| ------------- | ------------------------------------ |
| **Frontend**  | Next.js 14, TypeScript, Tailwind CSS |
| **Backend**   | tRPC, Drizzle ORM, PostgreSQL (Neon) |
| **AI / APIs** | OpenAI GPT-4 Turbo, You.com APIs     |
| **Comms**     | Stream Video & Chat SDKs             |
| **Infra**     | Vercel, Inngest, Neon DB             |

---

## 🚀 Deployment

Deploy via **Vercel**. Configure the following environment variables:

```bash
YOU_API_KEY=ydc-sk-your-you-api-key-here
YOU_API_BASE_URL=https://api.ydc-index.io

OPENAI_API_KEY=sk-your-openai-key-here
DATABASE_URL=your-database-url

GITHUB_CLIENT_ID=github-client-id
GITHUB_CLIENT_SECRET=github-client-secret

GOOGLE_CLIENT_ID=google-client-id
GOOGLE_CLIENT_SECRET=google-client-secret

NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app

NEXT_PUBLIC_STREAM_CHAT_API_KEY=your-stream-chat-api-key
STREAM_CHAT_SECRET_KEY=your-stream-chat-secret-key

NEXT_PUBLIC_SECRET_STREAM_VIDEO_API_KEY=your-stream-video-api-key
STREAM_VIDEO_SECRET_KEY=your-stream-video-secret-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
SMTP_FROM_NAME=ConvoGenius
SMTP_FROM_EMAIL=your-email@gmail.com
```

---

## ⚙️ CI/CD Pipeline

Automated through **GitHub Actions** and **Vercel** for build, lint, and deployment verification.

---

## 🔒 Security Considerations

* AES-256 encryption
* TLS 1.3 for all traffic
* Auth token rotation
* Regular vulnerability scans

---

## 📈 Performance Metrics

* Optimized queries with Drizzle ORM
* Lazy-loaded components
* Core Web Vitals: LCP < 2.5s, CLS < 0.1

---

## 🩺 Monitoring & Observability

* Inngest event logging
* Health checks and uptime tracking
* Error reporting with alerts

---

## 🤝 Contributing Guidelines

1. Fork the repository
2. Create a feature branch (`feat/your-feature`)
3. Commit following conventional commits
4. Open a Pull Request

---

## 🧾 Support & Documentation

* **Demo:** [https://hacksummit-22wy.vercel.app/](https://hacksummit-22wy.vercel.app/)
* **Repo:** [https://github.com/David-patrick-chuks/ConvoGenius](https://github.com/David-patrick-chuks/ConvoGenius)

---

## 🪪 License

MIT License © 2025 ConvoGenius Team

---

## 🙌 Acknowledgments

Built with ❤️ using:
**You.com**, **OpenAI**, **Stream**, **Vercel**, **Neon**, and **Inngest**

---