import { ApiResponse } from '@/types/api';

export class BaseApiClient {
  // Always call through Next.js API proxy
  protected static proxyPrefix = "/api/proxy";

  // Generic method to handle API calls
  protected static async makeRequest<T>(
    url: string,
    options: RequestInit,
    token?: string
  ): Promise<ApiResponse<T>> {
    try {
      const defaultHeaders: Record<string, string> = { };
      const contentTypeHeader = (options.body instanceof FormData) ? {} : { "Content-Type": "application/json" };
      const authHeader = token ? { "Authorization": `Bearer ${token}` } : {};
      
      const response = await fetch(`${this.proxyPrefix}${url}`, {
        ...options,
        headers: { ...defaultHeaders, ...contentTypeHeader, ...authHeader, ...(options.headers as any) },
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMsg = "Request failed";
        try {
          const errJson = await response.json();
          errorMsg = (errJson as any)?.error || (errJson as any)?.message || errorMsg;
        } catch {
          try {
            const text = await response.text();
            if (text) errorMsg = text;
          } catch {}
        }
        throw new Error(errorMsg);
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
