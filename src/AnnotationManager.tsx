import React, { useState, useEffect } from 'react'
import { Request, RequestAnnotation, RequestColor, RequestStatus } from './types'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import PushPinIcon from '@mui/icons-material/PushPin'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import CircleIcon from '@mui/icons-material/Circle'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import Typography from '@mui/material/Typography'

interface AnnotationManagerProps {
  open: boolean
  onClose: () => void
  request: Request | null
  annotation?: RequestAnnotation
  onSave: (annotation: RequestAnnotation) => void
  onDelete: () => void
}

const colorOptions: { value: RequestColor; color: string; label: string }[] = [
  { value: 'default', color: '#757575', label: 'Default' },
  { value: 'red', color: '#f44336', label: 'Red' },
  { value: 'orange', color: '#ff9800', label: 'Orange' },
  { value: 'yellow', color: '#ffeb3b', label: 'Yellow' },
  { value: 'green', color: '#4caf50', label: 'Green' },
  { value: 'blue', color: '#2196f3', label: 'Blue' },
  { value: 'purple', color: '#9c27b0', label: 'Purple' },
]

const statusOptions: { value: RequestStatus; icon: React.ReactNode; label: string }[] = [
  { value: 'none', icon: <CircleIcon />, label: 'None' },
  { value: 'resolved', icon: <CheckCircleIcon />, label: 'Resolved' },
  { value: 'needs-attention', icon: <ErrorIcon />, label: 'Needs Attention' },
]

export function AnnotationManager({ open, onClose, request, annotation, onSave, onDelete }: AnnotationManagerProps) {
  const [note, setNote] = useState('')
  const [color, setColor] = useState<RequestColor>('default')
  const [status, setStatus] = useState<RequestStatus>('none')
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    if (annotation) {
      setNote(annotation.note)
      setColor(annotation.color)
      setStatus(annotation.status)
      setIsPinned(annotation.isPinned)
    } else {
      setNote('')
      setColor('default')
      setStatus('none')
      setIsPinned(false)
    }
  }, [annotation, open])

  const handleSave = () => {
    const now = Date.now()
    const newAnnotation: RequestAnnotation = {
      id: annotation?.id || `${now}`,
      note,
      color,
      status,
      isPinned,
      createdAt: annotation?.createdAt || now,
      updatedAt: now,
    }
    onSave(newAnnotation)
    onClose()
  }

  const handleColorChange = (_: React.MouseEvent<HTMLElement>, newColor: RequestColor | null) => {
    if (newColor !== null) {
      setColor(newColor)
    }
  }

  const handleStatusChange = (_: React.MouseEvent<HTMLElement>, newStatus: RequestStatus | null) => {
    if (newStatus !== null) {
      setStatus(newStatus)
    }
  }

  if (!request) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Annotate Request</Typography>
          <IconButton onClick={() => setIsPinned(!isPinned)} color={isPinned ? 'primary' : 'default'}>
            {isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="Note"
            multiline
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="Add a note about this request..."
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Color
            </Typography>
            <ToggleButtonGroup
              value={color}
              exclusive
              onChange={handleColorChange}
              aria-label="request color"
              sx={{ flexWrap: 'wrap' }}
            >
              {colorOptions.map((option) => (
                <ToggleButton key={option.value} value={option.value} aria-label={option.label}>
                  <CircleIcon sx={{ color: option.color }} />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Status
            </Typography>
            <ToggleButtonGroup
              value={status}
              exclusive
              onChange={handleStatusChange}
              aria-label="request status"
              fullWidth
            >
              {statusOptions.map((option) => (
                <ToggleButton key={option.value} value={option.value} aria-label={option.label}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    <span>{option.label}</span>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        {annotation && (
          <Button onClick={onDelete} color="error" sx={{ mr: 'auto' }}>
            Delete Annotation
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
