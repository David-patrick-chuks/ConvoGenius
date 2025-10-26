import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/api';
import { BaseApiClient } from './base';

export class AuthApiClient extends BaseApiClient {
  static async login(loginData: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth', '', loginData);
  }

  static async register(registerData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth', '', registerData);
  }

  static async getCurrentUser(token: string): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/auth', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  static async logout(): Promise<ApiResponse<null>> {
    // In a real app, you might want to invalidate the token on the server
    return Promise.resolve({
      success: true,
      data: null,
      message: 'Logged out successfully',
    });
  }
}
