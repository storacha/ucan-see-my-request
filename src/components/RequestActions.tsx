import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  Checkbox,
  DialogActions,
  Button,
  Chip,
  Box,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Label as LabelIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useGrouping } from '../contexts/GroupingContext';
import { Request } from '../types';

interface RequestActionsProps {
  request: Request;
}

export default function RequestActions({ request }: RequestActionsProps) {
  const {
    state,
    addTagToRequest,
    removeTagFromRequest,
    addRequestToGroup,
    removeRequestFromGroup,
    getRequestGroups,
    getRequestTags,
  } = useGrouping();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTagDialogOpen = () => {
    setTagDialogOpen(true);
    handleClose();
  };

  const handleGroupDialogOpen = () => {
    setGroupDialogOpen(true);
    handleClose();
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = getRequestTags(request.request.url);
    const hasTag = currentTags.some((t) => t.id === tagId);

    if (hasTag) {
      removeTagFromRequest(request.request.url, tagId);
    } else {
      addTagToRequest(request.request.url, tagId);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    const currentGroups = getRequestGroups(request.request.url);
    const inGroup = currentGroups.some((g) => g.id === groupId);

    if (inGroup) {
      removeRequestFromGroup(groupId, request.request.url);
    } else {
      addRequestToGroup(groupId, request.request.url);
    }
  };

  const currentTags = getRequestTags(request.request.url);
  const currentGroups = getRequestGroups(request.request.url);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {currentTags.map((tag) => (
          <Chip
            key={tag.id}
            size="small"
            label={tag.name}
            style={{ backgroundColor: tag.color }}
          />
        ))}
        <IconButton size="small" onClick={handleClick}>
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleTagDialogOpen}>
          <ListItemIcon>
            <LabelIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Tags</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleGroupDialogOpen}>
          <ListItemIcon>
            <FolderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Groups</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)}>
        <DialogTitle>Manage Tags</DialogTitle>
        <DialogContent>
          <List>
            {state.tags.map((tag) => (
              <ListItem key={tag.id} dense button onClick={() => handleTagToggle(tag.id)}>
                <Checkbox
                  edge="start"
                  checked={currentTags.some((t) => t.id === tag.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemIcon>
                  <LabelIcon style={{ color: tag.color }} />
                </ListItemIcon>
                <ListItemText primary={tag.name} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)}>
        <DialogTitle>Manage Groups</DialogTitle>
        <DialogContent>
          <List>
            {state.groups.map((group) => (
              <ListItem key={group.id} dense button onClick={() => handleGroupToggle(group.id)}>
                <Checkbox
                  edge="start"
                  checked={currentGroups.some((g) => g.id === group.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={group.name}
                  secondary={group.description} 
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
