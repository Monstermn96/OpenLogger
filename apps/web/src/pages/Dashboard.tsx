import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Thermostat as ThermostatIcon,
  LocalGasStation as GasIcon,
  Air as AirIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useOBD2Store from '../store/useOBD2Store';
import GaugeChart from '../components/GaugeChart';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentData, connectionStatus, isLogging } = useOBD2Store();

  const renderMetricCard = (
    title: string,
    value: number | undefined,
    unit: string,
    icon: React.ReactNode,
    color: string,
    min: number,
    max: number
  ) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value !== undefined ? value.toFixed(1) : '--'}
          <Typography component="span" variant="body1" sx={{ ml: 1 }}>
            {unit}
          </Typography>
        </Typography>
        <LinearProgress
          variant="determinate"
          value={value !== undefined ? ((value - min) / (max - min)) * 100 : 0}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
            },
          }}
        />
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Connection Alert */}
      {!connectionStatus.isConnected && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/settings')}>
              Connect
            </Button>
          }
          sx={{ mb: 3 }}
        >
          No OBD2 device connected. Connect a device to start monitoring.
        </Alert>
      )}

      {/* Main Gauges */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Engine RPM
            </Typography>
            <GaugeChart
              value={currentData.rpm || 0}
              max={7000}
              unit="RPM"
              thresholds={[
                { value: 0, color: '#4caf50' },
                { value: 5000, color: '#ff9800' },
                { value: 6000, color: '#f44336' },
              ]}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Vehicle Speed
            </Typography>
            <GaugeChart
              value={currentData.speed || 0}
              max={200}
              unit="km/h"
              thresholds={[
                { value: 0, color: '#4caf50' },
                { value: 80, color: '#2196f3' },
                { value: 120, color: '#ff9800' },
                { value: 160, color: '#f44336' },
              ]}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Boost Pressure
            </Typography>
            <GaugeChart
              value={currentData.boostPressure || 0}
              max={30}
              min={-15}
              unit="PSI"
              thresholds={[
                { value: -15, color: '#f44336' },
                { value: 0, color: '#4caf50' },
                { value: 15, color: '#ff9800' },
                { value: 20, color: '#f44336' },
              ]}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Metric Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Coolant Temp',
            currentData.coolantTemp,
            '°C',
            <ThermostatIcon />,
            '#2196f3',
            -40,
            130
          )}
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Intake Temp',
            currentData.intakeTemp,
            '°C',
            <AirIcon />,
            '#4caf50',
            -40,
            100
          )}
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Engine Load',
            currentData.engineLoad,
            '%',
            <SpeedIcon />,
            '#ff9800',
            0,
            100
          )}
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Fuel Level',
            currentData.fuelLevel,
            '%',
            <GasIcon />,
            '#9c27b0',
            0,
            100
          )}
        </Grid>
      </Grid>

      {/* Status Section */}
      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1}>
              {connectionStatus.isConnected ? (
                <CheckIcon color="success" />
              ) : (
                <WarningIcon color="error" />
              )}
              <Typography>
                OBD2 Connection: {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1}>
              {isLogging ? (
                <CheckIcon color="success" />
              ) : (
                <WarningIcon color="disabled" />
              )}
              <Typography>
                Data Logging: {isLogging ? 'Active' : 'Inactive'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {connectionStatus.isConnected && !isLogging && (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/logging')}
          >
            Start Logging Session
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;
