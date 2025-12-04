import React from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

interface CopyNotificationProps {
  open: boolean
  onClose: () => void
  message: string
  severity?: 'success' | 'error'
}

export function CopyNotification({ open, onClose, message, severity = 'success' }: CopyNotificationProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={2000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  )
}
