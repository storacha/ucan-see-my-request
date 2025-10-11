import { Request, isChromeRequest } from './types'
import { messageFromRequest, getRequestStatus, getRequestTiming } from './util'
import { AgentMessage } from '@ucanto/interface'

export interface RequestMetrics {
  url: string
  timing: number | null
  size: number
  status: string
  httpStatus: number
  timestamp: number
  capabilities: string[]
  hasError: boolean
  errorMessage?: string
}

export interface PerformanceMetrics {
  totalRequests: number
  successCount: number
  errorCount: number
  pendingCount: number
  averageResponseTime: number
  totalDataTransferred: number
  fastestRequest: RequestMetrics | null
  slowestRequest: RequestMetrics | null
}

export interface RequestPattern {
  type: string
  count: number
  description: string
  requests: Request[]
}

export interface ErrorAnalysis {
  totalErrors: number
  httpErrors: number
  ucanErrors: number
  errorsByType: Map<string, number>
  errorDetails: Array<{
    request: Request
    errorType: string
    message: string
  }>
}

export interface TimelineEvent {
  timestamp: number
  request: Request
  status: string
  duration: number | null
  url: string
  capabilities: string[]
}

export function extractRequestMetrics(request: Request): RequestMetrics {
  const message = messageFromRequest(request)
  const status = getRequestStatus(request)
  const timing = getRequestTiming(request)
  
  let capabilities: string[] = []
  let hasError = false
  let errorMessage: string | undefined
  
  if (typeof message !== 'string') {
    capabilities = message.invocations.flatMap(inv => 
      inv.capabilities.map(cap => cap.can)
    )
    
    for (const receipt of message.receipts.values()) {
      if (receipt.out.error !== undefined) {
        hasError = true
        errorMessage = JSON.stringify(receipt.out.error)
        break
      }
    }
  }
  
  if (request.response.status >= 400) {
    hasError = true
    errorMessage = errorMessage || `HTTP ${request.response.status}: ${request.response.statusText}`
  }
  
  let size = 0
  if (request.request.postData?.text) {
    size += request.request.postData.text.length
  }
  if (isChromeRequest(request)) {
    size += request.response.bodySize || 0
  } else {
    size += request.response.content.size || 0
  }
  
  return {
    url: request.request.url,
    timing,
    size,
    status,
    httpStatus: request.response.status,
    timestamp: new Date(request.startedDateTime).getTime(),
    capabilities,
    hasError,
    errorMessage
  }
}

export function calculatePerformanceMetrics(requests: Request[]): PerformanceMetrics {
  const metrics = requests.map(extractRequestMetrics)
  
  const successCount = metrics.filter(m => m.status === 'success').length
  const errorCount = metrics.filter(m => m.status === 'error').length
  const pendingCount = metrics.filter(m => m.status === 'pending').length
  
  const timings = metrics.map(m => m.timing).filter(t => t !== null) as number[]
  const averageResponseTime = timings.length > 0
    ? timings.reduce((sum, t) => sum + t, 0) / timings.length
    : 0
  
  const totalDataTransferred = metrics.reduce((sum, m) => sum + m.size, 0)
  
  let fastestRequest: RequestMetrics | null = null
  let slowestRequest: RequestMetrics | null = null
  
  if (timings.length > 0) {
    const sortedMetrics = [...metrics]
      .filter(m => m.timing !== null)
      .sort((a, b) => (a.timing || 0) - (b.timing || 0))
    
    fastestRequest = sortedMetrics[0]
    slowestRequest = sortedMetrics[sortedMetrics.length - 1]
  }
  
  return {
    totalRequests: requests.length,
    successCount,
    errorCount,
    pendingCount,
    averageResponseTime,
    totalDataTransferred,
    fastestRequest,
    slowestRequest
  }
}

export function analyzeErrors(requests: Request[]): ErrorAnalysis {
  const errorsByType = new Map<string, number>()
  const errorDetails: Array<{
    request: Request
    errorType: string
    message: string
  }> = []
  
  let httpErrors = 0
  let ucanErrors = 0
  
  for (const request of requests) {
    const metrics = extractRequestMetrics(request)
    
    if (metrics.hasError) {
      if (metrics.httpStatus >= 400) {
        httpErrors++
        const errorType = `HTTP ${metrics.httpStatus}`
        errorsByType.set(errorType, (errorsByType.get(errorType) || 0) + 1)
        
        errorDetails.push({
          request,
          errorType,
          message: metrics.errorMessage || 'Unknown HTTP error'
        })
      } else {
        ucanErrors++
        const message = messageFromRequest(request)
        
        if (typeof message !== 'string') {
          for (const receipt of message.receipts.values()) {
            if (receipt.out.error) {
              const error: any = receipt.out.error
              const errorType = error.name || 'UCAN Error'
              errorsByType.set(errorType, (errorsByType.get(errorType) || 0) + 1)
              
              errorDetails.push({
                request,
                errorType,
                message: error.message || JSON.stringify(error)
              })
            }
          }
        }
      }
    }
  }
  
  return {
    totalErrors: httpErrors + ucanErrors,
    httpErrors,
    ucanErrors,
    errorsByType,
    errorDetails
  }
}

export function detectRequestPatterns(requests: Request[]): RequestPattern[] {
  const patterns: RequestPattern[] = []
  const metrics = requests.map(extractRequestMetrics)
  
  const failedUrls = new Map<string, Request[]>()
  requests.forEach(req => {
    const m = extractRequestMetrics(req)
    if (m.hasError) {
      const list = failedUrls.get(m.url) || []
      list.push(req)
      failedUrls.set(m.url, list)
    }
  })
  
  failedUrls.forEach((reqs, url) => {
    if (reqs.length >= 2) {
      patterns.push({
        type: 'repeated-failures',
        count: reqs.length,
        description: `${reqs.length} failed requests to ${url}`,
        requests: reqs
      })
    }
  })
  
  const slowRequests = requests.filter(req => {
    const timing = getRequestTiming(req)
    return timing !== null && timing > 3000
  })
  
  if (slowRequests.length > 0) {
    patterns.push({
      type: 'slow-requests',
      count: slowRequests.length,
      description: `${slowRequests.length} requests taking over 3 seconds`,
      requests: slowRequests
    })
  }
  
  if (requests.length >= 5) {
    const sortedByTime = [...requests].sort((a, b) => 
      new Date(a.startedDateTime).getTime() - new Date(b.startedDateTime).getTime()
    )
    
    for (let i = 0; i < sortedByTime.length - 4; i++) {
      const windowRequests = sortedByTime.slice(i, i + 5)
      const timeSpan = 
        new Date(windowRequests[4].startedDateTime).getTime() - 
        new Date(windowRequests[0].startedDateTime).getTime()
      
      if (timeSpan < 1000) {
        patterns.push({
          type: 'burst',
          count: 5,
          description: `5 requests within ${timeSpan}ms`,
          requests: windowRequests
        })
        break 
      }
    }
  }
  
  const capabilityCounts = new Map<string, Request[]>()
  requests.forEach(req => {
    const m = extractRequestMetrics(req)
    m.capabilities.forEach(cap => {
      const list = capabilityCounts.get(cap) || []
      list.push(req)
      capabilityCounts.set(cap, list)
    })
  })
  
  capabilityCounts.forEach((reqs, capability) => {
    if (reqs.length >= 3) {
      patterns.push({
        type: 'repeated-capability',
        count: reqs.length,
        description: `Capability "${capability}" used ${reqs.length} times`,
        requests: reqs
      })
    }
  })
  
  return patterns
}

export function createTimeline(requests: Request[]): TimelineEvent[] {
  return requests
    .map(request => {
      const metrics = extractRequestMetrics(request)
      return {
        timestamp: metrics.timestamp,
        request,
        status: metrics.status,
        duration: metrics.timing,
        url: metrics.url,
        capabilities: metrics.capabilities
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
}


export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

