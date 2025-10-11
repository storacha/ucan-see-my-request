import { useMemo } from 'react'
import { Request } from './types'
import {
  calculatePerformanceMetrics,
  analyzeErrors,
  detectRequestPatterns,
  createTimeline,
  formatBytes
} from './analytics'
import { formatTiming, getStatusColor } from './util'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SpeedIcon from '@mui/icons-material/Speed'
import ErrorIcon from '@mui/icons-material/Error'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import StorageIcon from '@mui/icons-material/Storage'
import WarningIcon from '@mui/icons-material/Warning'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

interface RequestAnalyticsProps {
  requests: Request[]
  onRequestSelect?: (request: Request) => void
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string
  value: string | number
  icon: React.ReactNode
  color?: string 
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: color || 'primary.main', mr: 1, display: 'flex' }}>
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

function RequestAnalytics({ requests, onRequestSelect }: RequestAnalyticsProps) {
  const performanceMetrics = useMemo(
    () => calculatePerformanceMetrics(requests),
    [requests]
  )
  
  const errorAnalysis = useMemo(
    () => analyzeErrors(requests),
    [requests]
  )
  
  const patterns = useMemo(
    () => detectRequestPatterns(requests),
    [requests]
  )
  
  const timeline = useMemo(
    () => createTimeline(requests),
    [requests]
  )

  if (requests.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No requests to analyze yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Make some UCAN requests to see analytics
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Performance Metrics
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Requests"
            value={performanceMetrics.totalRequests}
            icon={<SpeedIcon />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Success Rate"
            value={`${Math.round((performanceMetrics.successCount / performanceMetrics.totalRequests) * 100)}%`}
            icon={<CheckCircleIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Response Time"
            value={formatTiming(performanceMetrics.averageResponseTime)}
            icon={<SpeedIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Data Transferred"
            value={formatBytes(performanceMetrics.totalDataTransferred)}
            icon={<StorageIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardHeader title="Status Breakdown" />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`Success: ${performanceMetrics.successCount}`}
              color="success"
              sx={{ fontSize: '0.9rem', py: 2 }}
            />
            <Chip
              icon={<ErrorIcon />}
              label={`Errors: ${performanceMetrics.errorCount}`}
              color="error"
              sx={{ fontSize: '0.9rem', py: 2 }}
            />
            <Chip
              icon={<WarningIcon />}
              label={`Pending: ${performanceMetrics.pendingCount}`}
              color="warning"
              sx={{ fontSize: '0.9rem', py: 2 }}
            />
          </Box>
        </CardContent>
      </Card>

      {performanceMetrics.fastestRequest && performanceMetrics.slowestRequest && (
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Response Time Analysis" />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Fastest Request
                  </Typography>
                  <Typography variant="body2" noWrap sx={{ mb: 1 }}>
                    {performanceMetrics.fastestRequest.url}
                  </Typography>
                  <Typography variant="h6">
                    {formatTiming(performanceMetrics.fastestRequest.timing)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Slowest Request
                  </Typography>
                  <Typography variant="body2" noWrap sx={{ mb: 1 }}>
                    {performanceMetrics.slowestRequest.url}
                  </Typography>
                  <Typography variant="h6">
                    {formatTiming(performanceMetrics.slowestRequest.timing)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {errorAnalysis.totalErrors > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Error Analysis" 
            subheader={`${errorAnalysis.totalErrors} total errors detected`}
          />
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                HTTP Errors: {errorAnalysis.httpErrors} | UCAN Errors: {errorAnalysis.ucanErrors}
              </Typography>
            </Box>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Error Details ({errorAnalysis.errorDetails.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>URL</TableCell>
                        <TableCell>Message</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {errorAnalysis.errorDetails.map((error, idx) => (
                        <TableRow 
                          key={idx}
                          hover
                          onClick={() => onRequestSelect?.(error.request)}
                          sx={{ cursor: onRequestSelect ? 'pointer' : 'default' }}
                        >
                          <TableCell>
                            <Chip label={error.errorType} size="small" color="error" />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {error.request.request.url}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {error.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {patterns.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Request Patterns" 
            subheader={`${patterns.length} patterns detected`}
          />
          <CardContent>
            {patterns.map((pattern, idx) => {
              let severity: 'error' | 'warning' | 'info' | 'success' = 'info'
              let icon = <TrendingUpIcon />
              
              if (pattern.type === 'repeated-failures') {
                severity = 'error'
                icon = <ErrorIcon />
              } else if (pattern.type === 'slow-requests') {
                severity = 'warning'
                icon = <WarningIcon />
              } else if (pattern.type === 'burst') {
                severity = 'warning'
                icon = <SpeedIcon />
              }
              
              return (
                <Alert key={idx} severity={severity} icon={icon} sx={{ mb: 2 }}>
                  <AlertTitle>{pattern.type.replace('-', ' ').toUpperCase()}</AlertTitle>
                  {pattern.description}
                </Alert>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader 
          title="Request Timeline" 
          subheader={`Showing ${timeline.length} requests in chronological order`}
        />
        <CardContent>
          <Timeline position="alternate">
            {timeline.map((event, idx) => (
              <TimelineItem key={idx}>
                <TimelineOppositeContent sx={{ color: 'text.secondary' }}>
                  <Typography variant="caption">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {formatTiming(event.duration)}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot sx={{ bgcolor: getStatusColor(event.status) }} />
                  {idx < timeline.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      p: 1.5,
                      cursor: onRequestSelect ? 'pointer' : 'default',
                      '&:hover': onRequestSelect ? { bgcolor: 'action.hover' } : {}
                    }}
                    onClick={() => onRequestSelect?.(event.request)}
                  >
                    <Typography variant="body2" noWrap sx={{ mb: 0.5 }}>
                      {event.url}
                    </Typography>
                    {event.capabilities.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {event.capabilities.map((cap, capIdx) => (
                          <Chip key={capIdx} label={cap} size="small" />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </CardContent>
      </Card>
    </Box>
  )
}

export default RequestAnalytics

