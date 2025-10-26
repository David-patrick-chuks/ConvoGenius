import { ApiKey, ApiResponse, ChangePasswordRequest, UserSettings } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

// Mock user settings
let mockUserSettings: UserSettings = {
  theme: "light",
  notifications: {
    email: true,
    push: false,
    agentTraining: true,
  },
  privacy: {
    dataAnalytics: true,
    marketingEmails: false,
  },
};

// Mock API keys
let mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "You.com Search API",
    key: "you_sk_1234567890abcdef",
    status: "active",
    lastUsed: "2 hours ago",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "You.com News API",
    key: "you_nk_abcdef1234567890",
    status: "active",
    lastUsed: "1 day ago",
    createdAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    name: "You.com Express Agent",
    key: "you_ea_9876543210fedcba",
    status: "inactive",
    lastUsed: "1 week ago",
    createdAt: "2024-01-03T00:00:00Z",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "settings") {
      const response: ApiResponse<UserSettings> = {
        success: true,
        data: mockUserSettings,
      };
      return NextResponse.json(response);
    }

    if (type === "apikeys") {
      const response: ApiResponse<ApiKey[]> = {
        success: true,
        data: mockApiKeys,
      };
      return NextResponse.json(response);
    }

    if (type === "usage") {
      const usageData = {
        requestsToday: 1247,
        requestsThisMonth: 45892,
        monthlyLimit: 100000,
        usagePercentage: 45.9,
      };
      
      const response: ApiResponse<typeof usageData> = {
        success: true,
        data: usageData,
      };
      return NextResponse.json(response);
    }

    return NextResponse.json(
      { success: false, error: "Invalid type parameter" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Settings API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "settings") {
      const body: Partial<UserSettings> = await request.json();
      
      mockUserSettings = {
        ...mockUserSettings,
        ...body,
      };

      const response: ApiResponse<UserSettings> = {
        success: true,
        data: mockUserSettings,
        message: "Settings updated successfully",
      };

      return NextResponse.json(response);
    }

    if (type === "apikey") {
      const body = await request.json();
      
      const newApiKey: ApiKey = {
        id: (mockApiKeys.length + 1).toString(),
        name: body.name,
        key: body.key,
        status: "active",
        lastUsed: "Never",
        createdAt: new Date().toISOString(),
      };

      mockApiKeys.push(newApiKey);

      const response: ApiResponse<ApiKey> = {
        success: true,
        data: newApiKey,
        message: "API key added successfully",
      };

      return NextResponse.json(response);
    }

    if (type === "changepassword") {
      const body: ChangePasswordRequest = await request.json();
      
      if (body.newPassword !== body.confirmPassword) {
        return NextResponse.json(
          { success: false, error: "New passwords do not match" },
          { status: 400 }
        );
      }

      if (body.currentPassword !== "password123") {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      const response: ApiResponse<null> = {
        success: true,
        message: "Password changed successfully",
      };

      return NextResponse.json(response);
    }

    return NextResponse.json(
      { success: false, error: "Invalid type parameter" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Settings API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (type === "apikey" && id) {
      const body = await request.json();
      
      const apiKeyIndex = mockApiKeys.findIndex(k => k.id === id);
      if (apiKeyIndex === -1) {
        return NextResponse.json(
          { success: false, error: "API key not found" },
          { status: 404 }
        );
      }

      mockApiKeys[apiKeyIndex] = {
        ...mockApiKeys[apiKeyIndex],
        ...body,
      };

      const response: ApiResponse<ApiKey> = {
        success: true,
        data: mockApiKeys[apiKeyIndex],
        message: "API key updated successfully",
      };

      return NextResponse.json(response);
    }

    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Settings API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (type === "apikey" && id) {
      const apiKeyIndex = mockApiKeys.findIndex(k => k.id === id);
      if (apiKeyIndex === -1) {
        return NextResponse.json(
          { success: false, error: "API key not found" },
          { status: 404 }
        );
      }

      mockApiKeys.splice(apiKeyIndex, 1);

      const response: ApiResponse<null> = {
        success: true,
        message: "API key deleted successfully",
      };

      return NextResponse.json(response);
    }

    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Settings API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
