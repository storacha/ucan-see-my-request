import "./App.css"
import { useReducer, useEffect, useState } from 'react';
import { Request } from './types'
import RequestList from "./RequestList"
import RequestInspector from "./RequestInspector";
import RequestAnalytics from "./RequestAnalytics";
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useTheme } from './ThemeContext';
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
  const [mainTabIndex, setMainTabIndex] = useState(0)
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

  const carRequests = requests.filter(isCarRequest)
  
  const handleRequestSelectFromAnalytics = (request: Request) => {
    selectRequest(request)
    setMainTabIndex(0) 
  }

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
        <Tabs value={mainTabIndex} onChange={(e, newValue) => setMainTabIndex(newValue)}>
          <Tab label="Requests" />
          <Tab label="Analytics" />
        </Tabs>
        <IconButton onClick={toggleTheme} color="inherit">
          {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
      
      {mainTabIndex === 0 && (
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
      )}
      
      {mainTabIndex === 1 && (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <RequestAnalytics 
            requests={carRequests}
            onRequestSelect={handleRequestSelectFromAnalytics}
          />
        </Box>
      )}
    </Box>
  );
}

export default App;