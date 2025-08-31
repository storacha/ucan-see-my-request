import "../App.css"
import { useReducer, useEffect, useState } from 'react';
import { Request } from '../types'
import RequestList from "../RequestList"
import RequestInspector from "../RequestInspector";
import Box from '@mui/material/Box'
import { safariBrowserService } from './browser-service'

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

function SafariApp() {

  const [requests, dispatch] = useReducer(reducer, [])
  const [selectedRequest, selectRequest] = useState<Request | null>(null)
  
  useEffect(() => {
    let ignore = false
    dispatch({action: "set", requests: []})
    
    // Get initial requests using Safari browser service
    safariBrowserService.getInitialRequests().then((requests) => {
      if (!ignore) {
        dispatch({ action: "set", requests})
      }
    }).catch((error) => {
      console.error('Failed to get initial Safari requests:', error)
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
    
    // Setup Safari listeners via background service worker
    const cleanup = safariBrowserService.setupSafariListeners()
    
    // Safari doesn't have reliable onNavigated - use page visibility instead
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleNavigated()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      if (cleanup) {
        cleanup()
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  useEffect(() => {
    const listener = (request: Request) => { 
      dispatch({action: "increment", request}) 
    }
    
    // Add listener to Safari browser service
    safariBrowserService.addRequestListener(listener)
    
    return () => {
      safariBrowserService.removeRequestListener(listener)
    }
  }, [])

  return (
      <Box sx={{
        display: 'flex',
        height: '100vh',
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
          />
        </Box>
        {
          selectedRequest ?
          <Box sx={{
            flex: "1 1 50%",
          }}>
            
              <RequestInspector 
                request={selectedRequest}
                onClose={() => selectRequest(null)}
              />
          </Box>  : ''
        }
      </Box>
  );
}

export default SafariApp;
