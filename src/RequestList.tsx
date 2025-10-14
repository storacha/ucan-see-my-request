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
import { isCarRequest, messageFromRequest, getRequestStatus, getStatusColor, getRequestTiming, formatTiming, getRequestKey } from "./util";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'

function RequestEntry({ request, selectedRequest, selectRequest, tagsByRequestKey, onAddTag, onRemoveTag } : {request: Request, selectedRequest: Request | null, selectRequest: (request: Request) => void, tagsByRequestKey: Record<string, string[]>, onAddTag: (r: Request, tag: string) => void, onRemoveTag: (r: Request, tag: string) => void}) {
  const message = messageFromRequest(request)
  const status = getRequestStatus(request);
  const timing = getRequestTiming(request)
  const formattedTiming = formatTiming(timing)
  const requestKey = getRequestKey(request)
  const tags = tagsByRequestKey[requestKey] || []
  const [newTag, setNewTag] = useState("")
  
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
          {tags.map((t) => (
            <Chip key={t} label={t} size="small" onDelete={() => onRemoveTag(request, t)} />
          ))}
          <TextField 
            size="small" 
            placeholder="+tag" 
            value={newTag} 
            onChange={(e) => setNewTag(e.target.value)} 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = newTag.trim()
                if (v) {
                  onAddTag(request, v)
                  setNewTag("")
                }
              }
            }}
            sx={{ width: 80 }}
          />
        </Box>
      </TableCell>
    </TableRow>
  )
}

function RequestList({ requests, selectedRequest, selectRequest, tagsByRequestKey, onAddTag, onRemoveTag } : { requests: Request[], selectedRequest: Request | null, selectRequest: (request: Request) => void, tagsByRequestKey: Record<string, string[]>, onAddTag: (r: Request, tag: string) => void, onRemoveTag: (r: Request, tag: string) => void }) {
  const defaultChecked = JSON.parse(localStorage.getItem('persistOnReload') || 'false')

  const handlePersistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('persistOnReload', JSON.stringify(e.target.checked))
  }

  const requestItems = requests.filter(isCarRequest).map((request, idx) => (
    <RequestEntry 
      key={`${request.request.url}-${idx}`}
      selectedRequest={selectedRequest}
      selectRequest={selectRequest}
      request={request}
      tagsByRequestKey={tagsByRequestKey}
      onAddTag={onAddTag}
      onRemoveTag={onRemoveTag}
    />
  ))
  return (
    <TableContainer sx={{height: "100%", overflowY: "scroll"}}>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1 }}>
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
          <TableCell>Tags</TableCell>
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