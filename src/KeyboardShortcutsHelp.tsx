import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

interface KeyboardShortcutsHelpProps {
  open: boolean
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  shortcuts: Array<{
    keys: string[]
    description: string
  }>
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Arrow Up', 'k'], description: 'Navigate up' },
      { keys: ['Arrow Down', 'j'], description: 'Navigate down' },
      { keys: ['Enter'], description: 'Open request details' },
      { keys: ['Escape'], description: 'Close details panel' },
      { keys: ['Home'], description: 'Jump to first request' },
      { keys: ['End'], description: 'Jump to last request' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['Ctrl/Cmd+F'], description: 'Search requests' },
      { keys: ['Ctrl/Cmd+C'], description: 'Copy request data' },
      { keys: ['Ctrl/Cmd+K'], description: 'Clear all requests' },
    ],
  },
  {
    title: 'Interface',
    shortcuts: [
      { keys: ['Alt+T'], description: 'Toggle dark/light theme' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
]

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const formatKey = (key: string) => {
    if (key.includes('Ctrl/Cmd')) {
      return key.replace('Ctrl/Cmd', isMac ? 'Cmd' : 'Ctrl')
    }
    if (isMac && key.includes('Ctrl')) {
      return key.replace('Ctrl', 'Cmd')
    }
    if (!isMac && key.includes('Cmd')) {
      return key.replace('Cmd', 'Ctrl')
    }
    return key
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Keyboard Shortcuts</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {shortcutGroups.map((group) => (
            <Box key={group.title}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {group.title}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    {group.shortcuts.map((shortcut, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ width: '40%' }}>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {shortcut.keys.map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                {keyIndex > 0 && (
                                  <Typography variant="body2" color="text.secondary">
                                    or
                                  </Typography>
                                )}
                                <Chip
                                  label={formatKey(key)}
                                  size="small"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                  }}
                                />
                              </React.Fragment>
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>{shortcut.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
