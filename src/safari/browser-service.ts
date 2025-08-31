import browser from 'webextension-polyfill';
import { Request } from '../types';

export interface NetworkRequest {
  url: string;
  method: string;
  headers: { name: string; value: string }[];
  postData?: { text: string };
  timestamp: number;
}

export interface NetworkResponse {
  status: number;
  headers: { name: string; value: string }[];
  content: { text?: string; encoding?: string };
}

export interface CapturedRequest {
  request: NetworkRequest;
  response: NetworkResponse;
  time?: number;
}

export type RequestListener = (request: Request) => void;

/**
 * Safari Browser Service
 * Handles network request capture via content script and background service worker
 */
export class SafariBrowserService {
  private listeners: RequestListener[] = [];
  private port: browser.Runtime.Port | null = null;

  constructor() {
    this.connectToBackground();
  }

  /**
   * Connect to Safari background service worker
   */
  private connectToBackground(): void {
    try {
      this.port = browser.runtime.connect({ name: 'safari-devtools-panel' });
      
      this.port.onMessage.addListener((message: any) => {
        console.log('📨 Safari DevTools received message from background:', message.type);
        
        if (message.type === 'NETWORK_REQUEST_CAPTURED') {
          console.log('🔗 Safari DevTools received UCAN request from content script');
          const request = this.convertCapturedRequestToSafariFormat(message.data);
          
          console.log('🚀 Safari Processing captured request:', {
            url: request.request.url,
            method: request.request.method,
            status: request.response.status,
            contentType: request.response.content.mimeType,
            timestamp: new Date().toISOString()
          });
          
          this.notifyListeners(request);
        }
        
        if (message.type === 'STORED_REQUESTS') {
          console.log(`📥 Safari Loading ${message.data.length} stored requests`);
          message.data.forEach((stored: any) => {
            const request = this.convertCapturedRequestToSafariFormat(stored.data);
            this.notifyListeners(request);
          });
        }
      });

      this.port.onDisconnect.addListener(() => {
        console.log('🔌 Safari Background connection closed');
        this.port = null;
      });
      
      console.log('🔗 Safari Connected to background service worker');
    } catch (error) {
      console.warn('⚠️ Failed to connect to Safari background script:', error);
    }
  }

  /**
   * Convert content script captured request to Safari HAR format
   */
  private convertCapturedRequestToSafariFormat(captured: CapturedRequest): Request {
    // Create a HAR-like entry for Safari extension consumption
    const harEntry: any = {
      request: {
        url: captured.request.url,
        method: captured.request.method,
        headers: captured.request.headers,
        postData: captured.request.postData ? {
          mimeType: 'application/octet-stream',
          text: captured.request.postData.text
        } : undefined,
        httpVersion: 'HTTP/1.1',
        queryString: [],
        cookies: [],
        bodySize: captured.request.postData?.text?.length || 0,
        headersSize: 0
      },
      response: {
        status: captured.response.status,
        statusText: this.getStatusText(captured.response.status),
        headers: captured.response.headers,
        content: {
          size: captured.response.content.text?.length || 0,
          mimeType: this.getMimeTypeFromHeaders(captured.response.headers),
          text: captured.response.content.text,
          encoding: captured.response.content.encoding
        },
        httpVersion: 'HTTP/1.1',
        cookies: [],
        redirectURL: '',
        headersSize: 0,
        bodySize: captured.response.content.text?.length || 0
      },
      cache: {},
      timings: {
        send: 0,
        wait: captured.time || 0,
        receive: 0
      },
      time: captured.time || 0,
      startedDateTime: new Date(captured.request.timestamp).toISOString()
    };

    return harEntry;
  }

  /**
   * Get HTTP status text from status code
   */
  private getStatusText(status: number): string {
    const statusTexts: { [key: number]: string } = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error'
    };
    return statusTexts[status] || 'Unknown';
  }

  /**
   * Extract MIME type from response headers
   */
  private getMimeTypeFromHeaders(headers: { name: string; value: string }[]): string {
    const contentTypeHeader = headers.find(h => h.name.toLowerCase() === 'content-type');
    return contentTypeHeader?.value.split(';')[0] || 'text/plain';
  }

  /**
   * Add listener for network requests
   */
  public addRequestListener(listener: RequestListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener for network requests
   */
  public removeRequestListener(listener: RequestListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of a new request
   */
  private notifyListeners(request: Request): void {
    this.listeners.forEach(listener => listener(request));
  }

  /**
   * Get initial stored requests from background
   */
  public getInitialRequests(): Promise<Request[]> {
    return new Promise(async (resolve) => {
      try {
        const response = await browser.runtime.sendMessage({ type: 'GET_STORED_REQUESTS' });
        if (response && (response as any).type === 'STORED_REQUESTS') {
          const storedRequests: any[] = Array.isArray((response as any).data) ? (response as any).data : [];
          console.log(`📥 Safari Retrieved ${storedRequests.length} stored requests`);
          
          const requests = storedRequests.map((stored: any) => 
            this.convertCapturedRequestToSafariFormat(stored.data)
          );
          resolve(requests);
        } else {
          resolve([]);
        }
      } catch (error) {
        console.warn('⚠️ Failed to get Safari stored requests:', error);
        resolve([]);
      }
    });
  }

  /**
   * Setup Safari content script listeners (no-op, handled by background)
   */
  public setupSafariListeners(): (() => void) | null {
    // Content script listeners are handled by the background service worker
    console.log('📱 Safari mode: Using background service worker for network capture');
    return null;
  }

  /**
   * Clear stored requests
   */
  public async clearStoredRequests(): Promise<void> {
    try {
      await browser.runtime.sendMessage({ type: 'CLEAR_STORED_REQUESTS' });
      console.log('🗑️ Safari stored requests cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear Safari stored requests:', error);
    }
  }
}

// Singleton instance for Safari
export const safariBrowserService = new SafariBrowserService();
