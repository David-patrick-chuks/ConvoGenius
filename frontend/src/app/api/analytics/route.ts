import { Analytics, ApiResponse } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const platform = searchParams.get("platform");
    const period = searchParams.get("period") || "30d";

    // Mock analytics data
    const mockAnalytics: Analytics = {
      totalViews: 24185,
      uniqueVisitors: 13255,
      totalChats: 2139,
      avgResponseTime: "1.6s",
      satisfactionRate: 91.2,
      platformBreakdown: {
        "Website": 15420,
        "Slack": 8765,
        "Discord": 5432,
        "Telegram": 2109,
        "Twitter": 1876,
        "Email": 1234,
      },
      dailyStats: generateDailyStats(period),
    };

    // Filter by agent if specified
    if (agentId) {
      // Scale down the numbers for individual agent
      mockAnalytics.totalViews = Math.floor(mockAnalytics.totalViews * 0.3);
      mockAnalytics.uniqueVisitors = Math.floor(mockAnalytics.uniqueVisitors * 0.3);
      mockAnalytics.totalChats = Math.floor(mockAnalytics.totalChats * 0.3);
    }

    // Filter by platform if specified
    if (platform) {
      const platformViews = mockAnalytics.platformBreakdown[platform] || 0;
      mockAnalytics.totalViews = platformViews;
      mockAnalytics.uniqueVisitors = Math.floor(platformViews * 0.6);
      mockAnalytics.totalChats = Math.floor(platformViews * 0.1);
    }

    const response: ApiResponse<Analytics> = {
      success: true,
      data: mockAnalytics,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate daily stats
function generateDailyStats(period: string): Array<{
  date: string;
  views: number;
  chats: number;
  visitors: number;
}> {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const stats = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate random but realistic data
    const baseViews = 200 + Math.random() * 300;
    const views = Math.floor(baseViews + Math.sin(i * 0.3) * 100);
    const visitors = Math.floor(views * (0.5 + Math.random() * 0.3));
    const chats = Math.floor(visitors * (0.1 + Math.random() * 0.2));

    stats.push({
      date: date.toISOString().split('T')[0],
      views,
      chats,
      visitors,
    });
  }

  return stats;
}
