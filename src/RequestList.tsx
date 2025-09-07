import React, { useState } from 'react'
import { Request, isChromeRequest } from "./types"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { isCarRequest, messageFromRequest, getRequestStatus, getStatusColor, getRequestTiming, formatTiming } from "./util";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RequestActions from './components/RequestActions';
import GroupManager from './components/GroupManager';
import { GroupingProvider } from './contexts/GroupingContext';
import { Drawer, IconButton, Tooltip } from '@mui/material';
import { Group as GroupIcon } from '@mui/icons-material';

function RequestEntry({ request, selectedRequest, selectRequest } : {request: Request, selectedRequest: Request | null, selectRequest: (request: Request) => void}) {
  const message = messageFromRequest(request)
  const status = getRequestStatus(request);
  const timing = getRequestTiming(request)
  const formattedTiming = formatTiming(timing)
  
  return (
    <TableRow onClick={() => selectRequest(request)} hover selected={request === selectedRequest}>
      <TableCell sx={{
        maxWidth: '300px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FiberManualRecordIcon 
            sx={{ 
              color: getStatusColor(status), 
              fontSize: 16,
              mr: 1
            }} 
          />
          {request.request.url}
        </Box>
      </TableCell>
      <TableCell sx={{
        maxWidth: '300px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        { typeof message === 'string' ? message : message.invocations.flatMap((invocation) => invocation.capabilities.map((capability => capability.can))).join(", ")}
      </TableCell>
      <TableCell>{formattedTiming}</TableCell>
      <TableCell>
        <RequestActions request={request} />
      </TableCell>
    </TableRow>
  )
}

function RequestList({ requests, selectedRequest, selectRequest } : { requests: Request[], selectedRequest: Request | null, selectRequest: (request: Request) => void }) {
  const defaultChecked = JSON.parse(localStorage.getItem('persistOnReload') || 'false');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handlePersistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('persistOnReload', JSON.stringify(e.target.checked))
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const requestItems = requests.filter(isCarRequest).map((request, idx) => (
    <RequestEntry 
      key={`${request.request.url}-${idx}`} 
      selectedRequest={selectedRequest} 
      selectRequest={selectRequest} 
      request={request} 
    />
  ));

  return (
    <GroupingProvider requests={requests}>
      <Box sx={{ height: "100%", display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', px: 2, py: 1, gap: 2 }}>
          <Tooltip title="Manage Groups">
            <IconButton onClick={toggleDrawer}>
              <GroupIcon />
            </IconButton>
          </Tooltip>
          <FormControlLabel
            control={<Switch defaultChecked={defaultChecked} onChange={handlePersistChange} />}
            label="Persist across reloads"
          />
        </Box>
        <TableContainer sx={{ flexGrow: 1, overflowY: "scroll" }}>
          <Table
            stickyHeader
            aria-labelledby="tableTitle"
            size="small"
            sx={{
              '& .MuiTableCell-root': {
                py: 1,
                px: 2,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>URL</TableCell>
                <TableCell>Capabilities</TableCell>
                <TableCell><abbr title="Round Trip Time">RTT</abbr></TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requestItems}
            </TableBody>
          </Table>
        </TableContainer>

        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: '400px',
            },
          }}
        >
          <GroupManager />
        </Drawer>
      </Box>
    </GroupingProvider>
  )
}

export default RequestList