import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Label as LabelIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useGrouping } from '../contexts/GroupingContext';
import { Tag, RequestGroup, Collection } from '../types/grouping';
import { ChromePicker } from 'react-color';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface TagDialogProps {
  open: boolean;
  onClose: () => void;
  tag?: Tag;
  mode: 'add' | 'edit';
}

function TagDialog({ open, onClose, tag, mode }: TagDialogProps) {
  const { addTag, updateTag } = useGrouping();
  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || '#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSubmit = () => {
    if (mode === 'add') {
      addTag({ name, color });
    } else if (tag) {
      updateTag({ ...tag, name, color });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{mode === 'add' ? 'Add New Tag' : 'Edit Tag'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Tag Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <Box>
            <Button
              variant="outlined"
              onClick={() => setShowColorPicker(!showColorPicker)}
              style={{ backgroundColor: color }}
            >
              Select Color
            </Button>
            {showColorPicker && (
              <Box sx={{ position: 'absolute', zIndex: 2 }}>
                <ChromePicker
                  color={color}
                  onChange={(color) => setColor(color.hex)}
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!name}>
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface GroupDialogProps {
  open: boolean;
  onClose: () => void;
  group?: RequestGroup;
  mode: 'add' | 'edit';
}

function GroupDialog({ open, onClose, group, mode }: GroupDialogProps) {
  const { addGroup, updateGroup } = useGrouping();
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');

  const handleSubmit = () => {
    if (mode === 'add') {
      addGroup({ name, description, requests: [] });
    } else if (group) {
      updateGroup({ ...group, name, description });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{mode === 'add' ? 'Add New Group' : 'Edit Group'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!name}>
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface CollectionDialogProps {
  open: boolean;
  onClose: () => void;
  collection?: Collection;
  mode: 'add' | 'edit';
}

function CollectionDialog({ open, onClose, collection, mode }: CollectionDialogProps) {
  const { addCollection, updateCollection } = useGrouping();
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');

  const handleSubmit = () => {
    if (mode === 'add') {
      addCollection({ name, description, groups: [] });
    } else if (collection) {
      updateCollection({ ...collection, name, description });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {mode === 'add' ? 'Add New Collection' : 'Edit Collection'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Collection Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!name}>
          {mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function GroupManager() {
  const { state, removeTag, removeGroup, removeCollection } = useGrouping();
  const [tabValue, setTabValue] = useState(0);
  const [tagDialog, setTagDialog] = useState<{ open: boolean; tag?: Tag; mode: 'add' | 'edit' }>({
    open: false,
    mode: 'add',
  });
  const [groupDialog, setGroupDialog] = useState<{
    open: boolean;
    group?: RequestGroup;
    mode: 'add' | 'edit';
  }>({ open: false, mode: 'add' });
  const [collectionDialog, setCollectionDialog] = useState<{
    open: boolean;
    collection?: Collection;
    mode: 'add' | 'edit';
  }>({ open: false, mode: 'add' });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Tags" />
          <Tab label="Groups" />
          <Tab label="Collections" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setTagDialog({ open: true, mode: 'add' })}
          >
            Add Tag
          </Button>
        </Box>
        <List>
          {state.tags.map((tag) => (
            <ListItem key={tag.id}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LabelIcon sx={{ color: tag.color }} />
                    {tag.name}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() =>
                    setTagDialog({ open: true, tag, mode: 'edit' })
                  }
                >
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => removeTag(tag.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setGroupDialog({ open: true, mode: 'add' })}
          >
            Add Group
          </Button>
        </Box>
        <List>
          {state.groups.map((group) => (
            <ListItem key={group.id}>
              <ListItemText
                primary={group.name}
                secondary={
                  <>
                    {group.description}
                    <Typography variant="caption" display="block">
                      {group.requests.length} requests
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() =>
                    setGroupDialog({ open: true, group, mode: 'edit' })
                  }
                >
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" onClick={() => removeGroup(group.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCollectionDialog({ open: true, mode: 'add' })}
          >
            Add Collection
          </Button>
        </Box>
        <List>
          {state.collections.map((collection) => (
            <ListItem key={collection.id}>
              <ListItemText
                primary={collection.name}
                secondary={
                  <>
                    {collection.description}
                    <Typography variant="caption" display="block">
                      {collection.groups.length} groups
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() =>
                    setCollectionDialog({
                      open: true,
                      collection,
                      mode: 'edit',
                    })
                  }
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => removeCollection(collection.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <TagDialog
        open={tagDialog.open}
        onClose={() => setTagDialog({ open: false, mode: 'add' })}
        tag={tagDialog.tag}
        mode={tagDialog.mode}
      />

      <GroupDialog
        open={groupDialog.open}
        onClose={() => setGroupDialog({ open: false, mode: 'add' })}
        group={groupDialog.group}
        mode={groupDialog.mode}
      />

      <CollectionDialog
        open={collectionDialog.open}
        onClose={() => setCollectionDialog({ open: false, mode: 'add' })}
        collection={collectionDialog.collection}
        mode={collectionDialog.mode}
      />
    </Paper>
  );
}
