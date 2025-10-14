import "./App.css"
import { useReducer, useEffect, useState } from 'react';
import { Request } from './types'
import RequestList from "./RequestList"
import RequestInspector from "./RequestInspector";
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from './ThemeContext';
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { getInvocationFingerprint, getRequestKey } from './util'

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
  const [sessions, setSessions] = useState<Record<string, Request[]>>({ default: [] })
  const [currentSessionId, setCurrentSessionId] = useState<string>('default')
  const [tagsByRequestKey, setTagsByRequestKey] = useState<Record<string, string[]>>({})
  const [newSessionName, setNewSessionName] = useState<string>("")
  useEffect(() => {
    let ignore = false
    dispatch({action: "set", requests: []})
    chrome.devtools.network.getHAR((harLog) => {
      if (!ignore) {
        dispatch({ action: "set", requests: harLog.entries})
        setSessions((prev) => ({ ...prev, [currentSessionId]: harLog.entries }))
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
        setSessions((prev) => ({ ...prev, [currentSessionId]: [] }))
        selectRequest(null)
      }
    }
    chrome.devtools.network.onNavigated.addListener(handleNavigated)
    return () => {
      chrome.devtools.network.onNavigated.removeListener(handleNavigated)
    }
  }, [])
  
  useEffect(() => {
    const listener = (request : chrome.devtools.network.Request) => {
      dispatch({action: "increment", request})
      setSessions((prev) => {
        const next = { ...prev }
        const list = next[currentSessionId] || []
        next[currentSessionId] = [...list, request]
        return next
      })
    }
    chrome.devtools.network.onRequestFinished.addListener(listener)
    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(listener)
    }
  })

  const createSession = () => {
    const name = newSessionName.trim() || `session-${Object.keys(sessions).length + 1}`
    if (sessions[name]) {
      setCurrentSessionId(name)
      return
    }
    setSessions((prev) => ({ ...prev, [name]: [] }))
    setCurrentSessionId(name)
    setNewSessionName("")
  }

  const switchSession = (id: string) => {
    setCurrentSessionId(id)
    const list = sessions[id] || []
    dispatch({ action: 'set', requests: list })
    selectRequest(null)
  }

  const addTag = (request: Request, tag: string) => {
    const key = getRequestKey(request)
    setTagsByRequestKey((prev) => {
      const existing = prev[key] || []
      if (existing.includes(tag)) return prev
      return { ...prev, [key]: [...existing, tag] }
    })
  }

  const removeTag = (request: Request, tag: string) => {
    const key = getRequestKey(request)
    setTagsByRequestKey((prev) => {
      const existing = prev[key] || []
      return { ...prev, [key]: existing.filter(t => t !== tag) }
    })
  }

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      flexDirection: 'column'
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">Sessions:</Typography>
          <ButtonGroup size="small" variant="outlined">
            {Object.keys(sessions).map((id) => (
              <Button key={id} onClick={() => switchSession(id)} variant={id === currentSessionId ? 'contained' : 'outlined'}>{id}</Button>
            ))}
          </ButtonGroup>
          <TextField
            size="small"
            placeholder="New session name"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
          />
          <Button size="small" variant="contained" onClick={createSession}>Create</Button>
        </Stack>
        <IconButton onClick={toggleTheme} color="inherit">
          {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
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
            requests={requests}
            selectedRequest={selectedRequest}
            selectRequest={selectRequest}
            tagsByRequestKey={tagsByRequestKey}
            onAddTag={addTag}
            onRemoveTag={removeTag}
          />
        </Box>
        {selectedRequest ? (
          <Box sx={{
            flex: "1 1 50%",
          }}>
            <RequestInspector 
              request={selectedRequest} 
              onClose={() => selectRequest(null)}
              getRelated={(r) => {
                const fp = getInvocationFingerprint(r)
                if (!fp) return []
                return requests.filter((q) => getInvocationFingerprint(q) === fp)
              }}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

export default App;