import { ApiResponse, Resource } from '@/types/api';
import { BaseApiClient } from './base';

export class ResourcesApiClient extends BaseApiClient {
  static async getResources(params?: { agentId?: string; status?: string; type?: string }, token?: string): Promise<ApiResponse<Resource[]>> {
    const query = new URLSearchParams();
    if (params?.agentId) query.append('agentId', params.agentId);
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    const qs = query.toString();
    return this.makeRequest<Resource[]>(`/api/resources${qs ? `?${qs}` : ''}`, { method: 'GET' }, token);
  }

  static async getResource(id: string, token?: string): Promise<ApiResponse<Resource>> {
    return this.makeRequest<Resource>(`/api/resources/${id}`, { method: 'GET' }, token);
  }

  static async uploadResource(file: File, linkedAgents?: string[], onProgress?: (progress: number) => void, token?: string): Promise<ApiResponse<Resource>> {
    const formData = new FormData();
    formData.append('file', file);
    if (linkedAgents) {
      for (const agentId of linkedAgents) formData.append('linkedAgents', agentId);
    }
    
    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `/api/proxy/api/resources`;
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({ success: true, data: response });
          } catch (e) {
            resolve({ success: true, data: xhr.responseText as any });
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject({ success: false, error: error.error || 'Upload failed' });
          } catch (e) {
            reject({ success: false, error: 'Upload failed' });
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject({ success: false, error: 'Network error during upload' });
      });

      xhr.open('POST', url);
      xhr.setRequestHeader('Accept', 'application/json');
      // Cookies are sent automatically with credentials
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  static async downloadResource(id: string, token?: string): Promise<void> {
    const url = `/api/proxy/api/resources/${id}/download`;
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/octet-stream',
      },
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Get filename from Content-Disposition header or use ID
    const disposition = response.headers.get('Content-Disposition');
    let filename = `resource-${id}`;
    if (disposition) {
      const filenameMatch = disposition.match(/filename="(.+)"/);
      if (filenameMatch) filename = filenameMatch[1];
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  static async updateResource(id: string, data: Partial<Resource>, token?: string): Promise<ApiResponse<Resource>> {
    return this.makeRequest<Resource>(`/api/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
  }

  static async deleteResource(id: string, token?: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/api/resources/${id}`, { method: 'DELETE' }, token);
  }
}
