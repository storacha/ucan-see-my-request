import { Request, isChromeRequest } from './types';
import { isCarRequest } from './util';

export interface HARExportOptions {
  includeRequests: Request[];
  includeResponseBodies: boolean;
  includeTiming: boolean;
  customFields?: Record<string, any>;
}

export interface HAREntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    cookies: Array<any>;
    headersSize: number;
    bodySize: number;
    postData?: {
      mimeType: string;
      text: string;
      params?: Array<any>;
    };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    cookies: Array<any>;
    content: {
      size: number;
      mimeType: string;
      text?: string;
      encoding?: string;
    };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: any;
  timings: {
    blocked?: number;
    dns?: number;
    connect?: number;
    send: number;
    wait: number;
    receive: number;
    ssl?: number;
  };
  serverIPAddress?: string;
  connection?: string;
  comment?: string;
}

export interface HARLog {
  version: string;
  creator: {
    name: string;
    version: string;
  };
  browser?: {
    name: string;
    version: string;
  };
  pages?: Array<any>;
  entries: HAREntry[];
  comment?: string;
}

export interface Snapshot {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  requests: Request[];
  metadata: Record<string, any>;
}

export interface SnapshotMetadata {
  name: string;
  description?: string;
  tags?: string[];
  filters?: {
    status?: string[];
    timeRange?: {
      start: number;
      end: number;
    };
    urlPattern?: string;
  };
}

export interface ReplayOptions {
  request: Request;
  modifications?: {
    headers?: Record<string, string>;
    body?: string;
    url?: string;
    method?: string;
  };
  delay?: number;
}

export interface ReplayResult {
  success: boolean;
  response?: Response;
  error?: string;
  timing?: number;
}

export interface ExportFormat {
  type: 'postman' | 'curl' | 'javascript' | 'typescript' | 'python';
  name: string;
  description: string;
}

export function exportToHAR(options: HARExportOptions): string {
  const harLog: HARLog = {
    version: '1.2',
    creator: {
      name: 'UCan See My Request',
      version: '1.0.1'
    },
    browser: {
      name: 'Chrome',
      version: navigator.userAgent
    },
    entries: options.includeRequests.map(convertRequestToHAREntry)
  };

  return JSON.stringify(harLog, null, 2);
}

function convertRequestToHAREntry(request: Request): HAREntry {
  const startTime = new Date(request.startedDateTime || Date.now());
  
  return {
    startedDateTime: startTime.toISOString(),
    time: getRequestTiming(request) || 0,
    request: {
      method: request.request.method,
      url: request.request.url,
      httpVersion: 'HTTP/1.1',
      headers: request.request.headers.map(h => ({ name: h.name, value: h.value })),
      queryString: extractQueryParams(request.request.url),
      cookies: [],
      headersSize: -1,
      bodySize: request.request.postData?.text?.length || 0,
      postData: request.request.postData ? {
        mimeType: request.request.postData.mimeType || 'application/octet-stream',
        text: request.request.postData.text || '',
        params: request.request.postData.params || []
      } : undefined
    },
    response: {
      status: request.response.status,
      statusText: request.response.statusText || '',
      httpVersion: 'HTTP/1.1',
      headers: request.response.headers.map(h => ({ name: h.name, value: h.value })),
      cookies: [],
      content: {
        size: request.response.content.size || 0,
        mimeType: request.response.content.mimeType || 'application/octet-stream',
        text: request.response.content.text || '',
        encoding: request.response.content.encoding
      },
      redirectURL: request.response.redirectURL || '',
      headersSize: -1,
      bodySize: request.response.content.size || 0
    },
    cache: {},
    timings: {
      send: 0,
      wait: getRequestTiming(request) || 0,
      receive: 0
    },
    comment: isCarRequest(request) ? 'UCAN/CAR Request' : undefined
  };
}

function extractQueryParams(url: string): Array<{ name: string; value: string }> {
  try {
    const urlObj = new URL(url);
    return Array.from(urlObj.searchParams.entries()).map(([name, value]) => ({ name, value }));
  } catch {
    return [];
  }
}

function getRequestTiming(request: Request): number | null {
  if (isChromeRequest(request)) {
    return request.time || null;
  } else {
    const harEntry = request as chrome.devtools.network.HAREntry;
    return harEntry.time || null;
  }
}

export function createSnapshot(requests: Request[], metadata: SnapshotMetadata): Snapshot {
  return {
    id: generateId(),
    name: metadata.name,
    description: metadata.description,
    timestamp: Date.now(),
    requests: [...requests],
    metadata: {
      ...metadata,
      requestCount: requests.length,
      createdAt: new Date().toISOString()
    }
  };
}

export function saveSnapshot(snapshot: Snapshot): void {
  const snapshots = getSnapshots();
  snapshots.push(snapshot);
  localStorage.setItem('ucan_snapshots', JSON.stringify(snapshots));
}

export function getSnapshots(): Snapshot[] {
  const stored = localStorage.getItem('ucan_snapshots');
  return stored ? JSON.parse(stored) : [];
}

export function deleteSnapshot(snapshotId: string): void {
  const snapshots = getSnapshots().filter(s => s.id !== snapshotId);
  localStorage.setItem('ucan_snapshots', JSON.stringify(snapshots));
}

export function loadSnapshot(snapshotId: string): Snapshot | null {
  const snapshots = getSnapshots();
  return snapshots.find(s => s.id === snapshotId) || null;
}

export async function replayRequest(options: ReplayOptions): Promise<ReplayResult> {
  const startTime = Date.now();
  
  try {
    const { request, modifications = {}, delay = 0 } = options;
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const modifiedRequest = {
      ...request,
      request: {
        ...request.request,
        url: modifications.url || request.request.url,
        method: modifications.method || request.request.method,
        headers: modifications.headers 
          ? [...request.request.headers.filter(h => !modifications.headers![h.name]), 
             ...Object.entries(modifications.headers).map(([name, value]) => ({ name, value }))]
          : request.request.headers,
        postData: modifications.body 
          ? { 
              ...request.request.postData, 
              text: modifications.body,
              mimeType: request.request.postData?.mimeType || 'application/octet-stream'
            }
          : request.request.postData
      }
    } as Request;

    const response = await simulateRequest(modifiedRequest);
    
    return {
      success: true,
      response,
      timing: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timing: Date.now() - startTime
    };
  }
}

async function simulateRequest(request: Request): Promise<Response> {
  return new Response('Simulated response', {
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'Content-Type': 'application/json' })
  });
}

export function exportToPostman(requests: Request[]): string {
  const collection = {
    info: {
      name: 'UCAN Requests Collection',
      description: 'Exported from UCan See My Request',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: requests.map((request, index) => ({
      name: `Request ${index + 1}`,
      request: {
        method: request.request.method,
        header: request.request.headers.map(h => ({ key: h.name, value: h.value })),
        body: request.request.postData ? {
          mode: 'raw',
          raw: request.request.postData.text || '',
          options: {
            raw: {
              language: 'json'
            }
          }
        } : undefined,
        url: {
          raw: request.request.url,
          protocol: new URL(request.request.url).protocol.slice(0, -1),
          host: new URL(request.request.url).host.split('.'),
          path: new URL(request.request.url).pathname.split('/').filter(Boolean)
        }
      }
    }))
  };

  return JSON.stringify(collection, null, 2);
}

export function exportToCurl(request: Request): string {
  const headers = request.request.headers
    .map(h => `-H "${h.name}: ${h.value}"`)
    .join(' \\\n  ');
  
  const body = request.request.postData?.text 
    ? `-d '${request.request.postData.text}'`
    : '';
  
  return `curl -X ${request.request.method} \\
  ${headers} \\
  ${body} \\
  "${request.request.url}"`;
}

export function exportToJavaScript(request: Request): string {
  const headers = request.request.headers.reduce((acc, h) => {
    acc[h.name] = h.value;
    return acc;
  }, {} as Record<string, string>);
  
  const body = request.request.postData?.text;
  
  return `fetch('${request.request.url}', {
  method: '${request.request.method}',
  headers: ${JSON.stringify(headers, null, 2)},
  ${body ? `body: ${JSON.stringify(body)},` : ''}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
}

export function exportToTypeScript(request: Request): string {
  const headers = request.request.headers.reduce((acc, h) => {
    acc[h.name] = h.value;
    return acc;
  }, {} as Record<string, string>);
  
  const body = request.request.postData?.text;
  
  return `interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

const options: RequestOptions = {
  method: '${request.request.method}',
  headers: ${JSON.stringify(headers, null, 2)},
  ${body ? `body: ${JSON.stringify(body)},` : ''}
};

fetch('${request.request.url}', options)
  .then((response: Response) => response.json())
  .then((data: any) => console.log(data))
  .catch((error: Error) => console.error('Error:', error));`;
}

export function exportToPython(request: Request): string {
  const headers = request.request.headers.reduce((acc, h) => {
    acc[h.name] = h.value;
    return acc;
  }, {} as Record<string, string>);
  
  const body = request.request.postData?.text;
  
  return `import requests

url = '${request.request.url}'
headers = ${JSON.stringify(headers, null, 2)}
${body ? `data = ${JSON.stringify(body)}` : ''}

response = requests.${request.request.method.toLowerCase()}(
    url,
    headers=headers,
    ${body ? 'data=data' : ''}
)

print(response.json())`;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
