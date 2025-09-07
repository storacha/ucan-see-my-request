import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import { RequestStatus } from './types';

export interface FilterState {
  urlSearch: string;
  capabilitySearch: string;
  status: RequestStatus | 'all';
  minTiming: number | '';
  maxTiming: number | '';
}

interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const handleTextChange = (field: keyof FilterState) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onFilterChange({
      ...filters,
      [field]: event.target.value
    });
  };

  const handleSelectChange = (
    event: SelectChangeEvent
  ) => {
    onFilterChange({
      ...filters,
      status: event.target.value as RequestStatus | 'all'
    });
  };

  const handleClearField = (field: keyof FilterState) => () => {
    onFilterChange({
      ...filters,
      [field]: field.includes('Timing') ? '' : field === 'status' ? 'all' : ''
    });
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Search URL"
          variant="outlined"
          size="small"
          fullWidth
          value={filters.urlSearch}
          onChange={handleTextChange('urlSearch')}
          InputProps={{
            endAdornment: filters.urlSearch && (
              <IconButton size="small" onClick={handleClearField('urlSearch')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            )
          }}
        />
        <TextField
          label="Search Capability"
          variant="outlined"
          size="small"
          fullWidth
          value={filters.capabilitySearch}
          onChange={handleTextChange('capabilitySearch')}
          InputProps={{
            endAdornment: filters.capabilitySearch && (
              <IconButton size="small" onClick={handleClearField('capabilitySearch')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            )
          }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={handleSelectChange}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="success">Success</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="Min RTT (ms)"
          variant="outlined"
          size="small"
          type="number"
          value={filters.minTiming}
          onChange={handleTextChange('minTiming')}
          InputProps={{
            endAdornment: filters.minTiming !== '' && (
              <IconButton size="small" onClick={handleClearField('minTiming')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            )
          }}
        />
        
        <TextField
          label="Max RTT (ms)"
          variant="outlined"
          size="small"
          type="number"
          value={filters.maxTiming}
          onChange={handleTextChange('maxTiming')}
          InputProps={{
            endAdornment: filters.maxTiming !== '' && (
              <IconButton size="small" onClick={handleClearField('maxTiming')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            )
          }}
        />
      </Box>

      {(filters.urlSearch || filters.capabilitySearch || filters.status !== 'all' || 
        filters.minTiming !== '' || filters.maxTiming !== '') && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Clear All Filters"
            onDelete={onClearFilters}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
};

export default SearchFilters;