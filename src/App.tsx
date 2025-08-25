import "./App.css"
import { useReducer, useEffect, useState } from 'react';
import { Request } from './types'
import RequestList from "./RequestList"
import RequestInspector from "./RequestInspector";
import Box from '@mui/material/Box'
import { Resplit } from "react-resplit";

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

  return (
    <Resplit.Root 
      direction="horizontal" style={{ height: '100vh' }}>
      <Resplit.Pane
        order={0}
        key={selectedRequest ? "with-inspector" : "solo"}
        initialSize={selectedRequest ? '0.5fr' : '1fr'}
        minSize="150px"
      >
        <Box sx={{ 
            height: '100%', 
            overflow: 'auto' 
        }}>
          <RequestList
            requests={requests}
            selectedRequest={selectedRequest}
            selectRequest={selectRequest}
          />
        </Box>
      </Resplit.Pane>

      {selectedRequest && (
        <>
          <Resplit.Splitter
            order={1}
            size="6px"
            style={{ background: '#ccc', cursor: 'col-resize' }}
          />
          <Resplit.Pane
            order={2}
            initialSize="0.5fr"
            minSize="150px"
          >
            <Box sx={{ 
              height: '100%', 
              overflow: 'auto' 
            }}>
              <RequestInspector
                request={selectedRequest}
                onClose={() => selectRequest(null)}
              />
            </Box>
          </Resplit.Pane>
        </>
      )}
    </Resplit.Root>
  );
}

export default App;
