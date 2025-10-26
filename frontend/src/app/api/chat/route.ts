import { ApiResponse, ChatMessage, SendMessageRequest } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

// Mock chat messages data
const mockMessages: Record<string, ChatMessage[]> = {
  "1": [
    {
      id: "1",
      agentId: "1",
      type: "user",
      content: "Hi, I'm having trouble with my order. Can you help me?",
      timestamp: "2024-01-15T14:30:00Z",
    },
    {
      id: "2",
      agentId: "1",
      type: "agent",
      content: "Hello! I'd be happy to help you with your order. Could you please provide me with your order number or the email address you used when placing the order?",
      timestamp: "2024-01-15T14:30:15Z",
      apiUsed: "Express Agent",
    },
    {
      id: "3",
      agentId: "1",
      type: "user",
      content: "My order number is #12345",
      timestamp: "2024-01-15T14:31:00Z",
    },
    {
      id: "4",
      agentId: "1",
      type: "agent",
      content: "Thank you! I found your order #12345. It shows that your package was shipped yesterday and is currently in transit. You should receive it within 2-3 business days. Would you like me to send you the tracking information?",
      timestamp: "2024-01-15T14:31:30Z",
      apiUsed: "Search",
    },
  ],
  "2": [
    {
      id: "5",
      agentId: "2",
      type: "user",
      content: "Can you help me write a blog post about AI trends?",
      timestamp: "2024-01-15T10:00:00Z",
    },
    {
      id: "6",
      agentId: "2",
      type: "agent",
      content: "I'd be happy to help you write a blog post about AI trends! Let me gather the latest information for you.",
      timestamp: "2024-01-15T10:00:10Z",
      apiUsed: "News",
    },
  ],
  "3": [
    {
      id: "7",
      agentId: "3",
      type: "user",
      content: "I'm interested in your premium plan",
      timestamp: "2024-01-15T16:00:00Z",
    },
    {
      id: "8",
      agentId: "3",
      type: "agent",
      content: "Great! I'd love to tell you more about our premium plan. Let me schedule a call with our sales team to discuss the features and pricing in detail.",
      timestamp: "2024-01-15T16:00:20Z",
      apiUsed: "Express Agent",
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "Agent ID is required" },
        { status: 400 }
      );
    }

    const messages = mockMessages[agentId] || [];

    const response: ApiResponse<ChatMessage[]> = {
      success: true,
      data: messages,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();
    
    if (!body.agentId || !body.message) {
      return NextResponse.json(
        { success: false, error: "Agent ID and message are required" },
        { status: 400 }
      );
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      agentId: body.agentId,
      type: "user",
      content: body.message,
      timestamp: new Date().toISOString(),
    };

    if (!mockMessages[body.agentId]) {
      mockMessages[body.agentId] = [];
    }

    mockMessages[body.agentId].push(userMessage);

    // Simulate agent response
    const agentResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      agentId: body.agentId,
      type: "agent",
      content: generateAgentResponse(body.message, body.agentId),
      timestamp: new Date().toISOString(),
      apiUsed: getRandomApi(),
    };

    mockMessages[body.agentId].push(agentResponse);

    const response: ApiResponse<ChatMessage> = {
      success: true,
      data: agentResponse,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions for mock responses
function generateAgentResponse(userMessage: string, agentId: string): string {
  const responses = {
    "1": [
      "I understand your concern. Let me help you with that.",
      "Based on the information provided, I can assist you further.",
      "I'll look into this for you right away.",
      "Let me check our system for the latest information.",
    ],
    "2": [
      "I can help you create engaging content on that topic.",
      "Let me research the latest trends and provide you with insights.",
      "I'll help you structure this content effectively.",
      "Based on current market trends, here's what I recommend.",
    ],
    "3": [
      "I'd be happy to discuss our solutions with you.",
      "Let me provide you with detailed information about our offerings.",
      "I'll connect you with the right person to help.",
      "Based on your needs, I can recommend the best option.",
    ],
  };

  const agentResponses = responses[agentId as keyof typeof responses] || responses["1"];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

function getRandomApi(): string {
  const apis = ["Search", "News", "Express Agent"];
  return apis[Math.floor(Math.random() * apis.length)];
}
