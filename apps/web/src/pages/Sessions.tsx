import React, { useState } from 'react';
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
import LiveChart from '../components/LiveChart';

const Sessions: React.FC = () => {
  const { sessions, exportSession } = useOBD2Store();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleExport = (sessionId: string) => {
    exportSession(sessionId);
    toast.success('Session exported successfully');
  };

  const handleView = (sessionId: string) => {
    setSelectedSession(sessionId);
    setViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedSession(null);
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    if (!endTime) return '--';
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const selectedSessionData = sessions.find(s => s.id === selectedSession);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Logging Sessions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded
        </Typography>
      </Box>

      {sessions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No logging sessions yet. Start a new session from the Data Logging page.
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
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {format(session.startTime, 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {formatDuration(session.startTime, session.endTime)}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {session.parameters.slice(0, 3).map(pid => {
                        const param = ALL_PARAMETERS[pid];
                        return (
                          <Chip
                            key={pid}
                            label={param?.name || pid}
                            size="small"
                          />
                        );
                      })}
                      {session.parameters.length > 3 && (
                        <Chip
                          label={`+${session.parameters.length - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{session.readings.length}</TableCell>
                  <TableCell>
                    {session.isActive ? (
                      <Chip label="Active" color="success" size="small" />
                    ) : (
                      <Chip label="Completed" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleView(session.id)}
                      title="View details"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleExport(session.id)}
                      title="Export as CSV"
                      disabled={session.isActive}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Session Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        {selectedSessionData && (
          <>
            <DialogTitle>
              Session Details - {format(selectedSessionData.startTime, 'MMM d, yyyy HH:mm:ss')}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body1">
                      {formatDuration(selectedSessionData.startTime, selectedSessionData.endTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Data Points
                    </Typography>
                    <Typography variant="body1">
                      {selectedSessionData.readings.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Parameters Logged
                    </Typography>
                    <Typography variant="body1">
                      {selectedSessionData.parameters.length}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="h6" gutterBottom>
                Logged Parameters
              </Typography>
              <Grid container spacing={2}>
                {selectedSessionData.parameters.map(pid => {
                  const param = ALL_PARAMETERS[pid];
                  if (!param) return null;

                  const paramReadings = selectedSessionData.readings.filter(
                    r => r.parameter === param.name
                  );

                  return (
                    <Grid item xs={12} md={6} key={pid}>
                      <LiveChart
                        title={param.name}
                        unit={param.unit}
                        data={paramReadings}
                        color="#2196f3"
                      />
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
                  handleExport(selectedSessionData.id);
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
