import React, { useState, useEffect } from 'react'
import { Request, isChromeRequest, RequestStatus } from "./types"
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
import SearchFilters, { FilterState } from './SearchFilters';

const defaultFilters: FilterState = {
  urlSearch: '',
  capabilitySearch: '',
  status: 'all',
  minTiming: '',
  maxTiming: ''
};

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

function filterRequests(requests: Request[], filters: FilterState): Request[] {
  return requests.filter(request => {
    const message = messageFromRequest(request);
    const status = getRequestStatus(request);
    const timing = getRequestTiming(request);
    
    if (filters.urlSearch && !request.request.url.toLowerCase().includes(filters.urlSearch.toLowerCase())) {
      return false;
    }

    if (filters.capabilitySearch && typeof message !== 'string') {
      const capabilities = message.invocations
        .flatMap(inv => inv.capabilities.map(cap => cap.can))
        .join(", ")
        .toLowerCase();
      if (!capabilities.includes(filters.capabilitySearch.toLowerCase())) {
        return false;
      }
    }

    if (filters.status !== 'all' && status !== filters.status) {
      return false;
    }

    if (timing !== null) {
      if (filters.minTiming !== '' && timing < filters.minTiming) {
        return false;
      }
      if (filters.maxTiming !== '' && timing > filters.maxTiming) {
        return false;
      }
    }

    return true;
  });
}

function RequestList({ requests, selectedRequest, selectRequest } : { requests: Request[], selectedRequest: Request | null, selectRequest: (request: Request) => void }) {
  const defaultChecked = JSON.parse(localStorage.getItem('persistOnReload') || 'false');
  const savedFilters = JSON.parse(localStorage.getItem('requestFilters') || 'null');
  const [filters, setFilters] = useState<FilterState>(savedFilters || defaultFilters);

  useEffect(() => {
    localStorage.setItem('requestFilters', JSON.stringify(filters));
  }, [filters]);

  const handlePersistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('persistOnReload', JSON.stringify(e.target.checked))
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const filteredRequests = filterRequests(requests.filter(isCarRequest), filters);
  const requestItems = filteredRequests.map((request, idx) => (
    <RequestEntry 
      key={`${request.request.url}-${idx}`} 
      selectedRequest={selectedRequest} 
      selectRequest={selectRequest} 
      request={request} 
    />
  ));

  return (
    <Box sx={{ height: "100%", display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1 }}>
          <FormControlLabel
            control={<Switch defaultChecked={defaultChecked} onChange={handlePersistChange} />}
            label="Persist across reloads"
          />
        </Box>
        <SearchFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
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
            </TableRow>
          </TableHead>
          <TableBody>
            {requestItems}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default RequestList