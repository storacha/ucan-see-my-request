import { AgentMessage, Capability} from "@ucanto/interface"
import { CAR, Message } from '@ucanto/core'
import { Request, isChromeRequest } from './types'


function convertBinaryStringToUint8Array(bStr : string) {
	const u8_array = new Uint8Array(bStr.length);
	for (let i = 0; i < bStr.length; i++) {
		u8_array[i] = bStr.charCodeAt(i);
	}
	return u8_array;
}


export function decodeMessage(bodyAsString : string) : AgentMessage | string {
  try {
    const body = convertBinaryStringToUint8Array(bodyAsString)
      const { roots, blocks } = CAR.decode(body)
      return Message.view({ root: roots[0].cid, store: blocks })
  } catch {
    return "Unable to decode CAR File"
  }
}

export function messageFromRequest(request : Request) : AgentMessage | string {
  if (!request.request.postData || !request.request.postData.text) {
    return ''
  }
  return decodeMessage(request.request.postData.text)
}

export const bigIntSafe = (_ : any, value : any) => typeof value === 'bigint' ? value.toString() : value

export const shortString = (st : string, n: number) => st.length > n ? st.substring(0, n) + '...' : st

export function isCarRequest(request : Request) {
  return request.request.headers.some((header) => header.name.toLowerCase() == 'content-type' && header.value == CAR.contentType)
}

export function formatError(error: any): string {
  try {
    return JSON.stringify(error, null, 2); // Format JSON with indentation
  } catch {
    return String(error); // Fallback for non-JSON errors
  }
}

export function getRequestStatus(request: Request): string {
  const httpStatus = request.response.status
  const isHttpSuccess = httpStatus >= 200 && httpStatus < 300
  const isHttpError = httpStatus >= 400

  const message = messageFromRequest(request)
  let hasReceiptError = false

  if (typeof message !== 'string' && message.receipts.size > 0) {
    for (const receipt of message.receipts.values()) {
      if (receipt.out.error !== undefined) {
        hasReceiptError = true
        break
      }
    }
  }

  if (isHttpError || hasReceiptError) {
    return 'error'
  } else if (isHttpSuccess && !hasReceiptError) {
    return 'success'
  } else {
    return 'pending'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return '#4caf50'
    case 'error':
      return '#f44336'
    case 'pending':
      return '#ff9800'
    default:
      return '#9e9e9e'
  }
}

export function getRequestTiming(request: Request): number | null {
  if (isChromeRequest(request)) {
    // For Chrome DevTools network requests, use the time property which represents total duration
    return request.time || null;
  } else {
    // For HAR entries, calculate from timings
    const harEntry = request as chrome.devtools.network.HAREntry;
    if (harEntry.time) {
      return harEntry.time;
    }
    if (harEntry.timings && harEntry.timings.receive && harEntry.timings.wait && harEntry.timings.send) {
      return harEntry.timings.send + harEntry.timings.wait + harEntry.timings.receive;
    }
  }
  return null;
}

export function formatTiming(timeMs: number | null): string {
  if (timeMs === null || timeMs === undefined) {
    return '-';
  }
  
  if (timeMs < 1000) {
    return `${Math.round(timeMs)}ms`;
  }
  
  const seconds = timeMs / 1000;
  
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export interface DelegationNode {
  cid: string;
  issuer: string;
  audience: string;
  expiration: string;
  capabilities: Capability[];
  proofs: DelegationNode[];
  isValid: boolean;
  isExpired: boolean;
  expiresSoon: boolean;
  level: number;
}

export interface CapabilityValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface IssuerAudienceStats {
  issuer: string;
  audience: string;
  requestCount: number;
  capabilities: string[];
  lastSeen: string;
  avgResponseTime: number;
}

export interface ProofIntegrity {
  isValid: boolean;
  chainLength: number;
  brokenLinks: string[];
  expiredLinks: string[];
}

export function buildDelegationTree(delegation: any, level: number = 0): DelegationNode {
  const now = new Date();
  const expiration = new Date(delegation.expiration);
  const isExpired = expiration < now;
  const expiresSoon = !isExpired && (expiration.getTime() - now.getTime()) < 24 * 60 * 60 * 1000; // 24 hours

  return {
    cid: delegation.cid.toString(),
    issuer: delegation.issuer.did(),
    audience: delegation.audience.did(),
    expiration: delegation.expiration.toString(),
    capabilities: delegation.capabilities || [],
    proofs: delegation.proofs ? delegation.proofs.map((proof: any) => buildDelegationTree(proof, level + 1)) : [],
    isValid: !isExpired,
    isExpired,
    expiresSoon,
    level
  };
}

export function validateCapability(capability: Capability): CapabilityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!capability.can) {
    errors.push('Capability missing "can" field');
  }

  if (!capability.with) {
    errors.push('Capability missing "with" field');
  }

  if (capability.can && typeof capability.can !== 'string') {
    errors.push('Capability "can" field must be a string');
  }

  if (capability.with && typeof capability.with !== 'string') {
    errors.push('Capability "with" field must be a string');
  }

  if (capability.can && !capability.can.includes('/')) {
    warnings.push('Capability "can" field should typically include a namespace (e.g., "store/add")');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function analyzeIssuerAudience(requests: Request[]): IssuerAudienceStats[] {
  const statsMap = new Map<string, IssuerAudienceStats>();

  requests.forEach(request => {
    const message = messageFromRequest(request);
    if (typeof message === 'string') return;

    message.invocations.forEach(invocation => {
      const key = `${invocation.issuer.did()}-${invocation.audience.did()}`;
      const existing = statsMap.get(key) || {
        issuer: invocation.issuer.did(),
        audience: invocation.audience.did(),
        requestCount: 0,
        capabilities: [],
        lastSeen: new Date().toISOString(),
        avgResponseTime: 0
      };

      existing.requestCount++;
      existing.lastSeen = new Date().toISOString();
      
      const timing = getRequestTiming(request);
      if (timing) {
        existing.avgResponseTime = (existing.avgResponseTime + timing) / 2;
      }

      invocation.capabilities.forEach(capability => {
        if (!existing.capabilities.includes(capability.can)) {
          existing.capabilities.push(capability.can);
        }
      });

      statsMap.set(key, existing);
    });
  });

  return Array.from(statsMap.values()).sort((a, b) => b.requestCount - a.requestCount);
}

export function verifyProofIntegrity(delegation: any): ProofIntegrity {
  const brokenLinks: string[] = [];
  const expiredLinks: string[] = [];
  let chainLength = 0;

  function traverseProofs(proof: any, depth: number = 0): void {
    chainLength = Math.max(chainLength, depth);
    
    if (!proof) {
      brokenLinks.push(`Missing proof at depth ${depth}`);
      return;
    }

    const expiration = new Date(proof.expiration);
    if (expiration < new Date()) {
      expiredLinks.push(`${proof.cid.toString()} (expired: ${expiration.toISOString()})`);
    }

    if (proof.proofs) {
      proof.proofs.forEach((subProof: any) => traverseProofs(subProof, depth + 1));
    }
  }

  traverseProofs(delegation);

  return {
    isValid: brokenLinks.length === 0 && expiredLinks.length === 0,
    chainLength,
    brokenLinks,
    expiredLinks
  };
}

export function getExpirationStatus(expiration: string): { status: 'valid' | 'expired' | 'expires-soon'; color: string; message: string } {
  const now = new Date();
  const expDate = new Date(expiration);
  const timeDiff = expDate.getTime() - now.getTime();
  const hoursUntilExpiry = timeDiff / (1000 * 60 * 60);

  if (timeDiff < 0) {
    return {
      status: 'expired',
      color: '#f44336',
      message: `Expired ${Math.abs(Math.floor(hoursUntilExpiry / 24))} days ago`
    };
  } else if (hoursUntilExpiry < 24) {
    return {
      status: 'expires-soon',
      color: '#ff9800',
      message: `Expires in ${Math.floor(hoursUntilExpiry)} hours`
    };
  } else {
    return {
      status: 'valid',
      color: '#4caf50',
      message: `Valid for ${Math.floor(hoursUntilExpiry / 24)} days`
    };
  }
}