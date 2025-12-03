export type Request = chrome.devtools.network.Request | chrome.devtools.network.HAREntry

export const isChromeRequest = (request: Request) : request is chrome.devtools.network.Request => (typeof (request as chrome.devtools.network.Request).getContent === 'function')

export type RequestStatus = 'none' | 'resolved' | 'needs-attention'

export type RequestColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'

export interface RequestAnnotation {
  id: string
  note: string
  color: RequestColor
  status: RequestStatus
  isPinned: boolean
  createdAt: number
  updatedAt: number
}

export interface AnnotatedRequest {
  request: Request
  annotation?: RequestAnnotation
}