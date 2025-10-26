# CortexDesk Frontend API Documentation

This document describes the Next.js API routes and client structure for the CortexDesk frontend application.

## API Structure

The application uses Next.js API routes (`/api/*`) with mock data to simulate backend functionality. All API routes follow a consistent pattern and return standardized responses.

### Base API Response Format

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Available API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth` - Login or Register
- `GET /api/auth` - Get current user (requires Bearer token)

### Agents (`/api/agents`)
- `GET /api/agents` - Get all agents
- `GET /api/agents?id={agentId}` - Get specific agent
- `POST /api/agents` - Create new agent
- `PUT /api/agents` - Update agent
- `DELETE /api/agents?id={agentId}` - Delete agent

### Chat (`/api/chat`)
- `GET /api/chat?agentId={agentId}` - Get chat messages
- `POST /api/chat` - Send message to agent

### Deployments (`/api/deployments`)
- `GET /api/deployments` - Get all deployments
- `GET /api/deployments?agentId={agentId}` - Get deployments for agent
- `GET /api/deployments?platform={platform}` - Get deployments for platform
- `POST /api/deployments` - Create new deployment
- `PUT /api/deployments?id={deploymentId}` - Update deployment
- `DELETE /api/deployments?id={deploymentId}` - Delete deployment
- `OPTIONS /api/deployments` - Get available platforms

### Resources (`/api/resources`)
- `GET /api/resources` - Get all resources
- `GET /api/resources?id={resourceId}` - Get specific resource
- `GET /api/resources?agentId={agentId}` - Get resources for agent
- `GET /api/resources?type={type}` - Get resources by type
- `POST /api/resources` - Upload new resource (multipart/form-data)
- `PUT /api/resources?id={resourceId}` - Update resource
- `DELETE /api/resources?id={resourceId}` - Delete resource

### Analytics (`/api/analytics`)
- `GET /api/analytics` - Get analytics data
- `GET /api/analytics?agentId={agentId}` - Get analytics for agent
- `GET /api/analytics?platform={platform}` - Get analytics for platform
- `GET /api/analytics?period={period}` - Get analytics for period (7d, 30d, 90d)

### Settings (`/api/settings`)
- `GET /api/settings?type=settings` - Get user settings
- `GET /api/settings?type=apikeys` - Get API keys
- `GET /api/settings?type=usage` - Get API usage stats
- `POST /api/settings?type=settings` - Update user settings
- `POST /api/settings?type=apikey` - Add new API key
- `POST /api/settings?type=changepassword` - Change password
- `PUT /api/settings?type=apikey&id={id}` - Update API key
- `DELETE /api/settings?type=apikey&id={id}` - Delete API key

### Health (`/api/health`)
- `GET /api/health` - Get system health status

## API Client Usage

The application provides a centralized API client (`cortexDeskApiClient`) that can be imported and used throughout the application:

```typescript
import { cortexDeskApiClient } from "@/utils/api";

// Get all agents
const response = await cortexDeskApiClient.agents.getAgents();
if (response.success && response.data) {
  console.log(response.data);
}

// Create a new agent
const newAgent = await cortexDeskApiClient.agents.createAgent({
  name: "My Agent",
  description: "Agent description",
  type: "support",
  tone: "friendly",
  config: {
    searchEnabled: true,
    newsEnabled: false,
    expressAgentEnabled: true,
  },
});

// Send a chat message
const message = await cortexDeskApiClient.chat.sendMessage({
  agentId: "1",
  message: "Hello!",
});
```

## Mock Data

All API endpoints return mock data that simulates real backend functionality:

- **Agents**: Pre-populated with 3 sample agents
- **Chat Messages**: Sample conversations for each agent
- **Deployments**: Mock deployment configurations
- **Resources**: Sample file uploads and processing status
- **Analytics**: Generated statistics and metrics
- **Settings**: Default user preferences and API keys

## Authentication

The mock authentication system uses simple token-based authentication:

- Login with any email and password "password123"
- Registration creates a new user account
- Tokens are returned in the format: `mock_token_{userId}_{timestamp}`

## File Uploads

The resources API supports file uploads with the following constraints:

- **Supported types**: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, ZIP
- **Size limit**: 10MB per file
- **Processing**: Files are marked as "processing" initially, then "processed" after 2 seconds

## Error Handling

All API endpoints include proper error handling and return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid token)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Development Notes

- All API routes are located in `src/app/api/`
- API clients are in `src/utils/api/`
- Types are defined in `src/types/api.ts`
- Mock data is generated within each API route
- The system is designed to be easily replaceable with real backend endpoints
