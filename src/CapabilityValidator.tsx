import React, { useState, ReactNode } from 'react';
import { Capability } from '@ucanto/interface';
import { CapabilityValidation, validateCapability } from './util';
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
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

interface CapabilityValidatorProps {
  capabilities: Capability[];
  title?: string;
}

function CapabilityItem({ capability, index }: { capability: Capability; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const validation = validateCapability(capability);

  const getStatusIcon = () => {
    if (!validation.isValid) {
      return <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />;
    } else if (validation.warnings.length > 0) {
      return <WarningIcon sx={{ color: '#ff9800', fontSize: 20 }} />;
    } else {
      return <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />;
    }
  };

  const getStatusColor = () => {
    if (!validation.isValid) return '#f44336';
    if (validation.warnings.length > 0) return '#ff9800';
    return '#4caf50';
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 1,
        borderLeft: `4px solid ${getStatusColor()}`,
        backgroundColor: validation.isValid ? 'background.paper' : 'error.light'
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon()}
            <Typography variant="subtitle1" sx={{ fontFamily: 'monospace' }}>
              {capability.can || 'Unknown Capability'}
            </Typography>
            <Chip 
              label={`#${index + 1}`} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={showDetails ? "Hide details" : "Show details"}>
              <IconButton
                size="small"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandMoreIcon /> : <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />}
            </IconButton>
          </Box>
        }
        sx={{ py: 1 }}
      />
      
      <CardContent sx={{ py: 1, pt: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                With:
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {capability.with}
              </Typography>
            </Box>
            
            {capability.nb && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  NB:
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  {JSON.stringify(capability.nb).substring(0, 50)}...
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={validation.isValid ? 'Valid' : 'Invalid'}
                size="small"
                color={validation.isValid ? 'success' : 'error'}
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
              {validation.errors.length > 0 && (
                <Chip
                  label={`${validation.errors.length} errors`}
                  size="small"
                  color="error"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
              {validation.warnings.length > 0 && (
                <Chip
                  label={`${validation.warnings.length} warnings`}
                  size="small"
                  color="warning"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          </>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {validation.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                <AlertTitle>Validation Errors</AlertTitle>
                <List dense>
                  {validation.errors.map((error, idx) => (
                    <ListItem key={idx} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <ErrorIcon sx={{ fontSize: 16, color: '#f44336' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={error}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {validation.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                <AlertTitle>Warnings</AlertTitle>
                <List dense>
                  {validation.warnings.map((warning, idx) => (
                    <ListItem key={idx} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={warning}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {showDetails && (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Field</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <>
                      <TableRow>
                        <TableCell>Can</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{capability.can}</TableCell>
                        <TableCell>{typeof capability.can}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>With</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{capability.with}</TableCell>
                        <TableCell>{typeof capability.with}</TableCell>
                      </TableRow>
                      {capability.nb && (
                        <TableRow>
                          <TableCell>NB</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            <pre style={{ margin: 0, fontSize: '0.7rem' }}>
                              {JSON.stringify(capability.nb, null, 2)}
                            </pre>
                          </TableCell>
                          <TableCell>{typeof capability.nb}</TableCell>
                        </TableRow>
                      )}
                    </>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

function CapabilitySummary({ capabilities }: { capabilities: Capability[] }) {
  const validations = capabilities.map(validateCapability);
  const validCount = validations.filter(v => v.isValid).length;
  const invalidCount = validations.filter(v => !v.isValid).length;
  const warningCount = validations.filter(v => v.warnings.length > 0).length;
  const totalErrors = validations.reduce((sum, v) => sum + v.errors.length, 0);
  const totalWarnings = validations.reduce((sum, v) => sum + v.warnings.length, 0);

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      <Chip
        icon={<SecurityIcon />}
        label={`${capabilities.length} capabilities`}
        variant="outlined"
        size="small"
      />
      <Chip
        icon={<CheckCircleIcon />}
        label={`${validCount} valid`}
        color="success"
        size="small"
      />
      {invalidCount > 0 && (
        <Chip
          icon={<ErrorIcon />}
          label={`${invalidCount} invalid`}
          color="error"
          size="small"
        />
      )}
      {warningCount > 0 && (
        <Chip
          icon={<WarningIcon />}
          label={`${warningCount} warnings`}
          color="warning"
          size="small"
        />
      )}
      {totalErrors > 0 && (
        <Chip
          label={`${totalErrors} total errors`}
          color="error"
          variant="outlined"
          size="small"
        />
      )}
      {totalWarnings > 0 && (
        <Chip
          label={`${totalWarnings} total warnings`}
          color="warning"
          variant="outlined"
          size="small"
        />
      )}
    </Box>
  );
}

export default function CapabilityValidator({ capabilities, title = "Capability Validation" }: CapabilityValidatorProps) {
  const [showAll, setShowAll] = useState(false);

  if (!capabilities || capabilities.length === 0) {
    return (
      <Alert severity="info">
        <AlertTitle>No Capabilities</AlertTitle>
        This request does not contain any capabilities to validate.
      </Alert>
    );
  }

  const validations = capabilities.map(validateCapability);
  const hasIssues = validations.some(v => !v.isValid || v.warnings.length > 0);
  const invalidCapabilities = capabilities.filter((_, idx) => !validations[idx].isValid);
  const warningCapabilities = capabilities.filter((_, idx) => validations[idx].warnings.length > 0);

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

      <CapabilitySummary capabilities={capabilities} />

      {hasIssues && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Validation Issues Found</AlertTitle>
          {invalidCapabilities.length > 0 && (
            <Typography variant="body2">
              {invalidCapabilities.length} capability(ies) have validation errors.
            </Typography>
          )}
          {warningCapabilities.length > 0 && (
            <Typography variant="body2">
              {warningCapabilities.length} capability(ies) have warnings.
            </Typography>
          )}
        </Alert>
      )}

      {capabilities.map((capability, index) => (
        <CapabilityItem key={index} capability={capability} index={index} />
      ))}
    </Box>
  );
}
