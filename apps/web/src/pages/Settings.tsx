import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material';
import {
  Bluetooth as BluetoothIcon,
  BluetoothSearching as SearchingIcon,
  BluetoothConnected as ConnectedIcon,
  DirectionsCar as CarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import useOBD2Store from '../store/useOBD2Store';
import OBD2BluetoothService from '../services/obd2BluetoothService';

const Settings: React.FC = () => {
  const { connectionStatus, connect, disconnect } = useOBD2Store();
  const [isConnecting, setIsConnecting] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(true);

  React.useEffect(() => {
    // Check browser support
    setBrowserSupport(OBD2BluetoothService.isSupported());
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
      toast.success('Connected to OBD2 device');
    } catch (error) {
      toast.error('Failed to connect to OBD2 device');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Disconnected from OBD2 device');
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Browser Support Alert */}
      {!browserSupport && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Web Bluetooth API is not supported in this browser.
          </Typography>
          <Typography variant="body2">
            Please use Google Chrome, Microsoft Edge, or another Chromium-based browser on desktop or Android.
            Web Bluetooth is not available on iOS devices.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* OBD2 Connection */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              OBD2 Connection
            </Typography>
            
            <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  {connectionStatus.isConnected ? (
                    <ConnectedIcon color="success" sx={{ fontSize: 40 }} />
                  ) : (
                    <BluetoothIcon color="disabled" sx={{ fontSize: 40 }} />
                  )}
                  <Box flex={1}>
                    <Typography variant="subtitle1">
                      {connectionStatus.isConnected ? 'Connected' : 'Not Connected'}
                    </Typography>
                    {connectionStatus.device && (
                      <Typography variant="body2" color="text.secondary">
                        Device: {connectionStatus.device.name || 'Unknown Device'}
                      </Typography>
                    )}
                    {connectionStatus.error && (
                      <Typography variant="body2" color="error">
                        Error: {connectionStatus.error}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {!connectionStatus.isConnected ? (
              <Button
                fullWidth
                variant="contained"
                startIcon={isConnecting ? <CircularProgress size={20} /> : <SearchingIcon />}
                onClick={handleConnect}
                disabled={isConnecting || !browserSupport}
              >
                {isConnecting ? 'Searching for devices...' : 'Connect to OBD2 Device'}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              Make sure your OBD2 Bluetooth adapter is:
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>Plugged into your vehicle's OBD2 port</li>
                <li>Powered on (vehicle ignition should be ON)</li>
                <li>In pairing mode if required</li>
              </ul>
            </Alert>
          </Paper>
        </Grid>

        {/* Vehicle Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vehicle Information
            </Typography>
            
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <CarIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="subtitle1">
                  2013 Volkswagen Golf R
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Primary vehicle profile
                </Typography>
              </Box>
            </Box>

            <List>
              <ListItem divider>
                <ListItemText primary="Make" secondary="Volkswagen" />
              </ListItem>
              <ListItem divider>
                <ListItemText primary="Model" secondary="Golf R" />
              </ListItem>
              <ListItem divider>
                <ListItemText primary="Year" secondary="2013" />
              </ListItem>
              <ListItem divider>
                <ListItemText primary="Engine" secondary="2.0L Turbocharged" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Protocol" secondary="CAN (ISO 15765-4)" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* App Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Application Settings
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Auto-connect on startup"
                  secondary="Automatically connect to the last used OBD2 device"
                />
                <ListItemSecondaryAction>
                  <Switch edge="end" />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="High-frequency logging"
                  secondary="Enable logging intervals below 100ms (may impact performance)"
                />
                <ListItemSecondaryAction>
                  <Switch edge="end" />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Extended PIDs"
                  secondary="Enable manufacturer-specific PIDs (VW Group)"
                />
                <ListItemSecondaryAction>
                  <Switch edge="end" defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Imperial units"
                  secondary="Use MPH, °F, PSI instead of metric units"
                />
                <ListItemSecondaryAction>
                  <Switch edge="end" />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Advanced Features */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">
                Advanced Features
              </Typography>
              <Chip label="Beta" size="small" color="warning" />
            </Box>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Advanced features like ECU flashing and coding are experimental and may void your warranty.
                Use at your own risk.
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<WarningIcon />}
                  disabled={!connectionStatus.isConnected}
                >
                  Read ECU Data
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningIcon />}
                  disabled={!connectionStatus.isConnected}
                >
                  Enable Hidden Features
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
