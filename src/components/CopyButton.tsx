import IconButton from '@mui/material/IconButton'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

export default function CopyButton({ value, ariaLabel, size = 'small' }: { value: string, ariaLabel?: string, size?: 'small' | 'medium' | 'large' }) {
  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }

  const handleCopy = async () => {
    if (!value) return
    const isDevtools = typeof chrome !== 'undefined' && (chrome as any).devtools
    if (isDevtools) {
      fallbackCopy(value)
      return
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(value)
        return
      }
    } catch {
      // ignore and use fallback
    }
    fallbackCopy(value)
  }

  return (
    <IconButton size={size} aria-label={ariaLabel ?? 'Copy'} onClick={handleCopy} disabled={!value}>
      <ContentCopyIcon fontSize="inherit" />
    </IconButton>
  )
}


