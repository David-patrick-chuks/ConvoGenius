import { Agent, ApiResponse, CreateAgentRequest, UpdateAgentRequest } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

// Mock agents data
let mockAgents: Agent[] = [
  {
    id: "1",
    name: "Customer Support Bot",
    description: "Handles customer inquiries and support tickets",
    type: "support",
    avatar: "/bot-1.jpg",
    status: "trained",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    lastActive: "2 hours ago",
    conversations: 1247,
    platforms: ["Website", "Slack"],
    sources: [
      { id: "1", name: "FAQ.pdf", type: "PDF", size: "2.3 MB", uploadDate: "2024-01-15", status: "processed" },
      { id: "2", name: "Product Manual.docx", type: "DOC", size: "1.8 MB", uploadDate: "2024-01-14", status: "processed" },
    ],
    apis: ["Search", "Express Agent"],
    tone: "friendly",
    config: {
      searchEnabled: true,
      newsEnabled: false,
      expressAgentEnabled: true,
    },
  },
  {
    id: "2",
    name: "Content Writer",
    description: "Creates blog posts and marketing content",
    type: "content",
    avatar: "/bot-2.jpg",
    status: "training",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    lastActive: "1 day ago",
    conversations: 892,
    platforms: ["Discord", "Twitter"],
    sources: [
      { id: "3", name: "Company Guidelines.txt", type: "TXT", size: "0.5 MB", uploadDate: "2024-01-13", status: "processed" },
    ],
    apis: ["Search", "News"],
    tone: "techy",
    config: {
      searchEnabled: true,
      newsEnabled: true,
      expressAgentEnabled: false,
    },
  },
  {
    id: "3",
    name: "Sales Assistant",
    description: "Qualifies leads and schedules meetings",
    type: "sales",
    avatar: "/bot-3.jpg",
    status: "trained",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    lastActive: "30 minutes ago",
    conversations: 2156,
    platforms: ["Website", "Telegram"],
    sources: [],
    apis: ["Express Agent"],
    tone: "formal",
    config: {
      searchEnabled: false,
      newsEnabled: false,
      expressAgentEnabled: true,
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("id");

    if (agentId) {
      const agent = mockAgents.find(a => a.id === agentId);
      if (!agent) {
        return NextResponse.json(
          { success: false, error: "Agent not found" },
          { status: 404 }
        );
      }

      const response: ApiResponse<Agent> = {
        success: true,
        data: agent,
      };

      return NextResponse.json(response);
    }

    // Return all agents
    const response: ApiResponse<Agent[]> = {
      success: true,
      data: mockAgents,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Agents API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAgentRequest = await request.json();
    
    const newAgent: Agent = {
      id: (mockAgents.length + 1).toString(),
      name: body.name,
      description: body.description,
      type: body.type as any,
      status: "training",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversations: 0,
      platforms: [],
      sources: [],
      apis: [],
      tone: body.tone as any,
      config: body.config,
    };

    mockAgents.push(newAgent);

    // Simulate training completion after 3 seconds
    setTimeout(() => {
      const agentIndex = mockAgents.findIndex(a => a.id === newAgent.id);
      if (agentIndex !== -1) {
        mockAgents[agentIndex].status = "trained";
        mockAgents[agentIndex].updatedAt = new Date().toISOString();
      }
    }, 3000);

    const response: ApiResponse<Agent> = {
      success: true,
      data: newAgent,
      message: "Agent created successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Agents API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateAgentRequest = await request.json();
    
    const agentIndex = mockAgents.findIndex(a => a.id === body.id);
    if (agentIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    mockAgents[agentIndex] = {
      ...mockAgents[agentIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    const response: ApiResponse<Agent> = {
      success: true,
      data: mockAgents[agentIndex],
      message: "Agent updated successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Agents API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("id");

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "Agent ID is required" },
        { status: 400 }
      );
    }

    const agentIndex = mockAgents.findIndex(a => a.id === agentId);
    if (agentIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    mockAgents.splice(agentIndex, 1);

    const response: ApiResponse<null> = {
      success: true,
      message: "Agent deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Agents API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
