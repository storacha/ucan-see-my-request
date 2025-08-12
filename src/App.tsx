import "./App.css";
import { useReducer, useEffect, useState } from "react";
import { Request, NetworkAPI, HARLog } from "./types";
import RequestList from "./RequestList";
import RequestInspector from "./RequestInspector";
import Box from "@mui/material/Box";

const getNetworkAPI = (): NetworkAPI => {
  let networkAPI: unknown; 
  
  if (typeof chrome !== "undefined" && chrome.devtools?.network) {
    networkAPI = chrome.devtools.network;
  } else if (typeof browser !== "undefined" && browser.devtools?.network) {
    networkAPI = browser.devtools.network;
  } else {
    throw new Error("Neither Chrome nor Firefox devtools network APIs available");
  }

  // Create a wrapper that converts to our types
  const typedAPI: NetworkAPI = {
    getHAR: (callback: (harLog: HARLog) => void) => {
      const rawAPI = networkAPI as { getHAR: (callback: (harLog: unknown) => void) => void };
      rawAPI.getHAR((rawHarLog: unknown) => {
        // Convert raw HAR log to our typed version with proper type checking
        const typedHarLog: HARLog = {
          log: {
            entries: [] as Request[], 
            version: "1.2",
            creator: { name: "unknown", version: "1.0" },
            browser: undefined,
            pages: undefined,
            comment: undefined
          }
        };

        // Safely extract data from raw HAR log
        if (rawHarLog && typeof rawHarLog === 'object') {
          const raw = rawHarLog as Record<string, unknown>;
          
          // Handle entries
          if (raw.entries && Array.isArray(raw.entries)) {
            typedHarLog.log.entries = raw.entries as Request[];
          } else if (raw.log && typeof raw.log === 'object') {
            const log = raw.log as Record<string, unknown>;
            if (log.entries && Array.isArray(log.entries)) {
              typedHarLog.log.entries = log.entries as Request[];
            }
          }

          // Handle version
          if (raw.version && typeof raw.version === 'string') {
            typedHarLog.log.version = raw.version;
          } else if (raw.log && typeof raw.log === 'object') {
            const log = raw.log as Record<string, unknown>;
            if (log.version && typeof log.version === 'string') {
              typedHarLog.log.version = log.version;
            }
          }

          // Handle creator
          if (raw.creator && typeof raw.creator === 'object') {
            const creator = raw.creator as Record<string, unknown>;
            if (creator.name && creator.version) {
              typedHarLog.log.creator = {
                name: String(creator.name),
                version: String(creator.version)
              };
            }
          } else if (raw.log && typeof raw.log === 'object') {
            const log = raw.log as Record<string, unknown>;
            if (log.creator && typeof log.creator === 'object') {
              const creator = log.creator as Record<string, unknown>;
              if (creator.name && creator.version) {
                typedHarLog.log.creator = {
                  name: String(creator.name),
                  version: String(creator.version)
                };
              }
            }
          }

          // Handle browser
          if (raw.browser && typeof raw.browser === 'object') {
            const browser = raw.browser as Record<string, unknown>;
            if (browser.name && browser.version) {
              typedHarLog.log.browser = {
                name: String(browser.name),
                version: String(browser.version)
              };
            }
          } else if (raw.log && typeof raw.log === 'object') {
            const log = raw.log as Record<string, unknown>;
            if (log.browser && typeof log.browser === 'object') {
              const browser = log.browser as Record<string, unknown>;
              if (browser.name && browser.version) {
                typedHarLog.log.browser = {
                  name: String(browser.name),
                  version: String(browser.version)
                };
              }
            }
          }

          // Handle pages
          if (raw.pages && Array.isArray(raw.pages)) {
            typedHarLog.log.pages = raw.pages;
          } else if (raw.log && typeof raw.log === 'object') {
            const log = raw.log as Record<string, unknown>;
            if (log.pages && Array.isArray(log.pages)) {
              typedHarLog.log.pages = log.pages;
            }
          }

          // Handle comment
          if (raw.comment && typeof raw.comment === 'string') {
            typedHarLog.log.comment = raw.comment;
          } else if (raw.log && typeof raw.log === 'object') {
            const log = raw.log as Record<string, unknown>;
            if (log.comment && typeof log.comment === 'string') {
              typedHarLog.log.comment = log.comment;
            }
          }
        }

        callback(typedHarLog);
      });
    },
    onRequestFinished: {
      addListener: (callback: (request: Request) => void) => {
        const rawAPI = networkAPI as { onRequestFinished: { addListener: (callback: (request: unknown) => void) => void } };
        rawAPI.onRequestFinished.addListener((rawRequest: unknown) => {
          // Convert raw request to our Request type
          const typedRequest: Request = rawRequest as Request;
          callback(typedRequest);
        });
      },
      removeListener: (callback: (request: Request) => void) => {
        const rawAPI = networkAPI as { onRequestFinished: { removeListener: (callback: unknown) => void } };
        rawAPI.onRequestFinished.removeListener(callback as unknown);
      }
    }
  };

  // Wrap getHAR so it returns a Promise
  typedAPI.getHARAsync = () => {
    return new Promise<HARLog>((resolve, reject) => {
      try {
        typedAPI.getHAR((harLog: HARLog) => resolve(harLog));
      } catch (err) {
        reject(err);
      }
    });
  };

  return typedAPI;
};

type SetAction = {
  action: "set";
  requests: Request[];
};

type IncrementAction = {
  action: "increment";
  request: Request;
};

type Action = SetAction | IncrementAction;

function reducer(requests: Request[], action: Action) {
  switch (action.action) {
    case "set":
      return action.requests;
    case "increment":
      return [...requests, action.request];
    default:
      return requests;
  }
}

function App() {
  const [requests, dispatch] = useReducer(reducer, []);
  const [selectedRequest, selectRequest] = useState<Request | null>(null);

  useEffect(() => {
    let ignore = false;
    dispatch({ action: "set", requests: [] });

    try {
      const networkAPI = getNetworkAPI();
      if (networkAPI.getHARAsync) {
        networkAPI
          .getHARAsync()
          .then((harLog: HARLog) => {
            if (!ignore && harLog?.log?.entries) {
              dispatch({ action: "set", requests: harLog.log.entries });
            }
          })
          .catch((error: unknown) => {
            console.error("Failed to get HAR log:", error);
          });
      }
    } catch (error) {
      console.error("Failed to get network API:", error);
    }

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    try {
      const networkAPI = getNetworkAPI();
      const listener = (request: Request) => {
        dispatch({ action: "increment", request });
      };
      networkAPI.onRequestFinished.addListener(listener);
      return () => {
        networkAPI.onRequestFinished.removeListener(listener);
      };
    } catch (error) {
      console.error("Failed to set up network listener:", error);
      return () => {};
    }
  }, [dispatch]);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        flexDirection: {
          xs: "column",
          md: "row",
        },
      }}
    >
      <Box
        sx={{
          flex: "1 1 50%",
          height: {
            xs: "50%",
            md: "100%",
          },
          width: {
            xs: "100%",
            md: "50%",
          },
        }}
      >
        <RequestList
          requests={requests}
          selectedRequest={selectedRequest}
          selectRequest={selectRequest}
        />
      </Box>
      {selectedRequest ? (
        <Box
          sx={{
            flex: "1 1 50%",
          }}
        >
          <RequestInspector request={selectedRequest} />
        </Box>
      ) : (
        ""
      )}
    </Box>
  );
}

export default App;
