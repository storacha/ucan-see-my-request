import "./App.css"
import { useReducer, useEffect, useState } from 'react';
import { Request } from './types'
import RequestList from "./RequestList"
import RequestInspector from "./RequestInspector";
import Box from '@mui/material/Box'

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

  const [requests, dispatch] = useReducer(reducer, [])
  const [selectedRequest, selectRequest] = useState<Request | null>(null)
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
    const listener = (request : chrome.devtools.network.Request) => { dispatch({action: "increment", request}) }
    chrome.devtools.network.onRequestFinished.addListener(listener)
    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(listener)
    }
  })

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
          <RequestList requests={requests} selectedRequest={selectedRequest} selectRequest={selectRequest}/>
        </Box>
        {
          selectedRequest ?
          <Box sx={{
            flex: "1 1 50%",
          }}>
            
              <RequestInspector request={selectedRequest}/>
          </Box>  : ''
        }
      </Box>
  );
}

export default App;