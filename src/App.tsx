import "./App.css";
import { useReducer, useEffect, useState } from "react";
import { Request } from "./types";
import RequestList from "./RequestList";
import RequestInspector from "./RequestInspector";
import Box from "@mui/material/Box";

const getNetworkAPI = () => {
  let networkAPI: any = null;

  if (typeof chrome !== "undefined" && chrome.devtools && chrome.devtools.network) {
    networkAPI = chrome.devtools.network;
  } else if (typeof browser !== "undefined" && browser.devtools && browser.devtools.network) {
    networkAPI = browser.devtools.network;
  } else {
    throw new Error("Neither Chrome nor Firefox devtools network APIs available");
  }

  // Wrap getHAR so it returns a Promise
  networkAPI.getHARAsync = () => {
    return new Promise((resolve, reject) => {
      try {
        networkAPI.getHAR((harLog: any) => resolve(harLog.log || harLog));
      } catch (err) {
        reject(err);
      }
    });
  };

  return networkAPI;
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
      networkAPI
        .getHARAsync()
        .then((harLog: any) => {
          if (!ignore && harLog && harLog.entries) {
            dispatch({ action: "set", requests: harLog.entries });
          }
        })
        .catch((error: any) => {
          console.error("Failed to get HAR log:", error);
        });
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
      const listener = (request: any) => {
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
