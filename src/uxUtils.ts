import { Request } from './types';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function createKeyboardShortcuts(
  onSearch: () => void,
  onNavigateUp: () => void,
  onNavigateDown: () => void,
  onSelectAll: () => void,
  onClearSelection: () => void,
  onToggleBookmark: () => void,
  onCompare: () => void,
  onExport: () => void
): KeyboardShortcut[] {
  return [
    {
      key: 'f',
      ctrlKey: true,
      action: onSearch,
      description: 'Open search'
    },
    {
      key: 'ArrowUp',
      action: onNavigateUp,
      description: 'Navigate up'
    },
    {
      key: 'ArrowDown',
      action: onNavigateDown,
      description: 'Navigate down'
    },
    {
      key: 'a',
      ctrlKey: true,
      action: onSelectAll,
      description: 'Select all requests'
    },
    {
      key: 'Escape',
      action: onClearSelection,
      description: 'Clear selection'
    },
    {
      key: 'b',
      ctrlKey: true,
      action: onToggleBookmark,
      description: 'Toggle bookmark'
    },
    {
      key: 'c',
      ctrlKey: true,
      action: onCompare,
      description: 'Compare requests'
    },
    {
      key: 'e',
      ctrlKey: true,
      action: onExport,
      description: 'Export selected'
    }
  ];
}

export interface Bookmark {
  id: string;
  requestId: string;
  name: string;
  description?: string;
  timestamp: number;
  tags: string[];
}

export function saveBookmark(request: Request, name: string, description?: string, tags: string[] = []): Bookmark {
  const bookmark: Bookmark = {
    id: generateId(),
    requestId: getRequestId(request),
    name,
    description,
    timestamp: Date.now(),
    tags
  };

  const bookmarks = getBookmarks();
  bookmarks.push(bookmark);
  localStorage.setItem('ucan_bookmarks', JSON.stringify(bookmarks));
  
  return bookmark;
}

export function getBookmarks(): Bookmark[] {
  const stored = localStorage.getItem('ucan_bookmarks');
  return stored ? JSON.parse(stored) : [];
}

export function deleteBookmark(bookmarkId: string): void {
  const bookmarks = getBookmarks().filter(b => b.id !== bookmarkId);
  localStorage.setItem('ucan_bookmarks', JSON.stringify(bookmarks));
}

export function updateBookmark(bookmarkId: string, updates: Partial<Bookmark>): void {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b => b.id === bookmarkId);
  if (index !== -1) {
    bookmarks[index] = { ...bookmarks[index], ...updates };
    localStorage.setItem('ucan_bookmarks', JSON.stringify(bookmarks));
  }
}

export function findBookmarkByRequest(request: Request): Bookmark | null {
  const requestId = getRequestId(request);
  return getBookmarks().find(b => b.requestId === requestId) || null;
}

export interface ComparisonResult {
  differences: {
    field: string;
    left: any;
    right: any;
    type: 'added' | 'removed' | 'modified' | 'unchanged';
  }[];
  similarity: number;
}

export function compareRequests(request1: Request, request2: Request): ComparisonResult {
  const differences: ComparisonResult['differences'] = [];
  
  const basicFields = ['method', 'url', 'status', 'statusText'];
  basicFields.forEach(field => {
    const left = getRequestField(request1, field);
    const right = getRequestField(request2, field);
    
    if (left !== right) {
      differences.push({
        field,
        left,
        right,
        type: left === undefined ? 'added' : right === undefined ? 'removed' : 'modified'
      });
    } else {
      differences.push({
        field,
        left,
        right,
        type: 'unchanged'
      });
    }
  });

  const headers1 = request1.request.headers;
  const headers2 = request2.request.headers;
  const allHeaderNames = new Set([...headers1.map(h => h.name), ...headers2.map(h => h.name)]);
  
  allHeaderNames.forEach(headerName => {
    const header1 = headers1.find(h => h.name === headerName);
    const header2 = headers2.find(h => h.name === headerName);
    
    if (!header1) {
      differences.push({
        field: `header.${headerName}`,
        left: undefined,
        right: header2?.value,
        type: 'added'
      });
    } else if (!header2) {
      differences.push({
        field: `header.${headerName}`,
        left: header1.value,
        right: undefined,
        type: 'removed'
      });
    } else if (header1.value !== header2.value) {
      differences.push({
        field: `header.${headerName}`,
        left: header1.value,
        right: header2.value,
        type: 'modified'
      });
    }
  });

  const unchangedCount = differences.filter(d => d.type === 'unchanged').length;
  const totalCount = differences.length;
  const similarity = totalCount > 0 ? (unchangedCount / totalCount) * 100 : 100;

  return {
    differences,
    similarity
  };
}

export interface BulkOperation {
  id: string;
  name: string;
  description: string;
  action: (requests: Request[]) => void;
  icon?: string;
}

export function createBulkOperations(
  onExport: (requests: Request[]) => void,
  onDelete: (requests: Request[]) => void,
  onBookmark: (requests: Request[]) => void,
  onCompare: (requests: Request[]) => void,
  onReplay: (requests: Request[]) => void
): BulkOperation[] {
  return [
    {
      id: 'export',
      name: 'Export Selected',
      description: 'Export selected requests in various formats',
      action: onExport
    },
    {
      id: 'bookmark',
      name: 'Bookmark Selected',
      description: 'Add selected requests to bookmarks',
      action: onBookmark
    },
    {
      id: 'compare',
      name: 'Compare Selected',
      description: 'Compare selected requests side by side',
      action: onCompare
    },
    {
      id: 'replay',
      name: 'Replay Selected',
      description: 'Replay selected requests',
      action: onReplay
    }
  ];
}

export interface SearchFilter {
  query: string;
  status?: string[];
  method?: string[];
  urlPattern?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  bookmarked?: boolean;
  tags?: string[];
}

export function filterRequests(requests: Request[], filter: SearchFilter): Request[] {
  return requests.filter(request => {
    if (filter.query) {
      const query = filter.query.toLowerCase();
      const url = request.request.url.toLowerCase();
      const method = request.request.method.toLowerCase();
      const status = request.response.status.toString();
      
      if (!url.includes(query) && !method.includes(query) && !status.includes(query)) {
        return false;
      }
    }

    if (filter.status && filter.status.length > 0) {
      const requestStatus = getRequestStatus(request);
      if (!filter.status.includes(requestStatus)) {
        return false;
      }
    }

    if (filter.method && filter.method.length > 0) {
      if (!filter.method.includes(request.request.method)) {
        return false;
      }
    }

    if (filter.urlPattern) {
      try {
        const regex = new RegExp(filter.urlPattern, 'i');
        if (!regex.test(request.request.url)) {
          return false;
        }
      } catch {
      }
    }

    if (filter.timeRange) {
      const requestTime = request.startedDateTime ? new Date(request.startedDateTime).getTime() : Date.now();
      if (requestTime < filter.timeRange.start || requestTime > filter.timeRange.end) {
        return false;
      }
    }

    if (filter.bookmarked) {
      const bookmark = findBookmarkByRequest(request);
      if (!bookmark) {
        return false;
      }
    }

    return true;
  });
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getRequestId(request: Request): string {
  const key = `${request.request.method}-${request.request.url}-${request.response.status}-${request.startedDateTime}`;
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
}

function getRequestField(request: Request, field: string): any {
  switch (field) {
    case 'method':
      return request.request.method;
    case 'url':
      return request.request.url;
    case 'status':
      return request.response.status;
    case 'statusText':
      return request.response.statusText;
    default:
      return undefined;
  }
}

function getRequestStatus(request: Request): string {
  const httpStatus = request.response.status;
  if (httpStatus >= 200 && httpStatus < 300) return 'success';
  if (httpStatus >= 400) return 'error';
  return 'pending';
}

export interface NavigationState {
  currentIndex: number;
  totalItems: number;
  selectedItems: Set<number>;
}

export function createNavigationState(totalItems: number): NavigationState {
  return {
    currentIndex: 0,
    totalItems,
    selectedItems: new Set()
  };
}

export function navigateUp(state: NavigationState): NavigationState {
  return {
    ...state,
    currentIndex: Math.max(0, state.currentIndex - 1)
  };
}

export function navigateDown(state: NavigationState): NavigationState {
  return {
    ...state,
    currentIndex: Math.min(state.totalItems - 1, state.currentIndex + 1)
  };
}

export function toggleSelection(state: NavigationState, index: number): NavigationState {
  const newSelectedItems = new Set(state.selectedItems);
  if (newSelectedItems.has(index)) {
    newSelectedItems.delete(index);
  } else {
    newSelectedItems.add(index);
  }
  
  return {
    ...state,
    selectedItems: newSelectedItems
  };
}

export function selectAll(state: NavigationState): NavigationState {
  const selectedItems = new Set<number>();
  for (let i = 0; i < state.totalItems; i++) {
    selectedItems.add(i);
  }
  
  return {
    ...state,
    selectedItems
  };
}

export function clearSelection(state: NavigationState): NavigationState {
  return {
    ...state,
    selectedItems: new Set()
  };
}
