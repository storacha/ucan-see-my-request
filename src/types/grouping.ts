import { Request } from '../types';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface RequestGroup {
  id: string;
  name: string;
  description?: string;
  requests: string[]; 
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  groups: string[]; 
  createdAt: number;
  updatedAt: number;
}

export interface RequestTags {
  [requestUrl: string]: string[]; 
}

export interface GroupingState {
  tags: Tag[];
  groups: RequestGroup[];
  collections: Collection[];
  requestTags: RequestTags;
}

export interface GroupStats {
  totalRequests: number;
  uniqueCapabilities: string[];
  averageResponseTime: number;
  successRate: number;
}

export type GroupViewMode = 'list' | 'grid';

export interface GroupingContextType {
  state: GroupingState;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  removeTag: (tagId: string) => void;
  updateTag: (tag: Tag) => void;
  addGroup: (group: Omit<RequestGroup, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (group: RequestGroup) => void;
  addCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeCollection: (collectionId: string) => void;
  updateCollection: (collection: Collection) => void;
  addRequestToGroup: (groupId: string, requestUrl: string) => void;
  removeRequestFromGroup: (groupId: string, requestUrl: string) => void;
  addTagToRequest: (requestUrl: string, tagId: string) => void;
  removeTagFromRequest: (requestUrl: string, tagId: string) => void;
  getGroupStats: (groupId: string) => GroupStats;
  getRequestGroups: (requestUrl: string) => RequestGroup[];
  getRequestTags: (requestUrl: string) => Tag[];
}
