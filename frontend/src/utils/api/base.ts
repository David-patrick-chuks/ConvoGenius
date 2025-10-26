import { ApiResponse } from '@/types/api';

export class BaseApiClient {
  protected static baseUrl = "/api";

  // Helper method to get headers with wallet address
  protected static getHeaders(walletAddress: string) {
    return {
      "Content-Type": "application/json",
      "walletAddress": walletAddress,
    };
  }

  // Generic method to handle API calls
  protected static async makeRequest<T>(
    url: string,
    options: RequestInit,
    walletAddress?: string
  ): Promise<ApiResponse<T>> {
    try {
      const headers = walletAddress ? this.getHeaders(walletAddress) : { "Content-Type": "application/json" };
      
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: { ...headers, ...options.headers },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Request failed");
      }

      return await response.json();
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // GET request helper
  protected static async get<T>(
    url: string,
    walletAddress: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const fullUrl = `${url}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return this.makeRequest<T>(fullUrl, {
      method: "GET",
    }, walletAddress);
  }

  // POST request helper
  protected static async post<T>(
    url: string,
    walletAddress: string,
    data?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }, walletAddress);
  }

  // PUT request helper
  protected static async put<T>(
    url: string,
    walletAddress: string,
    data?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }, walletAddress);
  }

  // DELETE request helper
  protected static async delete<T>(
    url: string,
    walletAddress: string
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: "DELETE",
    }, walletAddress);
  }
}
