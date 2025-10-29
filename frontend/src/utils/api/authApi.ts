import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/api';
import { BaseApiClient } from './base';

export class AuthApiClient extends BaseApiClient {
  static async login(loginData: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  static async register(registerData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });
  }

  static async getCurrentUser(token: string): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/auth/me', {
      method: 'GET',
    }, token);
  }

  static async logout(): Promise<ApiResponse<null>> {
    return this.makeRequest<null>('/auth/logout', {
      method: 'POST'
    });
  }
}
