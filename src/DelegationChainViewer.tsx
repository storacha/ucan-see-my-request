import React, { useState } from 'react';
import { DelegationNode, buildDelegationTree, getExpirationStatus } from './util';
import { isDelegation } from '@ucanto/core';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Key as KeyIcon
} from '@mui/icons-material';

interface DelegationChainViewerProps {
  delegation: any;
  title?: string;
}

function DelegationNodeItem({ node, level = 0 }: { node: DelegationNode; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const expirationStatus = getExpirationStatus(node.expiration);

  const getStatusIcon = () => {
    if (node.isExpired) {
      return <ErrorIcon sx={{ color: '#f44336', fontSize: 16 }} />;
    } else if (node.expiresSoon) {
      return <WarningIcon sx={{ color: '#ff9800', fontSize: 16 }} />;
    } else {
      return <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
    }
  };

  const getStatusColor = () => {
    if (node.isExpired) return '#f44336';
    if (node.expiresSoon) return '#ff9800';
    return '#4caf50';
  };

  return (
    <Box sx={{ ml: level * 2 }}>
      <Card 
        variant="outlined" 
        sx={{ 
          mb: 1,
          borderLeft: `4px solid ${getStatusColor()}`,
          backgroundColor: level % 2 === 0 ? 'background.paper' : 'action.hover'
        }}
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon()}
              <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {node.cid.substring(0, 12)}...
              </Typography>
              <Chip 
                label={`Level ${level}`} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={expirationStatus.message}
                size="small"
                sx={{ 
                  backgroundColor: expirationStatus.color,
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20
                }}
              />
              {node.proofs.length > 0 && (
                <IconButton
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                </IconButton>
              )}
            </Box>
          }
          sx={{ py: 1 }}
        />
        <CardContent sx={{ py: 1, pt: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                Issuer: {node.issuer}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                Audience: {node.audience}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption">
                Capabilities: {node.capabilities.length}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption">
                Proofs: {node.proofs.length}
              </Typography>
            </Box>
          </Box>

          {node.capabilities.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Capabilities:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {node.capabilities.slice(0, 3).map((cap, idx) => (
                  <Chip
                    key={idx}
                    label={cap.can}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 18 }}
                  />
                ))}
                {node.capabilities.length > 3 && (
                  <Chip
                    label={`+${node.capabilities.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 18 }}
                  />
                )}
              </Box>
            </Box>
          )}

          {node.proofs.length > 0 && (
            <Collapse in={expanded}>
              <Box sx={{ mt: 1, pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                  Proof Chain:
                </Typography>
                {node.proofs.map((proof, idx) => (
                  <DelegationNodeItem key={proof.cid} node={proof} level={level + 1} />
                ))}
              </Box>
            </Collapse>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function DelegationChainStats({ rootNode }: { rootNode: DelegationNode }) {
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiresSoonCount, setExpiresSoonCount] = useState(0);
  const [totalNodes, setTotalNodes] = useState(0);
  const [maxDepth, setMaxDepth] = useState(0);

  React.useEffect(() => {
    function traverse(node: DelegationNode, depth: number = 0) {
      setTotalNodes(prev => prev + 1);
      setMaxDepth(prev => Math.max(prev, depth));
      
      if (node.isExpired) {
        setExpiredCount(prev => prev + 1);
      } else if (node.expiresSoon) {
        setExpiresSoonCount(prev => prev + 1);
      }

      node.proofs.forEach(proof => traverse(proof, depth + 1));
    }

    setExpiredCount(0);
    setExpiresSoonCount(0);
    setTotalNodes(0);
    setMaxDepth(0);
    traverse(rootNode);
  }, [rootNode]);

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      <Chip
        icon={<SecurityIcon />}
        label={`${totalNodes} nodes`}
        variant="outlined"
        size="small"
      />
      <Chip
        icon={<ScheduleIcon />}
        label={`Depth: ${maxDepth}`}
        variant="outlined"
        size="small"
      />
      {expiredCount > 0 && (
        <Chip
          icon={<ErrorIcon />}
          label={`${expiredCount} expired`}
          color="error"
          size="small"
        />
      )}
      {expiresSoonCount > 0 && (
        <Chip
          icon={<WarningIcon />}
          label={`${expiresSoonCount} expires soon`}
          color="warning"
          size="small"
        />
      )}
    </Box>
  );
}

export default function DelegationChainViewer({ delegation, title = "Delegation Chain" }: DelegationChainViewerProps) {
  const [rootNode, setRootNode] = useState<DelegationNode | null>(null);

  React.useEffect(() => {
    if (delegation && isDelegation(delegation)) {
      const tree = buildDelegationTree(delegation);
      setRootNode(tree);
    }
  }, [delegation]);

  if (!rootNode) {
    return (
      <Alert severity="info">
        <AlertTitle>No Delegation Chain</AlertTitle>
        This request does not contain a delegation chain.
      </Alert>
    );
  }

  const hasIssues = rootNode.isExpired || rootNode.expiresSoon || 
    (() => {
      function hasExpiredInChain(node: DelegationNode): boolean {
        if (node.isExpired || node.expiresSoon) return true;
        return node.proofs.some(proof => hasExpiredInChain(proof));
      }
      return hasExpiredInChain(rootNode);
    })();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SecurityIcon />
        <Typography variant="h6">{title}</Typography>
        {hasIssues && (
          <Chip
            icon={<WarningIcon />}
            label="Issues detected"
            color="warning"
            size="small"
          />
        )}
      </Box>

      <DelegationChainStats rootNode={rootNode} />

      <DelegationNodeItem node={rootNode} level={0} />
    </Box>
  );
}
