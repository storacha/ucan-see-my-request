import { useEffect, useCallback } from 'react'
import { Request } from './types'
import { isCarRequest } from './util'

interface KeyboardShortcutsProps {
  requests: Request[]
  selectedRequest: Request | null
  selectRequest: (request: Request | null) => void
  onSearch?: () => void
  onExport?: () => void
  onClearAll?: () => void
  onToggleTheme?: () => void
  onCopyRequest?: () => void
}

export function useKeyboardShortcuts({
  requests,
  selectedRequest,
  selectRequest,
  onSearch,
  onExport,
  onClearAll,
  onToggleTheme,
  onCopyRequest,
}: KeyboardShortcutsProps) {
  const filteredRequests = requests.filter(isCarRequest)

  const getCurrentIndex = useCallback(() => {
    if (!selectedRequest) return -1
    return filteredRequests.findIndex(req => req === selectedRequest)
  }, [filteredRequests, selectedRequest])

  const selectByIndex = useCallback((index: number) => {
    if (index >= 0 && index < filteredRequests.length) {
      selectRequest(filteredRequests[index])
    }
  }, [filteredRequests, selectRequest])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const currentIndex = getCurrentIndex()

    // Navigation shortcuts
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault()
          if (currentIndex === -1 && filteredRequests.length > 0) {
            selectByIndex(0)
          } else if (currentIndex < filteredRequests.length - 1) {
            selectByIndex(currentIndex + 1)
          }
          break

        case 'ArrowUp':
        case 'k': 
          e.preventDefault()
          if (currentIndex > 0) {
            selectByIndex(currentIndex - 1)
          } else if (currentIndex === -1 && filteredRequests.length > 0) {
            selectByIndex(filteredRequests.length - 1)
          }
          break

        case 'Enter':
          break

        case 'Escape':
          e.preventDefault()
          selectRequest(null)
          break

        case 'Home':
          e.preventDefault()
          if (filteredRequests.length > 0) {
            selectByIndex(0)
          }
          break

        case 'End':
          e.preventDefault()
          if (filteredRequests.length > 0) {
            selectByIndex(filteredRequests.length - 1)
          }
          break

        case '?':
          e.preventDefault()
          showHelpDialog()
          break
      }
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          e.preventDefault()
          onSearch?.()
          break


        case 'c':
          if (selectedRequest) {
            e.preventDefault()
            onCopyRequest?.()
          }
          break

        case 'k':
          e.preventDefault()
          onClearAll?.()
          break
      }
    }

    if (e.altKey) {
      switch (e.key) {
        case 't':
          e.preventDefault()
          onToggleTheme?.()
          break
      }
    }
  }, [
    getCurrentIndex,
    selectByIndex,
    selectRequest,
    filteredRequests,
    selectedRequest,
    onSearch,
    onExport,
    onClearAll,
    onToggleTheme,
    onCopyRequest,
  ])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

function showHelpDialog() {
  const shortcuts = [
    { key: '↑/↓ or j/k', description: 'Navigate up/down' },
    { key: 'Enter', description: 'Open request details' },
    { key: 'Escape', description: 'Close details panel' },
    { key: 'Home/End', description: 'Jump to first/last' },
    { key: 'Ctrl/Cmd + F', description: 'Search requests' },
    { key: 'Ctrl/Cmd + S', description: 'Export requests' },
    { key: 'Ctrl/Cmd + C', description: 'Copy request data' },
    { key: 'Ctrl/Cmd + K', description: 'Clear all requests' },
    { key: 'Alt + T', description: 'Toggle theme' },
    { key: '?', description: 'Show this help' },
  ]

  const message = shortcuts
    .map(s => `${s.key.padEnd(20)} ${s.description}`)
    .join('\n')

  alert(`Keyboard Shortcuts:\n\n${message}`)
}
