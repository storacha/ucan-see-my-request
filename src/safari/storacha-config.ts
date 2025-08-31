/**
 * Safari-specific Storacha endpoint detection configuration
 * Supports both current Storacha platform and legacy web3.storage
 */

export const STORACHA_ENDPOINTS = {
  // Current Storacha platform (PRIORITY)
  CURRENT: {
    CONSOLE: 'console.storacha.network',
    UPLOAD: 'up.storacha.network', 
    API: 'api.storacha.network',
    GATEWAY: 'w3s.link',
    REFERRALS: 'referrals.storacha.network',
    PATTERNS: ['storacha.network', 'console.storacha', 'up.storacha', 'api.storacha', 'w3s.link', 'referrals.storacha']
  },
  
  // Legacy web3.storage (BACKWARD COMPATIBILITY)
  LEGACY: {
    CONSOLE: 'console.web3.storage',
    UPLOAD: 'up.web3.storage',
    API: 'api.web3.storage',
    GATEWAY: 'web3.storage',
    PATTERNS: ['web3.storage', 'up.web3.storage', 'api.web3.storage']
  }
} as const;

export const UCAN_PATTERNS = {
  CONTENT_TYPES: ['application/car', 'application/vnd.ipld.car'],
  PATHS: ['/space/', '/upload/', '/receipt/', '/blob/', '/store/', '/index/', '/root/', '/shard/'],
  HEADERS: {
    AUTHORIZATION: ['authorization', 'ucan'],
    STORACHA_SPECIFIC: ['x-storacha', 'x-w3s', 'x-web3-storage'],
    JWT_BEARER_PREFIX: 'bearer ey' // JWT/UCAN tokens often start with eyJ
  },
  BODY_PATTERNS: ['ucan', 'delegation', 'capability', 'space', 'did:key:', 'mailto:', 'cid', 'bagbaiera']
} as const;

/**
 * Helper function to check if URL matches any Storacha endpoint
 */
export function isStorachaEndpoint(url: string): boolean {
  const allPatterns = [
    ...STORACHA_ENDPOINTS.CURRENT.PATTERNS,
    ...STORACHA_ENDPOINTS.LEGACY.PATTERNS
  ];
  
  return allPatterns.some(pattern => url.includes(pattern));
}

/**
 * Helper function to check if URL has UCAN-specific paths
 */
export function hasUCANPaths(url: string): boolean {
  return UCAN_PATTERNS.PATHS.some(path => url.includes(path));
}

/**
 * Helper function to check for CAR content type
 */
export function hasCarContentType(headers: { name: string; value: string }[] = [], options?: any): boolean {
  return headers.some(header => 
    header.name.toLowerCase() === 'content-type' && 
    UCAN_PATTERNS.CONTENT_TYPES.some(ct => header.value.includes(ct))
  ) || (options?.headers?.['content-type'] && 
       UCAN_PATTERNS.CONTENT_TYPES.some(ct => options.headers['content-type'].includes(ct)));
}

/**
 * Helper function to check for UCAN headers
 */
export function hasUCANHeaders(headers: { name: string; value: string }[] = []): boolean {
  return headers.some(header => {
    const headerName = header.name.toLowerCase();
    const headerValue = header.value.toLowerCase();
    
    // Check authorization headers
    const hasAuthHeaders = UCAN_PATTERNS.HEADERS.AUTHORIZATION.some(auth => 
      headerName.includes(auth) || headerValue.includes(auth)
    );
    
    // Check Storacha-specific headers
    const hasStorachaHeaders = UCAN_PATTERNS.HEADERS.STORACHA_SPECIFIC.some(header => 
      headerName.includes(header)
    );
    
    // Check for JWT/UCAN token patterns
    const hasJWTPattern = headerValue.startsWith(UCAN_PATTERNS.HEADERS.JWT_BEARER_PREFIX);
    
    return hasAuthHeaders || hasStorachaHeaders || hasJWTPattern;
  });
}
