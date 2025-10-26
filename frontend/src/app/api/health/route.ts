import { ApiResponse, HealthStatus } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Mock health status data
    const healthStatus: HealthStatus = {
      status: "healthy",
      services: {
        database: { status: "healthy" },
        redis: { status: "healthy" },
        api: { status: "healthy" },
        auth: { status: "healthy" },
      },
      uptime: process.uptime(),
      responseTime: Math.random() * 100 + 50, // Mock response time
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };

    const response: ApiResponse<HealthStatus> = {
      success: true,
      data: healthStatus,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error checking health:", error);
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
