import React, { useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import { CopyButton } from './CopyButton';

interface JsonViewerProps {
  data: any;
  expanded?: boolean;
  showCopy?: boolean;
  maxHeight?: string | number;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ 
  data, 
  expanded = true,
  showCopy = true,
  maxHeight = '400px'
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const theme = useTheme();
  
  const jsonString = JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2
  );

  const formatJson = (json: string) => {
    return json
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
        (match) => {
          let cls = 'json-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'json-key';
            } else {
              cls = 'json-string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return `<span class="${cls}">${match}</span>`;
        }
      );
  };

  const styles = {
    container: {
      position: 'relative' as const,
      backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
      borderRadius: '4px',
      border: `1px solid ${theme.palette.divider}`,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
      fontSize: '12px',
      lineHeight: '1.5',
      overflow: 'auto',
      maxHeight: isExpanded ? maxHeight : '60px',
      transition: 'max-height 0.3s ease',
    },
    pre: {
      margin: 0,
      padding: '12px',
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-all' as const,
    },
    controls: {
      position: 'absolute' as const,
      top: '4px',
      right: '4px',
      display: 'flex',
      gap: '4px',
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
      borderRadius: '4px',
      padding: '2px',
    }
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.controls}>
        {showCopy && (
          <CopyButton text={jsonString} tooltip="Copy JSON" />
        )}
        <Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      <pre 
        style={styles.pre}
        dangerouslySetInnerHTML={{ __html: formatJson(jsonString) }}
      />
      <style>{`
        .json-key { color: ${theme.palette.mode === 'dark' ? '#9CDCFE' : '#0451a5'}; }
        .json-string { color: ${theme.palette.mode === 'dark' ? '#CE9178' : '#a31515'}; }
        .json-number { color: ${theme.palette.mode === 'dark' ? '#B5CEA8' : '#098658'}; }
        .json-boolean { color: ${theme.palette.mode === 'dark' ? '#569CD6' : '#0000ff'}; }
        .json-null { color: ${theme.palette.mode === 'dark' ? '#569CD6' : '#0000ff'}; }
      `}</style>
    </Box>
  );
};
