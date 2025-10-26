import { NextRequest, NextResponse } from "next/server";
import { LoginRequest, RegisterRequest, AuthResponse, User, ApiResponse } from "@/types/api";

// Mock user data
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    company: "Acme Corp",
    bio: "AI enthusiast and developer",
    avatar: "/placeholder-avatar.jpg",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
];

// Mock authentication (in real app, use proper JWT and password hashing)
const generateToken = (userId: string): string => {
  return `mock_token_${userId}_${Date.now()}`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, confirmPassword } = body;

    // Handle login
    if (email && password && !name) {
      const loginData: LoginRequest = { email, password };
      
      const user = mockUsers.find(u => u.email === loginData.email);
      if (!user || password !== "password123") {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const token = generateToken(user.id);
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          user,
          token,
        },
      };

      return NextResponse.json(response);
    }

    // Handle registration
    if (name && email && password && confirmPassword) {
      const registerData: RegisterRequest = { name, email, password, confirmPassword };
      
      if (password !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: "Passwords do not match" },
          { status: 400 }
        );
      }

      if (mockUsers.find(u => u.email === registerData.email)) {
        return NextResponse.json(
          { success: false, error: "User already exists" },
          { status: 409 }
        );
      }

      const newUser: User = {
        id: (mockUsers.length + 1).toString(),
        name: registerData.name,
        email: registerData.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUsers.push(newUser);
      const token = generateToken(newUser.id);
      
      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          user: newUser,
          token,
        },
      };

      return NextResponse.json(response);
    }

    return NextResponse.json(
      { success: false, error: "Invalid request data" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Auth API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = token.split("_")[2]; // Extract user ID from mock token
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Auth API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
