import React from 'react'
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
import Typography from '@mui/material/Typography';
import KeyboardIcon from '@mui/icons-material/Keyboard';

function RequestEntry({ request, selectedRequest, selectRequest } : {request: Request, selectedRequest: Request | null, selectRequest: (request: Request) => void}) {
  const message = messageFromRequest(request)
  const status = getRequestStatus(request);
  const timing = getRequestTiming(request)
  const formattedTiming = formatTiming(timing)
  
  return (
    <TableRow 
      onClick={() => selectRequest(request)} 
      hover 
      selected={request === selectedRequest}
      sx={{
        cursor: 'pointer',
        '&.Mui-selected': {
          backgroundColor: theme => theme.palette.action.selected,
        },
        '&.Mui-selected:hover': {
          backgroundColor: theme => theme.palette.action.hover,
        },
      }}
    >
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
    </TableRow>
  )
}

function RequestList({ requests, selectedRequest, selectRequest } : { requests: Request[], selectedRequest: Request | null, selectRequest: (request: Request) => void }) {
  const defaultChecked = JSON.parse(localStorage.getItem('persistOnReload') || 'false')

  const handlePersistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('persistOnReload', JSON.stringify(e.target.checked))
  }

  const filteredRequests = requests.filter(isCarRequest)
  const requestItems = filteredRequests.map((request, idx) => (
    <RequestEntry 
      key={`${request.request.url}-${idx}`} 
      selectedRequest={selectedRequest} 
      selectRequest={selectRequest} 
      request={request} 
    />
  ))
  
  return (
    <TableContainer sx={{height: "100%", overflowY: "scroll"}}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyboardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          Use arrow keys or j/k to navigate, Enter to open, {selectedRequest ? 'Ctrl/Cmd+C to copy, ' : ''}? for help
        </Typography>
      </Box>
      <FormControlLabel
        control={<Switch defaultChecked={defaultChecked} onChange={handlePersistChange} />}
        label="Persist across reloads"
      />
    </Box>
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
        </TableRow>
      </TableHead>
      <TableBody>
      { requestItems.length > 0 ? requestItems : (
        <TableRow>
          <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              No UCAN requests captured yet.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Navigate to a UCAN-enabled page and requests will appear here.
            </Typography>
          </TableCell>
        </TableRow>
      )}
      </TableBody>
    </Table>
    </TableContainer>
  )
}

export default RequestList