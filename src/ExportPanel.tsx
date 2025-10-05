import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Typography,
  Divider,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Compare as CompareIcon
} from '@mui/icons-material';
import { Request } from './types';
import {
  exportToHAR,
  exportToPostman,
  exportToCurl,
  exportToJavaScript,
  exportToTypeScript,
  exportToPython,
  downloadFile,
  copyToClipboard,
  createSnapshot,
  saveSnapshot,
  getSnapshots,
  deleteSnapshot,
  loadSnapshot,
  replayRequest,
  Snapshot,
  SnapshotMetadata,
  ReplayOptions,
  ReplayResult
} from './exportUtils';
import { isCarRequest } from './util';

interface ExportPanelProps {
  requests: Request[];
  onRequestsChange?: (requests: Request[]) => void;
}

export default function ExportPanel({ requests, onRequestsChange }: ExportPanelProps) {
  const [selectedRequests, setSelectedRequests] = useState<Request[]>([]);
  const [exportOptions, setExportOptions] = useState({
    includeResponseBodies: true,
    includeTiming: true,
    includeOnlyCarRequests: true
  });
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDescription, setNewSnapshotDescription] = useState('');
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  const [selectedReplayRequest, setSelectedReplayRequest] = useState<Request | null>(null);
  const [replayModifications, setReplayModifications] = useState({
    headers: {} as Record<string, string>,
    body: '',
    url: '',
    method: ''
  });
  const [replayResults, setReplayResults] = useState<ReplayResult[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [exportFormat, setExportFormat] = useState<'har' | 'postman' | 'curl' | 'javascript' | 'typescript' | 'python'>('har');

  useEffect(() => {
    setSnapshots(getSnapshots());
  }, []);

  const filteredRequests = requests.filter(request => 
    !exportOptions.includeOnlyCarRequests || isCarRequest(request)
  );

  const handleRequestSelection = (request: Request, selected: boolean) => {
    if (selected) {
      setSelectedRequests(prev => [...prev, request]);
    } else {
      setSelectedRequests(prev => prev.filter(r => r !== request));
    }
  };

  const handleSelectAll = () => {
    setSelectedRequests(filteredRequests);
  };

  const handleSelectNone = () => {
    setSelectedRequests([]);
  };

  const handleExport = () => {
    const requestsToExport = selectedRequests.length > 0 ? selectedRequests : filteredRequests;
    
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (exportFormat) {
      case 'har':
        content = exportToHAR({
          includeRequests: requestsToExport,
          includeResponseBodies: exportOptions.includeResponseBodies,
          includeTiming: exportOptions.includeTiming
        });
        filename = `ucan-requests-${Date.now()}.har`;
        mimeType = 'application/json';
        break;
      case 'postman':
        content = exportToPostman(requestsToExport);
        filename = `ucan-collection-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case 'curl':
        content = requestsToExport.map(exportToCurl).join('\n\n');
        filename = `ucan-requests-${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;
      case 'javascript':
        content = requestsToExport.map(exportToJavaScript).join('\n\n');
        filename = `ucan-requests-${Date.now()}.js`;
        mimeType = 'text/javascript';
        break;
      case 'typescript':
        content = requestsToExport.map(exportToTypeScript).join('\n\n');
        filename = `ucan-requests-${Date.now()}.ts`;
        mimeType = 'text/typescript';
        break;
      case 'python':
        content = requestsToExport.map(exportToPython).join('\n\n');
        filename = `ucan-requests-${Date.now()}.py`;
        mimeType = 'text/python';
        break;
      default:
        return;
    }

    downloadFile(content, filename, mimeType);
    setSnackbarMessage(`Exported ${requestsToExport.length} requests as ${exportFormat.toUpperCase()}`);
    setSnackbarOpen(true);
  };

  const handleCopyToClipboard = async () => {
    const requestsToExport = selectedRequests.length > 0 ? selectedRequests : filteredRequests;
    let content: string;

    switch (exportFormat) {
      case 'curl':
        content = requestsToExport.map(exportToCurl).join('\n\n');
        break;
      case 'javascript':
        content = requestsToExport.map(exportToJavaScript).join('\n\n');
        break;
      case 'typescript':
        content = requestsToExport.map(exportToTypeScript).join('\n\n');
        break;
      case 'python':
        content = requestsToExport.map(exportToPython).join('\n\n');
        break;
      default:
        return;
    }

    try {
      await copyToClipboard(content);
      setSnackbarMessage('Copied to clipboard!');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to copy to clipboard');
      setSnackbarOpen(true);
    }
  };

  const handleCreateSnapshot = () => {
    if (!newSnapshotName.trim()) return;

    const snapshot = createSnapshot(filteredRequests, {
      name: newSnapshotName,
      description: newSnapshotDescription,
      tags: []
    });

    saveSnapshot(snapshot);
    setSnapshots(getSnapshots());
    setSnapshotDialogOpen(false);
    setNewSnapshotName('');
    setNewSnapshotDescription('');
    setSnackbarMessage(`Snapshot "${newSnapshotName}" created successfully!`);
    setSnackbarOpen(true);
  };

  const handleLoadSnapshot = (snapshot: Snapshot) => {
    if (onRequestsChange) {
      onRequestsChange(snapshot.requests);
    }
    setSnackbarMessage(`Loaded snapshot "${snapshot.name}"`);
    setSnackbarOpen(true);
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    deleteSnapshot(snapshotId);
    setSnapshots(getSnapshots());
    setSnackbarMessage('Snapshot deleted');
    setSnackbarOpen(true);
  };

  const handleReplayRequest = async () => {
    if (!selectedReplayRequest) return;

    const options: ReplayOptions = {
      request: selectedReplayRequest,
      modifications: replayModifications,
      delay: 1000
    };

    const result = await replayRequest(options);
    setReplayResults(prev => [...prev, result]);
    setReplayDialogOpen(false);
    setSnackbarMessage(result.success ? 'Request replayed successfully!' : `Replay failed: ${result.error}`);
    setSnackbarOpen(true);
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Export & Sharing
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Request Selection" />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Button onClick={handleSelectAll} size="small" sx={{ mr: 1 }}>
              Select All ({filteredRequests.length})
            </Button>
            <Button onClick={handleSelectNone} size="small">
              Select None
            </Button>
          </Box>
          
          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {filteredRequests.map((request, index) => (
              <FormControlLabel
                key={`${request.request.url}-${index}`}
                control={
                  <Checkbox
                    checked={selectedRequests.includes(request)}
                    onChange={(e) => handleRequestSelection(request, e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {request.request.method} {request.request.url}
                    </Typography>
                    <Chip 
                      label={request.response.status} 
                      size="small" 
                      color={request.response.status >= 400 ? 'error' : request.response.status >= 200 ? 'success' : 'default'}
                    />
                  </Box>
                }
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Export Options" />
        <CardContent>
          <FormControl component="fieldset">
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeResponseBodies}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeResponseBodies: e.target.checked }))}
                  />
                }
                label="Include Response Bodies"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeTiming}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeTiming: e.target.checked }))}
                  />
                }
                label="Include Timing Information"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeOnlyCarRequests}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeOnlyCarRequests: e.target.checked }))}
                  />
                }
                label="Include Only CAR/UCAN Requests"
              />
            </FormGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Export Format" />
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              label="Format"
            >
              <MenuItem value="har">HAR (HTTP Archive)</MenuItem>
              <MenuItem value="postman">Postman Collection</MenuItem>
              <MenuItem value="curl">cURL Commands</MenuItem>
              <MenuItem value="javascript">JavaScript (fetch)</MenuItem>
              <MenuItem value="typescript">TypeScript (fetch)</MenuItem>
              <MenuItem value="python">Python (requests)</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={filteredRequests.length === 0}
            >
              Download
            </Button>
            {(exportFormat === 'curl' || exportFormat === 'javascript' || exportFormat === 'typescript' || exportFormat === 'python') && (
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={handleCopyToClipboard}
                disabled={filteredRequests.length === 0}
              >
                Copy to Clipboard
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Snapshots" 
          action={
            <Button
              startIcon={<AddIcon />}
              onClick={() => setSnapshotDialogOpen(true)}
            >
              Create Snapshot
            </Button>
          }
        />
        <CardContent>
          {snapshots.length === 0 ? (
            <Typography color="text.secondary">
              No snapshots created yet. Create a snapshot to save the current request state.
            </Typography>
          ) : (
            <List>
              {snapshots.map((snapshot) => (
                <ListItem key={snapshot.id}>
                  <ListItemText
                    primary={snapshot.name}
                    secondary={`${snapshot.requests.length} requests • ${new Date(snapshot.timestamp).toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Load Snapshot">
                      <IconButton onClick={() => handleLoadSnapshot(snapshot)}>
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Snapshot">
                      <IconButton onClick={() => handleDeleteSnapshot(snapshot.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Request Replay" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Replay requests with modifications to test API changes.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<PlayIcon />}
            onClick={() => {
              if (selectedRequests.length === 1) {
                setSelectedReplayRequest(selectedRequests[0]);
                setReplayDialogOpen(true);
              } else {
                setSnackbarMessage('Please select exactly one request to replay');
                setSnackbarOpen(true);
              }
            }}
            disabled={selectedRequests.length !== 1}
          >
            Replay Selected Request
          </Button>
        </CardContent>
      </Card>

      {replayResults.length > 0 && (
        <Card>
          <CardHeader title="Replay Results" />
          <CardContent>
            {replayResults.map((result, index) => (
              <Alert 
                key={index} 
                severity={result.success ? 'success' : 'error'}
                sx={{ mb: 1 }}
              >
                {result.success ? 'Replay successful' : `Replay failed: ${result.error}`}
                {result.timing && ` (${result.timing}ms)`}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={snapshotDialogOpen} onClose={() => setSnapshotDialogOpen(false)}>
        <DialogTitle>Create Snapshot</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Snapshot Name"
            fullWidth
            value={newSnapshotName}
            onChange={(e) => setNewSnapshotName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newSnapshotDescription}
            onChange={(e) => setNewSnapshotDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnapshotDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSnapshot} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={replayDialogOpen} onClose={() => setReplayDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Replay Request</DialogTitle>
        <DialogContent>
          {selectedReplayRequest && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedReplayRequest.request.method} {selectedReplayRequest.request.url}
              </Typography>
              
              <TextField
                label="URL (optional)"
                fullWidth
                value={replayModifications.url}
                onChange={(e) => setReplayModifications(prev => ({ ...prev, url: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Request Body (optional)"
                fullWidth
                multiline
                rows={4}
                value={replayModifications.body}
                onChange={(e) => setReplayModifications(prev => ({ ...prev, body: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle2" gutterBottom>
                Headers (JSON format)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                value={JSON.stringify(replayModifications.headers, null, 2)}
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    setReplayModifications(prev => ({ ...prev, headers }));
                  } catch {
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplayDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReplayRequest} variant="contained">
            Replay
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
