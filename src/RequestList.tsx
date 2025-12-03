import React, { useState, useMemo } from 'react'
import { Request, isChromeRequest, RequestAnnotation } from "./types"
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
import { useAnnotations, getRequestId } from './AnnotationContext';
import { AnnotationManager } from './AnnotationManager';
import IconButton from '@mui/material/IconButton';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PushPinIcon from '@mui/icons-material/PushPin';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import Button from '@mui/material/Button';

const getAnnotationColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    default: '#757575',
    red: '#f44336',
    orange: '#ff9800',
    yellow: '#ffeb3b',
    green: '#4caf50',
    blue: '#2196f3',
    purple: '#9c27b0',
  }
  return colorMap[color] || colorMap.default
}

function RequestEntry({ request, selectedRequest, selectRequest, onEditAnnotation } : {request: Request, selectedRequest: Request | null, selectRequest: (request: Request) => void, onEditAnnotation: (request: Request) => void}) {
  const { getAnnotation } = useAnnotations()
  const requestId = getRequestId(request)
  const annotation = getAnnotation(requestId)
  const message = messageFromRequest(request)
  const status = getRequestStatus(request);
  const timing = getRequestTiming(request)
  const formattedTiming = formatTiming(timing)
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEditAnnotation(request)
  }
  
  return (
    <TableRow 
      onClick={() => selectRequest(request)} 
      hover 
      selected={request === selectedRequest}
      sx={{
        borderLeft: annotation?.color && annotation.color !== 'default' ? `4px solid ${getAnnotationColor(annotation.color)}` : undefined,
      }}
    >
      <TableCell sx={{
        maxWidth: '300px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FiberManualRecordIcon 
            sx={{ 
              color: getStatusColor(status), 
              fontSize: 16,
              mr: 1
            }} 
          />
          {annotation?.isPinned && (
            <Tooltip title="Pinned">
              <PushPinIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            </Tooltip>
          )}
          {annotation?.status === 'resolved' && (
            <Tooltip title="Resolved">
              <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
            </Tooltip>
          )}
          {annotation?.status === 'needs-attention' && (
            <Tooltip title="Needs Attention">
              <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />
            </Tooltip>
          )}
          <span>{request.request.url}</span>
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
      <TableCell sx={{ width: 120 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {annotation?.note && (
            <Tooltip title={annotation.note}>
              <Chip 
                label="Note" 
                size="small" 
                variant="outlined"
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            </Tooltip>
          )}
          <IconButton size="small" onClick={handleEditClick}>
            <EditNoteIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  )
}

function RequestList({ requests, selectedRequest, selectRequest } : { requests: Request[], selectedRequest: Request | null, selectRequest: (request: Request) => void }) {
  const { annotations, getAnnotation, setAnnotation, deleteAnnotation, clearAllAnnotations } = useAnnotations()
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const defaultChecked = JSON.parse(localStorage.getItem('persistOnReload') || 'false')

  const handlePersistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('persistOnReload', JSON.stringify(e.target.checked))
  }

  const handleEditAnnotation = (request: Request) => {
    setEditingRequest(request)
    setAnnotationDialogOpen(true)
  }

  const handleSaveAnnotation = (annotation: RequestAnnotation) => {
    if (editingRequest) {
      const requestId = getRequestId(editingRequest)
      setAnnotation(requestId, annotation)
    }
  }

  const handleDeleteAnnotation = () => {
    if (editingRequest) {
      const requestId = getRequestId(editingRequest)
      deleteAnnotation(requestId)
      setAnnotationDialogOpen(false)
    }
  }

  const sortedRequests = useMemo(() => {
    const filtered = requests.filter(isCarRequest)
    return filtered.sort((a, b) => {
      const aId = getRequestId(a)
      const bId = getRequestId(b)
      const aAnnotation = getAnnotation(aId)
      const bAnnotation = getAnnotation(bId)
      
      if (aAnnotation?.isPinned && !bAnnotation?.isPinned) return -1
      if (!aAnnotation?.isPinned && bAnnotation?.isPinned) return 1
      
      return 0
    })
  }, [requests, annotations, getAnnotation])

  const requestItems = sortedRequests.map((request, idx) => (
    <RequestEntry 
      key={`${request.request.url}-${idx}`} 
      selectedRequest={selectedRequest} 
      selectRequest={selectRequest} 
      request={request}
      onEditAnnotation={handleEditAnnotation}
    />
  ))
  return (
    <>
    <TableContainer sx={{height: "100%", overflowY: "scroll"}}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
      <Button
        startIcon={<ClearAllIcon />}
        onClick={clearAllAnnotations}
        size="small"
        disabled={annotations.size === 0}
      >
        Clear All Annotations
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
          <TableCell>URL</TableCell>
          <TableCell>Capabilities</TableCell>
          <TableCell><abbr title="Round Trip Time">RTT</abbr></TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
      { requestItems }
      </TableBody>
    </Table>
    </TableContainer>
    {editingRequest && (
      <AnnotationManager
        open={annotationDialogOpen}
        onClose={() => setAnnotationDialogOpen(false)}
        request={editingRequest}
        annotation={getAnnotation(getRequestId(editingRequest))}
        onSave={handleSaveAnnotation}
        onDelete={handleDeleteAnnotation}
      />
    )}
    </>
  )
}

export default RequestList