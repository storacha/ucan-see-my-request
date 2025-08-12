export type Header = { name: string; value: string };

export interface RequestData {
  url: string;
  postData?: {
    text?: string;
  };
  headers: Header[];
}

export interface ResponseContent {
  text?: string;
  encoding?: string;
}

export interface ResponseData {
  content: ResponseContent;
}

export interface BaseRequest {
  request: RequestData;
  response: ResponseData;
}

export interface ChromeRequest extends BaseRequest {
  getContent: (callback: (content: string, encoding: string) => void) => void;
}

export type Request = ChromeRequest | BaseRequest;

export const isChromeRequest = (request: Request): request is ChromeRequest => {
  if ('getContent' in request) {
    return typeof request.getContent === 'function';
  }
  return false;
};

// HAR Log structure for network API
export interface HARLog {
  log: {
    entries: Request[];
    version: string;
    creator: {
      name: string;
      version: string;
    };
    browser?: {
      name: string;
      version: string;
    };
    pages?: unknown[];
    comment?: string;
  };
}

// Network API interface that works for both Chrome and Firefox
export interface NetworkAPI {
  getHAR: (callback: (harLog: HARLog) => void) => void;
  onRequestFinished: {
    addListener: (callback: (request: Request) => void) => void;
    removeListener: (callback: (request: Request) => void) => void;
  };
  getHARAsync?: () => Promise<HARLog>;
}