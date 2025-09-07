export type Request = chrome.devtools.network.Request | chrome.devtools.network.HAREntry

export const isChromeRequest = (request: Request) : request is chrome.devtools.network.Request => (typeof (request as chrome.devtools.network.Request).getContent === 'function')

export type RequestStatus = 'pending' | 'success' | 'error';