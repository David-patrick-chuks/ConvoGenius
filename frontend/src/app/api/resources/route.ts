import { ApiResponse, Resource } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

// Mock resources data
let mockResources: Resource[] = [
  {
    id: "1",
    name: "Customer FAQ.pdf",
    type: "PDF",
    size: "2.3 MB",
    uploadDate: "2024-01-15T00:00:00Z",
    linkedAgents: ["Customer Support Bot", "Sales Assistant"],
    status: "processed",
    url: "/uploads/customer-faq.pdf",
  },
  {
    id: "2",
    name: "Product Manual.docx",
    type: "DOC",
    size: "1.8 MB",
    uploadDate: "2024-01-14T00:00:00Z",
    linkedAgents: ["Customer Support Bot"],
    status: "processing",
    url: "/uploads/product-manual.docx",
  },
  {
    id: "3",
    name: "Company Guidelines.txt",
    type: "TXT",
    size: "0.5 MB",
    uploadDate: "2024-01-13T00:00:00Z",
    linkedAgents: ["Content Writer", "Customer Support Bot"],
    status: "processed",
    url: "/uploads/company-guidelines.txt",
  },
  {
    id: "4",
    name: "Training Materials.zip",
    type: "ZIP",
    size: "15.2 MB",
    uploadDate: "2024-01-12T00:00:00Z",
    linkedAgents: [],
    status: "processed",
    url: "/uploads/training-materials.zip",
  },
  {
    id: "5",
    name: "Logo.png",
    type: "PNG",
    size: "0.8 MB",
    uploadDate: "2024-01-11T00:00:00Z",
    linkedAgents: ["Content Writer"],
    status: "processed",
    url: "/uploads/logo.png",
  },
  {
    id: "6",
    name: "API Documentation.pdf",
    type: "PDF",
    size: "3.1 MB",
    uploadDate: "2024-01-10T00:00:00Z",
    linkedAgents: ["Technical Support Bot"],
    status: "processed",
    url: "/uploads/api-documentation.pdf",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("id");
    const agentId = searchParams.get("agentId");
    const type = searchParams.get("type");

    if (resourceId) {
      const resource = mockResources.find(r => r.id === resourceId);
      if (!resource) {
        return NextResponse.json(
          { success: false, error: "Resource not found" },
          { status: 404 }
        );
      }

      const response: ApiResponse<Resource> = {
        success: true,
        data: resource,
      };

      return NextResponse.json(response);
    }

    let filteredResources = mockResources;

    if (agentId) {
      filteredResources = filteredResources.filter(r => 
        r.linkedAgents.includes(agentId)
      );
    }

    if (type) {
      filteredResources = filteredResources.filter(r => 
        r.type.toLowerCase() === type.toLowerCase()
      );
    }

    const response: ApiResponse<Resource[]> = {
      success: true,
      data: filteredResources,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Resources API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const linkedAgents = formData.get("linkedAgents") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "image/png", "image/jpeg", "application/zip"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "File type not supported" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const newResource: Resource = {
      id: (mockResources.length + 1).toString(),
      name: file.name,
      type: getFileType(file.name),
      size: formatFileSize(file.size),
      uploadDate: new Date().toISOString(),
      linkedAgents: linkedAgents ? JSON.parse(linkedAgents) : [],
      status: "processing",
      url: `/uploads/${file.name}`,
    };

    mockResources.push(newResource);

    // Simulate processing completion
    setTimeout(() => {
      const resourceIndex = mockResources.findIndex(r => r.id === newResource.id);
      if (resourceIndex !== -1) {
        mockResources[resourceIndex].status = "processed";
      }
    }, 2000);

    const response: ApiResponse<Resource> = {
      success: true,
      data: newResource,
      message: "Resource uploaded successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Resources API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("id");
    const body = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: "Resource ID is required" },
        { status: 400 }
      );
    }

    const resourceIndex = mockResources.findIndex(r => r.id === resourceId);
    if (resourceIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    mockResources[resourceIndex] = {
      ...mockResources[resourceIndex],
      ...body,
    };

    const response: ApiResponse<Resource> = {
      success: true,
      data: mockResources[resourceIndex],
      message: "Resource updated successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Resources API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("id");

    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: "Resource ID is required" },
        { status: 400 }
      );
    }

    const resourceIndex = mockResources.findIndex(r => r.id === resourceId);
    if (resourceIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    mockResources.splice(resourceIndex, 1);

    const response: ApiResponse<null> = {
      success: true,
      message: "Resource deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Resources API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function getFileType(filename: string): string {
  const extension = filename.split('.').pop()?.toUpperCase();
  const typeMap: Record<string, string> = {
    'PDF': 'PDF',
    'DOC': 'DOC',
    'DOCX': 'DOC',
    'TXT': 'TXT',
    'PNG': 'PNG',
    'JPG': 'JPG',
    'JPEG': 'JPG',
    'ZIP': 'ZIP',
  };
  return typeMap[extension || ''] || 'FILE';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
