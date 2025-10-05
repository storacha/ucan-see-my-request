import React, { useState, useEffect, useRef } from 'react'
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
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { isCarRequest, messageFromRequest, getRequestStatus, getStatusColor, getRequestTiming, formatTiming } from "./util";
import { 
  filterRequests, 
  SearchFilter, 
  saveBookmark, 
  getBookmarks, 
  deleteBookmark, 
  findBookmarkByRequest,
  compareRequests,
  createBulkOperations,
  createKeyboardShortcuts,
  createNavigationState,
  navigateUp,
  navigateDown,
  toggleSelection,
  selectAll,
  clearSelection,
  NavigationState
} from './uxUtils';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CompareIcon from '@mui/icons-material/Compare';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ClearIcon from '@mui/icons-material/Clear';

function RequestEntry({ 
  request, 
  selectedRequest, 
  selectRequest, 
  isSelected,
  onToggleSelection,
  onToggleBookmark,
  isBookmarked,
  onCompare
}: {
  request: Request;
  selectedRequest: Request | null;
  selectRequest: (request: Request) => void;
  isSelected: boolean;
  onToggleSelection: () => void;
  onToggleBookmark: () => void;
  isBookmarked: boolean;
  onCompare: () => void;
}) {
  const message = messageFromRequest(request)
  const status = getRequestStatus(request);
  const timing = getRequestTiming(request)
  const formattedTiming = formatTiming(timing)
  
  return (
    <TableRow 
      hover 
      selected={request === selectedRequest}
      sx={{
        backgroundColor: isSelected ? 'action.selected' : 'inherit',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      <TableCell sx={{ width: '48px', padding: '8px' }}>
        <Checkbox
          checked={isSelected}
          onChange={onToggleSelection}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
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
          <Box 
            onClick={() => selectRequest(request)}
            sx={{ 
              flex: 1,
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {request.request.url}
          </Box>
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
      <TableCell sx={{ width: '120px' }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={isBookmarked ? "Remove bookmark" : "Add bookmark"}>
            <IconButton size="small" onClick={onToggleBookmark}>
              {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Compare">
            <IconButton size="small" onClick={onCompare}>
              <CompareIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  )
}

function RequestList({ 
  requests, 
  selectedRequest, 
  selectRequest,
  onBulkOperation
}: { 
  requests: Request[];
  selectedRequest: Request | null;
  selectRequest: (request: Request) => void;
  onBulkOperation?: (operation: string, selectedRequests: Request[]) => void;
}) {
  const [searchFilter, setSearchFilter] = useState<SearchFilter>({ query: '' });
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [navigationState, setNavigationState] = useState<NavigationState>(createNavigationState(0));
  const [showSearch, setShowSearch] = useState(false);
  const [bookmarks, setBookmarks] = useState(getBookmarks());
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareRequests, setCompareRequests] = useState<Request[]>([]);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const defaultChecked = JSON.parse(localStorage.getItem('persistOnReload') || 'false');
  const filteredRequests = filterRequests(requests.filter(isCarRequest), searchFilter);
  
  useEffect(() => {
    setNavigationState(createNavigationState(filteredRequests.length));
  }, [filteredRequests.length]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handlePersistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('persistOnReload', JSON.stringify(e.target.checked));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(prev => ({ ...prev, query: e.target.value }));
  };

  const handleToggleSelection = (index: number) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allIndices = new Set(filteredRequests.map((_, index) => index));
    setSelectedRequests(allIndices);
  };

  const handleClearSelection = () => {
    setSelectedRequests(new Set());
  };

  const handleToggleBookmark = (request: Request) => {
    const existingBookmark = findBookmarkByRequest(request);
    if (existingBookmark) {
      deleteBookmark(existingBookmark.id);
    } else {
      saveBookmark(request, `Request ${request.request.method} ${request.request.url}`, undefined, []);
    }
    setBookmarks(getBookmarks());
  };

  const handleCompare = (request: Request) => {
    if (compareRequests.length === 0) {
      setCompareRequests([request]);
    } else if (compareRequests.length === 1) {
      setCompareRequests([...compareRequests, request]);
      setCompareDialogOpen(true);
    } else {
      setCompareRequests([request]);
    }
  };

  const handleBulkOperation = (operation: string) => {
    const selectedRequestObjects = Array.from(selectedRequests).map(index => filteredRequests[index]);
    if (onBulkOperation) {
      onBulkOperation(operation, selectedRequestObjects);
    }
    setBulkMenuAnchor(null);
  };

  const bulkOperations = createBulkOperations(
    (requests) => handleBulkOperation('export'),
    (requests) => handleBulkOperation('delete'),
    (requests) => handleBulkOperation('bookmark'),
    (requests) => handleBulkOperation('compare'),
    (requests) => handleBulkOperation('replay')
  );

  const keyboardShortcuts = createKeyboardShortcuts(
    () => setShowSearch(true),
    () => setNavigationState(prev => navigateUp(prev)),
    () => setNavigationState(prev => navigateDown(prev)),
    handleSelectAll,
    handleClearSelection,
    () => {}, // Toggle bookmark for current request
    () => {}, // Compare current request
    () => handleBulkOperation('export')
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = keyboardShortcuts.find(s => 
        s.key === e.key && 
        s.ctrlKey === e.ctrlKey && 
        s.shiftKey === e.shiftKey && 
        s.altKey === e.altKey
      );
      
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts]);

  const requestItems = filteredRequests.map((request, idx) => {
    const isBookmarked = findBookmarkByRequest(request) !== null;
    return (
      <RequestEntry 
        key={`${request.request.url}-${idx}`} 
        request={request}
        selectedRequest={selectedRequest} 
        selectRequest={selectRequest}
        isSelected={selectedRequests.has(idx)}
        onToggleSelection={() => handleToggleSelection(idx)}
        onToggleBookmark={() => handleToggleBookmark(request)}
        isBookmarked={isBookmarked}
        onCompare={() => handleCompare(request)}
      />
    );
  });

  return (
    <Box sx={{ height: "100%", display: 'flex', flexDirection: 'column' }}>
      {/* Search and Controls */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {showSearch ? (
            <TextField
              ref={searchInputRef}
              placeholder="Search requests..."
              value={searchFilter.query}
              onChange={handleSearchChange}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small" onClick={() => setShowSearch(false)}>
                    <ClearIcon />
                  </IconButton>
                )
              }}
            />
          ) : (
            <IconButton onClick={() => setShowSearch(true)}>
              <SearchIcon />
            </IconButton>
          )}
          
          <FormControlLabel
            control={<Switch defaultChecked={defaultChecked} onChange={handlePersistChange} />}
            label="Persist across reloads"
          />
        </Box>

        {/* Bulk Operations */}
        {selectedRequests.size > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip 
              label={`${selectedRequests.size} selected`} 
              color="primary" 
              size="small"
            />
            <Button
              size="small"
              onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
              startIcon={<MoreVertIcon />}
            >
              Bulk Actions
            </Button>
            <Button size="small" onClick={handleClearSelection}>
              Clear
            </Button>
          </Box>
        )}
      </Box>

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflowY: "scroll" }}>
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
              <TableCell sx={{ width: '48px' }}>
                <Checkbox
                  checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                  indeterminate={selectedRequests.size > 0 && selectedRequests.size < filteredRequests.length}
                  onChange={selectedRequests.size === filteredRequests.length ? handleClearSelection : handleSelectAll}
                />
              </TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Capabilities</TableCell>
              <TableCell><abbr title="Round Trip Time">RTT</abbr></TableCell>
              <TableCell sx={{ width: '120px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requestItems}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bulk Operations Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={() => setBulkMenuAnchor(null)}
      >
        {bulkOperations.map((operation) => (
          <MenuItem 
            key={operation.id}
            onClick={() => handleBulkOperation(operation.id)}
          >
            {operation.name}
          </MenuItem>
        ))}
      </Menu>

      <Dialog 
        open={compareDialogOpen} 
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Request Comparison</DialogTitle>
        <DialogContent>
          {compareRequests.length === 2 && (
            <ComparisonView 
              request1={compareRequests[0]} 
              request2={compareRequests[1]} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ComparisonView({ request1, request2 }: { request1: Request; request2: Request }) {
  const comparison = compareRequests(request1, request2);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Request Comparison</Typography>
        <Chip 
          label={`${Math.round(comparison.similarity)}% similar`}
          color={comparison.similarity > 80 ? 'success' : comparison.similarity > 50 ? 'warning' : 'error'}
        />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Request 1: {request1.request.method} {request1.request.url}
          </Typography>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
              {JSON.stringify({
                method: request1.request.method,
                url: request1.request.url,
                status: request1.response.status,
                headers: request1.request.headers.reduce((acc, h) => ({ ...acc, [h.name]: h.value }), {})
              }, null, 2)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Request 2: {request2.request.method} {request2.request.url}
          </Typography>
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
              {JSON.stringify({
                method: request2.request.method,
                url: request2.request.url,
                status: request2.response.status,
                headers: request2.request.headers.reduce((acc, h) => ({ ...acc, [h.name]: h.value }), {})
              }, null, 2)}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Differences ({comparison.differences.filter(d => d.type !== 'unchanged').length})
        </Typography>
        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {comparison.differences
            .filter(d => d.type !== 'unchanged')
            .map((diff, index) => (
              <Box key={index} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {diff.field}
                </Typography>
                <Typography variant="body2" color="error">
                  - {diff.left || 'undefined'}
                </Typography>
                <Typography variant="body2" color="success.main">
                  + {diff.right || 'undefined'}
                </Typography>
              </Box>
            ))}
        </Box>
      </Box>
    </Box>
  );
}

export default RequestList