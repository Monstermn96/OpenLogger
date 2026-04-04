import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import useOBD2Store from '../store/useOBD2Store';
import { ALL_PARAMETERS } from '../constants/obd2Parameters';
import {
  listSessions,
  getSession,
  deleteSession,
  exportSessionCsv,
  type SessionDetail,
} from '../services/sessionService';
import LiveChart from '../components/LiveChart';

const Sessions: React.FC = () => {
  const { sessions, setSessions } = useOBD2Store();
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<SessionDetail | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (sessionId: number) => {
    try {
      await exportSessionCsv(sessionId);
      toast.success('Session exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleView = async (sessionId: number) => {
    try {
      const detail = await getSession(sessionId);
      setSelectedSessionDetail(detail);
      setViewDialogOpen(true);
    } catch {
      toast.error('Failed to load session details');
    }
  };

  const handleDelete = async (sessionId: number) => {
    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedSessionDetail(null);
  };

  const formatDuration = (startTime: string, endTime?: string | null) => {
    if (!endTime) return '--';
    const diff = new Date(endTime).getTime() - new Date(startTime).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Logging Sessions</Typography>
        <Typography variant="body1" color="text.secondary">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded
        </Typography>
      </Box>

      {sessions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {loading ? 'Loading sessions...' : 'No logging sessions yet. Start a new session from the Data Logging page.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date & Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Parameters</TableCell>
                <TableCell>Data Points</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {format(new Date(session.start_time), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {formatDuration(session.start_time, session.end_time)}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {(session.parameters || []).slice(0, 3).map((pid) => {
                        const param = ALL_PARAMETERS[pid];
                        return (
                          <Chip key={pid} label={param?.name || pid} size="small" />
                        );
                      })}
                      {(session.parameters || []).length > 3 && (
                        <Chip
                          label={`+${(session.parameters || []).length - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{session.log_count}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleView(session.id)} title="View details">
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleExport(session.id)} title="Export as CSV">
                      <DownloadIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(session.id)} title="Delete" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={viewDialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        {selectedSessionDetail && (
          <>
            <DialogTitle>
              Session Details - {format(new Date(selectedSessionDetail.start_time), 'MMM d, yyyy HH:mm:ss')}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                    <Typography variant="body1">
                      {formatDuration(selectedSessionDetail.start_time, selectedSessionDetail.end_time)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Data Points</Typography>
                    <Typography variant="body1">{selectedSessionDetail.logs.length}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Parameters Logged</Typography>
                    <Typography variant="body1">{(selectedSessionDetail.parameters || []).length}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="h6" gutterBottom>Logged Parameters</Typography>
              <Grid container spacing={2}>
                {(selectedSessionDetail.parameters || []).map((pid) => {
                  const param = ALL_PARAMETERS[pid];
                  if (!param) return null;

                  const paramReadings = selectedSessionDetail.logs
                    .filter((l) => l.data[param.name.toLowerCase().replace(/ /g, '')] !== undefined)
                    .map((l) => ({
                      parameter: param.name,
                      value: Object.values(l.data)[0] || 0,
                      unit: param.unit,
                      timestamp: new Date(l.timestamp),
                    }));

                  return (
                    <Grid item xs={12} md={6} key={pid}>
                      <LiveChart title={param.name} unit={param.unit} data={paramReadings} color="#2196f3" />
                    </Grid>
                  );
                })}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button
                variant="contained"
                startIcon={<ExportIcon />}
                onClick={() => {
                  handleExport(selectedSessionDetail.id);
                  handleCloseDialog();
                }}
              >
                Export Session
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Sessions;
