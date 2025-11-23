import React, { useState, useMemo } from 'react'
import { Request, isChromeRequest } from "./types"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import ClearIcon from '@mui/icons-material/Clear';
import { visuallyHidden } from '@mui/utils';
import { isCarRequest, messageFromRequest, getRequestStatus, getStatusColor, getRequestTiming, formatTiming } from "./util";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

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
    </TableRow>
  )
}

type Order = 'asc' | 'desc';
type OrderBy = 'url' | 'capabilities' | 'rtt';

function RequestList({ requests, selectedRequest, selectRequest, onClearRequests } : { requests: Request[], selectedRequest: Request | null, selectRequest: (request: Request) => void, onClearRequests?: () => void }) {
  const defaultChecked = JSON.parse(localStorage.getItem('persistOnReload') || 'false')
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('url');

  const handlePersistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('persistOnReload', JSON.stringify(e.target.checked))
  }

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const createSortHandler = (property: OrderBy) => (event: React.MouseEvent<unknown>) => {
    handleRequestSort(property);
  };

  const getCapabilitiesString = (request: Request): string => {
    const message = messageFromRequest(request);
    if (typeof message === 'string') {
      return message;
    }
    return message.invocations.flatMap((invocation) => 
      invocation.capabilities.map((capability => capability.can))
    ).join(", ");
  };

  const sortedRequests = useMemo(() => {
    const filteredRequests = requests.filter(isCarRequest);
    
    return filteredRequests.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (orderBy) {
        case 'url':
          aValue = a.request.url;
          bValue = b.request.url;
          break;
        case 'capabilities':
          aValue = getCapabilitiesString(a);
          bValue = getCapabilitiesString(b);
          break;
        case 'rtt':
          aValue = getRequestTiming(a) || 0;
          bValue = getRequestTiming(b) || 0;
          break;
        default:
          return 0;
      }

      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [requests, order, orderBy]);

  const requestItems = sortedRequests.map((request, idx) => 
    <RequestEntry 
      key={`${request.request.url}-${idx}`} 
      selectedRequest={selectedRequest} 
      selectRequest={selectRequest} 
      request={request} 
    />
  );

  return (
    <TableContainer sx={{height: "100%", overflowY: "scroll"}}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
      <Button
        variant="outlined"
        startIcon={<ClearIcon />}
        onClick={onClearRequests}
        disabled={requests.length === 0}
        size="small"
      >
        Clear
      </Button>
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
          <TableCell
            sortDirection={orderBy === 'url' ? order : false}
          >
            <TableSortLabel
              active={orderBy === 'url'}
              direction={orderBy === 'url' ? order : 'asc'}
              onClick={createSortHandler('url')}
            >
              URL
              {orderBy === 'url' ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
          <TableCell
            sortDirection={orderBy === 'capabilities' ? order : false}
          >
            <TableSortLabel
              active={orderBy === 'capabilities'}
              direction={orderBy === 'capabilities' ? order : 'asc'}
              onClick={createSortHandler('capabilities')}
            >
              Capabilities
              {orderBy === 'capabilities' ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
          <TableCell
            sortDirection={orderBy === 'rtt' ? order : false}
          >
            <TableSortLabel
              active={orderBy === 'rtt'}
              direction={orderBy === 'rtt' ? order : 'asc'}
              onClick={createSortHandler('rtt')}
            >
              <abbr title="Round Trip Time">RTT</abbr>
              {orderBy === 'rtt' ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
      { requestItems }
      </TableBody>
    </Table>
    </TableContainer>
  )
}

export default RequestList