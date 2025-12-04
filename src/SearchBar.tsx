import React, { useState, useEffect, useRef } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

interface SearchBarProps {
  onSearchChange: (searchTerm: string) => void
  resultCount?: number
  totalCount?: number
}

export function SearchBar({ onSearchChange, resultCount, totalCount }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearchChange(value)
  }

  const handleClear = () => {
    setSearchTerm('')
    onSearchChange('')
    setIsOpen(false)
  }

  if (!isOpen && !searchTerm) {
    return null
  }

  return (
    <Box
      sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <TextField
        ref={inputRef}
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by URL, capabilities, or status..."
        size="small"
        fullWidth
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {searchTerm && resultCount !== undefined && totalCount !== undefined && (
        <Chip
          label={`${resultCount} / ${totalCount}`}
          size="small"
          color={resultCount === 0 ? 'default' : 'primary'}
        />
      )}
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        Press Esc to close
      </Typography>
    </Box>
  )
}
