import React, { useState } from 'react';
import { ProofIntegrity, verifyProofIntegrity, getExpirationStatus } from './util';
import { isDelegation } from '@ucanto/core';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
  Collapse,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Verified as VerifiedIcon,
  BrokenImage as BrokenImageIcon
} from '@mui/icons-material';

interface ProofVerifierProps {
  delegation: any;
  title?: string;
}

function ProofChainItem({ proof, level = 0, index = 0 }: { proof: any; level?: number; index?: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const [showDetails, setShowDetails] = useState(false);
  
  const expirationStatus = getExpirationStatus(proof.expiration);
  const isExpired = expirationStatus.status === 'expired';
  const expiresSoon = expirationStatus.status === 'expires-soon';

  const getStatusIcon = () => {
    if (isExpired) {
      return <ErrorIcon sx={{ color: '#f44336', fontSize: 16 }} />;
    } else if (expiresSoon) {
      return <WarningIcon sx={{ color: '#ff9800', fontSize: 16 }} />;
    } else {
      return <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
    }
  };

  const getStatusColor = () => {
    if (isExpired) return '#f44336';
    if (expiresSoon) return '#ff9800';
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
                {proof.cid.toString().substring(0, 12)}...
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
              <Tooltip title={showDetails ? "Hide details" : "Show details"}>
                <IconButton
                  size="small"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </Tooltip>
              {proof.proofs && proof.proofs.length > 0 && (
                <IconButton
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ExpandMoreIcon /> : <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />}
                </IconButton>
              )}
            </Box>
          }
          sx={{ py: 1 }}
        />
        <CardContent sx={{ py: 1, pt: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                Issuer: {proof.issuer.did()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                Audience: {proof.audience.did()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption">
                Expires: {new Date(proof.expiration).toLocaleString()}
              </Typography>
            </Box>
            {proof.capabilities && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption">
                  Capabilities: {proof.capabilities.length}
                </Typography>
              </Box>
            )}
          </Box>

          {showDetails && (
            <Box sx={{ mt: 1 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Field</TableCell>
                      <TableCell>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>CID</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {proof.cid.toString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Issuer</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {proof.issuer.did()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Audience</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {proof.audience.did()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Expiration</TableCell>
                      <TableCell>{new Date(proof.expiration).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>
                        <Chip
                          label={expirationStatus.status}
                          size="small"
                          sx={{ 
                            backgroundColor: expirationStatus.color,
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {proof.proofs && proof.proofs.length > 0 && (
            <Collapse in={expanded}>
              <Box sx={{ mt: 1, pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
                  Proof Chain:
                </Typography>
                {proof.proofs.map((subProof: any, idx: number) => (
                  <ProofChainItem key={subProof.cid.toString()} proof={subProof} level={level + 1} index={idx} />
                ))}
              </Box>
            </Collapse>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function ProofIntegritySummary({ integrity }: { integrity: ProofIntegrity }) {
  const getIntegrityColor = () => {
    if (!integrity.isValid) return '#f44336';
    if (integrity.expiredLinks.length > 0) return '#ff9800';
    return '#4caf50';
  };

  const getIntegrityIcon = () => {
    if (!integrity.isValid) return <BrokenImageIcon />;
    if (integrity.expiredLinks.length > 0) return <WarningIcon />;
    return <VerifiedIcon />;
  };

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            {getIntegrityIcon()}
            <Typography variant="h6" sx={{ color: getIntegrityColor(), mt: 1 }}>
              {integrity.isValid ? 'Valid' : 'Invalid'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Chain Integrity
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <LinkIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{integrity.chainLength}</Typography>
            <Typography variant="caption" color="text.secondary">
              Chain Length
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <ErrorIcon sx={{ fontSize: 32, color: '#f44336', mb: 1 }} />
            <Typography variant="h6">{integrity.brokenLinks.length}</Typography>
            <Typography variant="caption" color="text.secondary">
              Broken Links
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <ScheduleIcon sx={{ fontSize: 32, color: '#ff9800', mb: 1 }} />
            <Typography variant="h6">{integrity.expiredLinks.length}</Typography>
            <Typography variant="caption" color="text.secondary">
              Expired Links
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default function ProofVerifier({ delegation, title = "Proof Verification" }: ProofVerifierProps) {
  const [integrity, setIntegrity] = useState<ProofIntegrity | null>(null);
  const [expanded, setExpanded] = useState(true);

  React.useEffect(() => {
    if (delegation && isDelegation(delegation)) {
      const proofIntegrity = verifyProofIntegrity(delegation);
      setIntegrity(proofIntegrity);
    }
  }, [delegation]);

  if (!integrity) {
    return (
      <Alert severity="info">
        <AlertTitle>No Proof Chain</AlertTitle>
        This request does not contain a proof chain to verify.
      </Alert>
    );
  }

  const hasIssues = !integrity.isValid || integrity.brokenLinks.length > 0 || integrity.expiredLinks.length > 0;

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
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandMoreIcon /> : <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />}
        </IconButton>
      </Box>

      <ProofIntegritySummary integrity={integrity} />

      {hasIssues && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Proof Chain Issues</AlertTitle>
          {integrity.brokenLinks.length > 0 && (
            <Typography variant="body2">
              {integrity.brokenLinks.length} broken link(s) found in the proof chain.
            </Typography>
          )}
          {integrity.expiredLinks.length > 0 && (
            <Typography variant="body2">
              {integrity.expiredLinks.length} expired link(s) found in the proof chain.
            </Typography>
          )}
        </Alert>
      )}

      {integrity.brokenLinks.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Broken Links</AlertTitle>
          <List dense>
            {integrity.brokenLinks.map((link, idx) => (
              <ListItem key={idx} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <BrokenImageIcon sx={{ fontSize: 16, color: '#f44336' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={link}
                  primaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {integrity.expiredLinks.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Expired Links</AlertTitle>
          <List dense>
            {integrity.expiredLinks.map((link, idx) => (
              <ListItem key={idx} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={link}
                  primaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      <Collapse in={expanded}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
          Proof Chain Visualization:
        </Typography>
        <ProofChainItem proof={delegation} level={0} index={0} />
      </Collapse>
    </Box>
  );
}
