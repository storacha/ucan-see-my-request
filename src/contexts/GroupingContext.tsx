import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  GroupingState, 
  GroupingContextType, 
  Tag, 
  RequestGroup, 
  Collection,
  GroupStats
} from '../types/grouping';
import { getRequestTiming } from '../util';
import { Request } from '../types';

const defaultState: GroupingState = {
  tags: [],
  groups: [],
  collections: [],
  requestTags: {},
};

const GroupingContext = createContext<GroupingContextType | undefined>(undefined);

export const useGrouping = () => {
  const context = useContext(GroupingContext);
  if (!context) {
    throw new Error('useGrouping must be used within a GroupingProvider');
  }
  return context;
};

interface GroupingProviderProps {
  children: React.ReactNode;
  requests: Request[];
}

export const GroupingProvider: React.FC<GroupingProviderProps> = ({ children, requests }) => {
  const [state, setState] = useState<GroupingState>(() => {
    const saved = localStorage.getItem('groupingState');
    return saved ? JSON.parse(saved) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem('groupingState', JSON.stringify(state));
  }, [state]);

  const addTag = (tag: Omit<Tag, 'id'>) => {
    setState(prev => ({
      ...prev,
      tags: [...prev.tags, { ...tag, id: uuidv4() }]
    }));
  };

  const removeTag = (tagId: string) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t.id !== tagId),
      requestTags: Object.fromEntries(
        Object.entries(prev.requestTags).map(([url, tags]) => [
          url,
          tags.filter(t => t !== tagId)
        ])
      )
    }));
  };

  const updateTag = (tag: Tag) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.map(t => t.id === tag.id ? tag : t)
    }));
  };

  const addGroup = (group: Omit<RequestGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      groups: [...prev.groups, {
        ...group,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now
      }]
    }));
  };

  const removeGroup = (groupId: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== groupId),
      collections: prev.collections.map(c => ({
        ...c,
        groups: c.groups.filter(g => g !== groupId)
      }))
    }));
  };

  const updateGroup = (group: RequestGroup) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === group.id ? {
        ...group,
        updatedAt: Date.now()
      } : g)
    }));
  };

  const addCollection = (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      collections: [...prev.collections, {
        ...collection,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now
      }]
    }));
  };

  const removeCollection = (collectionId: string) => {
    setState(prev => ({
      ...prev,
      collections: prev.collections.filter(c => c.id !== collectionId)
    }));
  };

  const updateCollection = (collection: Collection) => {
    setState(prev => ({
      ...prev,
      collections: prev.collections.map(c => c.id === collection.id ? {
        ...collection,
        updatedAt: Date.now()
      } : c)
    }));
  };

  const addRequestToGroup = (groupId: string, requestUrl: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? {
        ...g,
        requests: [...new Set([...g.requests, requestUrl])],
        updatedAt: Date.now()
      } : g)
    }));
  };

  const removeRequestFromGroup = (groupId: string, requestUrl: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? {
        ...g,
        requests: g.requests.filter(r => r !== requestUrl),
        updatedAt: Date.now()
      } : g)
    }));
  };

  const addTagToRequest = (requestUrl: string, tagId: string) => {
    setState(prev => ({
      ...prev,
      requestTags: {
        ...prev.requestTags,
        [requestUrl]: [...new Set([...(prev.requestTags[requestUrl] || []), tagId])]
      }
    }));
  };

  const removeTagFromRequest = (requestUrl: string, tagId: string) => {
    setState(prev => ({
      ...prev,
      requestTags: {
        ...prev.requestTags,
        [requestUrl]: (prev.requestTags[requestUrl] || []).filter(t => t !== tagId)
      }
    }));
  };

  const getGroupStats = (groupId: string): GroupStats => {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) {
      return {
        totalRequests: 0,
        uniqueCapabilities: [],
        averageResponseTime: 0,
        successRate: 0
      };
    }

    const groupRequests = requests.filter(r => group.requests.includes(r.request.url));
    const totalRequests = groupRequests.length;
    
    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        uniqueCapabilities: [],
        averageResponseTime: 0,
        successRate: 0
      };
    }

    const capabilities = new Set<string>();
    let totalResponseTime = 0;
    let successCount = 0;

    groupRequests.forEach(request => {
      // Add capabilities
      const timing = getRequestTiming(request);
      if (timing !== null) {
        totalResponseTime += timing;
      }
      
      // Count successful requests
      if (request.response.status >= 200 && request.response.status < 300) {
        successCount++;
      }
    });

    return {
      totalRequests,
      uniqueCapabilities: Array.from(capabilities),
      averageResponseTime: totalResponseTime / totalRequests,
      successRate: (successCount / totalRequests) * 100
    };
  };

  const getRequestGroups = (requestUrl: string): RequestGroup[] => {
    return state.groups.filter(g => g.requests.includes(requestUrl));
  };

  const getRequestTags = (requestUrl: string): Tag[] => {
    const tagIds = state.requestTags[requestUrl] || [];
    return state.tags.filter(t => tagIds.includes(t.id));
  };

  const value: GroupingContextType = {
    state,
    addTag,
    removeTag,
    updateTag,
    addGroup,
    removeGroup,
    updateGroup,
    addCollection,
    removeCollection,
    updateCollection,
    addRequestToGroup,
    removeRequestFromGroup,
    addTagToRequest,
    removeTagFromRequest,
    getGroupStats,
    getRequestGroups,
    getRequestTags
  };

  return (
    <GroupingContext.Provider value={value}>
      {children}
    </GroupingContext.Provider>
  );
};

export default GroupingContext;
