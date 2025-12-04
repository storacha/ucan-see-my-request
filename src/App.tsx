import "./App.css"
import { useReducer, useEffect, useState, useCallback } from 'react';
import { Request } from './types'
import RequestList from "./RequestList"
import RequestInspector from "./RequestInspector";
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from './ThemeContext';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Tooltip from '@mui/material/Tooltip';
import { messageFromRequest } from './util';
import { CopyNotification } from './CopyNotification';
import { SearchBar } from './SearchBar';
import { isCarRequest } from './util';

type SetAction = {
  action: "set",
  requests: Request[]
}

type IncrementAction = {
  action: "increment",
  request: Request
}

type Action = SetAction | IncrementAction

function reducer(requests : Request[], action: Action) {
  switch (action.action) {
    case "set":
      return action.requests
    case "increment":
      return [...requests, action.request]
  }
}

function App() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [requests, dispatch] = useReducer(reducer, [])
  const [selectedRequest, selectRequest] = useState<Request | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [copyNotification, setCopyNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [searchTerm, setSearchTerm] = useState('')
  useEffect(() => {
    let ignore = false
    dispatch({action: "set", requests: []})
    chrome.devtools.network.getHAR((harLog) => {
      if (!ignore) {
        dispatch({ action: "set", requests: harLog.entries})
      }
    })
    return () => {
      ignore = true
    }
  }, [])
  
  useEffect(() => {
    const handleNavigated = () => {
      const stored = localStorage.getItem('persistOnReload')
      const shouldPersist = stored ? JSON.parse(stored) : false
      if (!shouldPersist) {
        dispatch({ action: 'set', requests: [] })
        selectRequest(null)
      }
    }
    chrome.devtools.network.onNavigated.addListener(handleNavigated)
    return () => {
      chrome.devtools.network.onNavigated.removeListener(handleNavigated)
    }
  }, [])
  
  useEffect(() => {
    const listener = (request : chrome.devtools.network.Request) => { dispatch({action: "increment", request}) }
    chrome.devtools.network.onRequestFinished.addListener(listener)
    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(listener)
    }
  })

  const handleCopyRequest = useCallback(() => {
    if (!selectedRequest) return
    
    try {
      const data: any = {
        url: selectedRequest.request.url,
        method: selectedRequest.request.method,
        httpVersion: selectedRequest.request.httpVersion,
        timestamp: selectedRequest.startedDateTime || new Date().toISOString(),
        time: selectedRequest.time,
      }

      if (selectedRequest.response) {
        data.response = {
          status: selectedRequest.response.status,
          statusText: selectedRequest.response.statusText,
          mimeType: selectedRequest.response.content?.mimeType,
        }
      }

      try {
        const message = messageFromRequest(selectedRequest)
        if (typeof message !== 'string' && message) {
          data.ucan = {
            invocations: message.invocations.map(inv => ({
              cid: inv.cid.toString(),
              capabilities: inv.capabilities.map(cap => ({
                can: cap.can,
                with: cap.with,
                nb: cap.nb,
              })),
              issuer: inv.issuer.did(),
              audience: inv.audience.did(),
            })),
            receipts: Array.from(message.receipts.values()).map(receipt => ({
              ran: receipt.ran.toString(),
              out: receipt.out,
            })),
          }
        } else if (message) {
          data.message = message
        }
      } catch (e) {
        console.log('Could not parse UCAN data:', e)
      }

      if (selectedRequest.request.headers?.length > 0) {
        data.requestHeaders = selectedRequest.request.headers.reduce((acc, header) => {
          acc[header.name] = header.value
          return acc
        }, {} as Record<string, string>)
      }

      if (selectedRequest.response?.headers?.length > 0) {
        data.responseHeaders = selectedRequest.response.headers.reduce((acc, header) => {
          acc[header.name] = header.value
          return acc
        }, {} as Record<string, string>)
      }
      
      const jsonString = JSON.stringify(data, null, 2)
      navigator.clipboard.writeText(jsonString).then(() => {
        setCopyNotification({ open: true, message: 'Request data copied to clipboard', severity: 'success' })
      }).catch((err) => {
        console.error('Clipboard write failed:', err)
        const textArea = document.createElement('textarea')
        textArea.value = jsonString
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          setCopyNotification({ open: true, message: 'Request data copied to clipboard', severity: 'success' })
        } catch (err2) {
          console.error('execCommand copy failed:', err2)
          setCopyNotification({ open: true, message: 'Failed to copy request data', severity: 'error' })
        } finally {
          document.body.removeChild(textArea)
        }
      })
    } catch (err) {
      console.error('Failed to copy request data:', err)
      setCopyNotification({ open: true, message: 'Failed to copy request data', severity: 'error' })
    }
  }, [selectedRequest])

  const handleClearAll = useCallback(() => {
    if (confirm('Clear all requests? This action cannot be undone.')) {
      dispatch({ action: 'set', requests: [] })
      selectRequest(null)
    }
  }, [])

  const filteredRequests = useCallback(() => {
    if (!searchTerm) return requests
    
    const term = searchTerm.toLowerCase()
    return requests.filter(req => {
      if (!isCarRequest(req)) return false
      
      if (req.request.url.toLowerCase().includes(term)) return true
      
      if (req.request.method.toLowerCase().includes(term)) return true
      
      if (req.response?.status.toString().includes(term)) return true
      
      try {
        const message = messageFromRequest(req)
        if (typeof message === 'string') {
          return message.toLowerCase().includes(term)
        } else {
          const capabilities = message.invocations.flatMap(inv => 
            inv.capabilities.map(cap => cap.can)
          ).join(' ').toLowerCase()
          return capabilities.includes(term)
        }
      } catch {
        return false
      }
    })
  }, [requests, searchTerm])

  useKeyboardShortcuts({
    requests: filteredRequests(),
    selectedRequest,
    selectRequest,
    onSearch: () => {},
    onExport: () => console.log('Export functionality removed'),
    onClearAll: handleClearAll,
    onToggleTheme: toggleTheme,
    onCopyRequest: handleCopyRequest,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setHelpOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      flexDirection: 'column'
    }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Keyboard shortcuts (?)">
            <IconButton onClick={() => setHelpOpen(true)} color="inherit">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title="Toggle theme (Alt+T)">
          <IconButton onClick={toggleTheme} color="inherit">
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>
      </Box>
      <SearchBar 
        onSearchChange={setSearchTerm}
        resultCount={filteredRequests().filter(isCarRequest).length}
        totalCount={requests.filter(isCarRequest).length}
      />
      <Box sx={{
        display: 'flex',
        flex: 1,
        flexDirection: {
          xs: 'column',
          md: 'row'
        }
      }}>
        <Box sx={{
          flex: "1 1 50%",
          height: {
            xs: "50%",
            md: "100%",
          },
          width: {
            xs: "100%",
            md: "50%",
          },
        }}>
          <RequestList
            requests={filteredRequests()}
            selectedRequest={selectedRequest}
            selectRequest={selectRequest}
          />
        </Box>
        {selectedRequest ? (
          <Box sx={{
            flex: "1 1 50%",
          }}>
            <RequestInspector request={selectedRequest} onClose={() => selectRequest(null)}/>
          </Box>
        ) : null}
      </Box>
      <KeyboardShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <CopyNotification 
        open={copyNotification.open}
        onClose={() => setCopyNotification({ ...copyNotification, open: false })}
        message={copyNotification.message}
        severity={copyNotification.severity}
      />
    </Box>
  );
}

export default App;