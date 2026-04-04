import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Timer as TimerIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { toast } from 'react-hot-toast';
import useOBD2Store from '../store/useOBD2Store';
import { ALL_PARAMETERS, PARAMETER_CATEGORIES, DEFAULT_LOGGING_PARAMETERS } from '../constants/obd2Parameters';
import LiveChart from '../components/LiveChart';

const DataLogging: React.FC = () => {
  const {
    connectionStatus,
    isLogging,
    selectedParameters,
    loggingInterval,
    currentSession,
    startLogging,
    stopLogging,
    setSelectedParameters,
    setLoggingInterval,
  } = useOBD2Store();

  const [expandedCategory, setExpandedCategory] = useState<string | false>(false);

  useEffect(() => {
    // Set default parameters if none selected
    if (selectedParameters.length === 0) {
      setSelectedParameters(DEFAULT_LOGGING_PARAMETERS);
    }
  }, []);

  const handleParameterToggle = (pid: string) => {
    if (selectedParameters.includes(pid)) {
      setSelectedParameters(selectedParameters.filter(p => p !== pid));
    } else {
      setSelectedParameters([...selectedParameters, pid]);
    }
  };

  const handleIntervalChange = (event: SelectChangeEvent<number>) => {
    setLoggingInterval(Number(event.target.value));
  };

  const handleStartLogging = async () => {
    if (selectedParameters.length === 0) {
      toast.error('Please select at least one parameter to log');
      return;
    }
    
    try {
      await startLogging();
      toast.success('Logging started');
    } catch (error) {
      toast.error('Failed to start logging');
    }
  };

  const handleStopLogging = () => {
    stopLogging();
    toast.success('Logging stopped');
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const diff = end.getTime() - startTime.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Data Logging
      </Typography>

      {!connectionStatus.isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Connect to an OBD2 device first to start logging data.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Logging Configuration
            </Typography>
            
            {/* Logging Interval */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Logging Interval</InputLabel>
              <Select
                value={loggingInterval}
                onChange={handleIntervalChange}
                disabled={isLogging}
              >
                <MenuItem value={50}>50ms (20Hz)</MenuItem>
                <MenuItem value={100}>100ms (10Hz)</MenuItem>
                <MenuItem value={200}>200ms (5Hz)</MenuItem>
                <MenuItem value={500}>500ms (2Hz)</MenuItem>
                <MenuItem value={1000}>1000ms (1Hz)</MenuItem>
              </Select>
            </FormControl>

            {/* Parameter Selection */}
            <Typography variant="subtitle1" gutterBottom>
              Parameters to Log ({selectedParameters.length} selected)
            </Typography>
            
            {Object.entries(PARAMETER_CATEGORIES).map(([category, pids]) => (
              <Accordion
                key={category}
                expanded={expandedCategory === category}
                onChange={(_, isExpanded) =>
                  setExpandedCategory(isExpanded ? category : false)
                }
                disabled={isLogging}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{category}</Typography>
                  <Chip
                    size="small"
                    label={`${pids.filter(pid => selectedParameters.includes(pid)).length}/${pids.length}`}
                    sx={{ ml: 1 }}
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {pids.map(pid => {
                      const param = ALL_PARAMETERS[pid];
                      if (!param) return null;
                      return (
                        <FormControlLabel
                          key={pid}
                          control={
                            <Checkbox
                              checked={selectedParameters.includes(pid)}
                              onChange={() => handleParameterToggle(pid)}
                              size="small"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{param.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {param.description}
                              </Typography>
                            </Box>
                          }
                        />
                      );
                    })}
                  </FormGroup>
                </AccordionDetails>
              </Accordion>
            ))}

            {/* Control Buttons */}
            <Box sx={{ mt: 3 }}>
              {!isLogging ? (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<PlayIcon />}
                  onClick={handleStartLogging}
                  disabled={!connectionStatus.isConnected || selectedParameters.length === 0}
                >
                  Start Logging
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleStopLogging}
                >
                  Stop Logging
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Live Data Display */}
        <Grid item xs={12} md={8}>
          {/* Session Info */}
          {currentSession && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TimerIcon color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Duration
                        </Typography>
                        <Typography variant="h6">
                          {formatDuration(currentSession.startTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StorageIcon color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Data Points
                        </Typography>
                        <Typography variant="h6">
                          {currentSession.readings.length}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        Recording
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Live Charts */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Live Data
            </Typography>
            
            {isLogging ? (
              <Grid container spacing={2}>
                {selectedParameters.map(pid => {
                  const param = ALL_PARAMETERS[pid];
                  if (!param) return null;
                  
                  return (
                    <Grid item xs={12} md={6} key={pid}>
                      <LiveChart
                        title={param.name}
                        unit={param.unit}
                        data={currentSession?.readings.filter(r => r.parameter === param.name) || []}
                        color="#2196f3"
                      />
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Start logging to see live data charts
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataLogging;
