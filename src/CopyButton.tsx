import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface CopyButtonProps {
  text: string;
  tooltip?: string;
  size?: 'small' | 'medium' | 'large';
}

export const CopyButton: React.FC<CopyButtonProps> = ({ 
  text, 
  tooltip = 'Copy to clipboard',
  size = 'small' 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          console.error('Copy command failed');
        }
      } catch (err) {
        console.error('Failed to copy using execCommand:', err);
      } finally {
        document.body.removeChild(textArea);
      }
      
    } catch (err) {
      console.error('Failed to copy:', err);
      
      if (typeof chrome !== 'undefined' && chrome.devtools) {
        try {
          const input = document.createElement('input');
          input.value = text;
          input.style.position = 'absolute';
          input.style.left = '-9999px';
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (chromeErr) {
          console.error('Chrome DevTools copy failed:', chromeErr);
        }
      }
    }
  };

  return (
    <Tooltip title={copied ? 'Copied!' : tooltip}>
      <IconButton
        onClick={handleCopy}
        size={size}
        color={copied ? 'success' : 'default'}
        sx={{ ml: 1 }}
      >
        {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};
