import React, { useState } from 'react';
import { Capability } from '@ucanto/interface';
import { IssuerAudienceStats, analyzeIssuerAudience, formatTiming } from './util';
import { Request } from './types';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  AlertTitle,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

interface IssuerAudienceAnalyzerProps {
  requests: Request[];
  title?: string;
}

function IssuerAudienceItem({ stats, index }: { stats: IssuerAudienceStats; index: number }) {
  const [expanded, setExpanded] = useState(index < 3); // Auto-expand first 3 items
  const [showDetails, setShowDetails] = useState(false);

  const getActivityLevel = (count: number) => {
    if (count >= 10) return { level: 'High', color: '#4caf50' };
    if (count >= 5) return { level: 'Medium', color: '#ff9800' };
    return { level: 'Low', color: '#9e9e9e' };
  };

  const activityLevel = getActivityLevel(stats.requestCount);
  const lastSeenDate = new Date(stats.lastSeen);
  const timeSinceLastSeen = Date.now() - lastSeenDate.getTime();
  const hoursSinceLastSeen = timeSinceLastSeen / (1000 * 60 * 60);

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {stats.issuer}
            </Typography>
            <Chip 
              label={`#${index + 1}`} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              → {stats.audience}
            </Typography>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption">
                {stats.requestCount} requests
              </Typography>
            </Box>
            <Chip
              label={activityLevel.level}
              size="small"
              sx={{ 
                backgroundColor: activityLevel.color,
                color: 'white',
                fontSize: '0.7rem',
                height: 20
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SpeedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption">
                Avg: {formatTiming(stats.avgResponseTime)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption">
                Last: {hoursSinceLastSeen < 1 ? 'Just now' : 
                      hoursSinceLastSeen < 24 ? `${Math.floor(hoursSinceLastSeen)}h ago` :
                      `${Math.floor(hoursSinceLastSeen / 24)}d ago`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption">
              {stats.capabilities.length} unique capabilities
            </Typography>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
              Capabilities Used:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {stats.capabilities.map((capability, idx) => (
                <Chip
                  key={idx}
                  label={capability}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 18 }}
                />
              ))}
            </Box>

            {showDetails && (
              <Box sx={{ mt: 2 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell>Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Request Count</TableCell>
                        <TableCell>{stats.requestCount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Average Response Time</TableCell>
                        <TableCell>{formatTiming(stats.avgResponseTime)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Unique Capabilities</TableCell>
                        <TableCell>{stats.capabilities.length}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Last Seen</TableCell>
                        <TableCell>{lastSeenDate.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Issuer DID</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {stats.issuer}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Audience DID</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {stats.audience}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

function AnalysisSummary({ stats }: { stats: IssuerAudienceStats[] }) {
  const totalRequests = stats.reduce((sum, s) => sum + s.requestCount, 0);
  const uniqueIssuers = new Set(stats.map(s => s.issuer)).size;
  const uniqueAudiences = new Set(stats.map(s => s.audience)).size;
  const avgResponseTime = stats.reduce((sum, s) => sum + s.avgResponseTime, 0) / stats.length;
  const mostActivePair = stats.reduce((max, current) => 
    current.requestCount > max.requestCount ? current : max, stats[0] || { requestCount: 0 });

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <AnalyticsIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{totalRequests}</Typography>
            <Typography variant="caption" color="text.secondary">
              Total Requests
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <PersonIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{uniqueIssuers}</Typography>
            <Typography variant="caption" color="text.secondary">
              Unique Issuers
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <GroupIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{uniqueAudiences}</Typography>
            <Typography variant="caption" color="text.secondary">
              Unique Audiences
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <SpeedIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6">{formatTiming(avgResponseTime)}</Typography>
            <Typography variant="caption" color="text.secondary">
              Avg Response Time
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default function IssuerAudienceAnalyzer({ requests, title = "Issuer/Audience Analysis" }: IssuerAudienceAnalyzerProps) {
  const [stats, setStats] = useState<IssuerAudienceStats[]>([]);

  React.useEffect(() => {
    const analysis = analyzeIssuerAudience(requests);
    setStats(analysis);
  }, [requests]);

  if (!stats || stats.length === 0) {
    return (
      <Alert severity="info">
        <AlertTitle>No Analysis Data</AlertTitle>
        No UCAN requests found to analyze issuer/audience patterns.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AnalyticsIcon />
        <Typography variant="h6">{title}</Typography>
        <Chip
          label={`${stats.length} pairs`}
          size="small"
          variant="outlined"
        />
      </Box>

      <AnalysisSummary stats={stats} />

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
        Issuer/Audience Pairs (sorted by activity):
      </Typography>

      {stats.map((stat, index) => (
        <IssuerAudienceItem key={`${stat.issuer}-${stat.audience}`} stats={stat} index={index} />
      ))}
    </Box>
  );
}
