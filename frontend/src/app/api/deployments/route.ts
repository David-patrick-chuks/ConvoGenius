import { ApiResponse, Deployment, DeploymentConfig } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

// Mock deployments data
let mockDeployments: Deployment[] = [
  {
    id: "1",
    agentId: "1",
    platform: "website",
    status: "active",
    config: {
      url: "https://example.com",
      embedCode: "<script src='https://cortexdesk.com/embed/support-bot-123.js'></script>",
    },
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    stats: {
      totalViews: 15420,
      uniqueVisitors: 8934,
      totalChats: 1247,
      avgResponseTime: "1.2s",
      satisfactionRate: 94.2,
    },
  },
  {
    id: "2",
    agentId: "1",
    platform: "slack",
    status: "active",
    config: {
      workspaceId: "T1234567890",
      channelId: "C1234567890",
    },
    createdAt: "2024-01-12T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    stats: {
      totalViews: 8765,
      uniqueVisitors: 4321,
      totalChats: 892,
      avgResponseTime: "1.5s",
      satisfactionRate: 87.5,
    },
  },
  {
    id: "3",
    agentId: "2",
    platform: "discord",
    status: "inactive",
    config: {
      serverId: "123456789012345678",
      channelId: "987654321098765432",
    },
    createdAt: "2024-01-08T00:00:00Z",
    updatedAt: "2024-01-14T00:00:00Z",
    stats: {
      totalViews: 5432,
      uniqueVisitors: 2109,
      totalChats: 456,
      avgResponseTime: "2.1s",
      satisfactionRate: 82.3,
    },
  },
];

const deploymentPlatforms = [
  {
    id: "website",
    name: "Website Embed",
    description: "Embed your agent on any website",
    connected: true,
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Deploy as a Telegram bot",
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Integrate with Slack workspace",
    connected: true,
  },
  {
    id: "discord",
    name: "Discord",
    description: "Deploy as a Discord bot",
    connected: false,
  },
  {
    id: "twitter",
    name: "Twitter/X",
    description: "Automate Twitter interactions",
    connected: false,
  },
  {
    id: "hashnode",
    name: "Hashnode",
    description: "Connect to your Hashnode blog",
    connected: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Integrate with Notion workspace",
    connected: false,
  },
  {
    id: "email",
    name: "Email Agent",
    description: "Automated email responses",
    connected: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const platform = searchParams.get("platform");

    if (agentId) {
      const deployments = mockDeployments.filter(d => d.agentId === agentId);
      const response: ApiResponse<Deployment[]> = {
        success: true,
        data: deployments,
      };
      return NextResponse.json(response);
    }

    if (platform) {
      const deployments = mockDeployments.filter(d => d.platform === platform);
      const response: ApiResponse<Deployment[]> = {
        success: true,
        data: deployments,
      };
      return NextResponse.json(response);
    }

    // Return all deployments
    const response: ApiResponse<Deployment[]> = {
      success: true,
      data: mockDeployments,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Deployments API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DeploymentConfig = await request.json();
    
    if (!body.platform || !body.config) {
      return NextResponse.json(
        { success: false, error: "Platform and config are required" },
        { status: 400 }
      );
    }

    const newDeployment: Deployment = {
      id: (mockDeployments.length + 1).toString(),
      agentId: "1", // Default agent ID for now
      platform: body.platform,
      status: "active",
      config: body.config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        totalViews: 0,
        uniqueVisitors: 0,
        totalChats: 0,
        avgResponseTime: "0s",
        satisfactionRate: 0,
      },
    };

    mockDeployments.push(newDeployment);

    const response: ApiResponse<Deployment> = {
      success: true,
      data: newDeployment,
      message: "Deployment created successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Deployments API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("id");
    const body = await request.json();

    if (!deploymentId) {
      return NextResponse.json(
        { success: false, error: "Deployment ID is required" },
        { status: 400 }
      );
    }

    const deploymentIndex = mockDeployments.findIndex(d => d.id === deploymentId);
    if (deploymentIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Deployment not found" },
        { status: 404 }
      );
    }

    mockDeployments[deploymentIndex] = {
      ...mockDeployments[deploymentIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    const response: ApiResponse<Deployment> = {
      success: true,
      data: mockDeployments[deploymentIndex],
      message: "Deployment updated successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Deployments API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("id");

    if (!deploymentId) {
      return NextResponse.json(
        { success: false, error: "Deployment ID is required" },
        { status: 400 }
      );
    }

    const deploymentIndex = mockDeployments.findIndex(d => d.id === deploymentId);
    if (deploymentIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Deployment not found" },
        { status: 404 }
      );
    }

    mockDeployments.splice(deploymentIndex, 1);

    const response: ApiResponse<null> = {
      success: true,
      message: "Deployment deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Deployments API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get available platforms
export async function OPTIONS(request: NextRequest) {
  try {
    const response: ApiResponse<typeof deploymentPlatforms> = {
      success: true,
      data: deploymentPlatforms,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Deployments API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
