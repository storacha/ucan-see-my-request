import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Request, RequestAnnotation } from './types'

interface AnnotationContextType {
  annotations: Map<string, RequestAnnotation>
  getAnnotation: (requestId: string) => RequestAnnotation | undefined
  setAnnotation: (requestId: string, annotation: RequestAnnotation) => void
  deleteAnnotation: (requestId: string) => void
  clearAllAnnotations: () => void
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined)

export const useAnnotations = () => {
  const context = useContext(AnnotationContext)
  if (!context) {
    throw new Error('useAnnotations must be used within an AnnotationProvider')
  }
  return context
}

export const getRequestId = (request: Request): string => {
  return `${request.request.url}-${request.startedDateTime || request.time || Date.now()}`
}

interface AnnotationProviderProps {
  children: ReactNode
}

export function AnnotationProvider({ children }: AnnotationProviderProps) {
  const [annotations, setAnnotations] = useState<Map<string, RequestAnnotation>>(new Map())

  useEffect(() => {
    const stored = localStorage.getItem('ucan-request-annotations')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAnnotations(new Map(Object.entries(parsed)))
      } catch (e) {
        console.error('Failed to load annotations:', e)
      }
    }
  }, [])

  useEffect(() => {
    const obj = Object.fromEntries(annotations)
    localStorage.setItem('ucan-request-annotations', JSON.stringify(obj))
  }, [annotations])

  const getAnnotation = (requestId: string) => {
    return annotations.get(requestId)
  }

  const setAnnotation = (requestId: string, annotation: RequestAnnotation) => {
    setAnnotations(prev => {
      const next = new Map(prev)
      next.set(requestId, annotation)
      return next
    })
  }

  const deleteAnnotation = (requestId: string) => {
    setAnnotations(prev => {
      const next = new Map(prev)
      next.delete(requestId)
      return next
    })
  }

  const clearAllAnnotations = () => {
    setAnnotations(new Map())
  }

  return (
    <AnnotationContext.Provider value={{
      annotations,
      getAnnotation,
      setAnnotation,
      deleteAnnotation,
      clearAllAnnotations,
    }}>
      {children}
    </AnnotationContext.Provider>
  )
}
