import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import {
  Bluetooth as BluetoothIcon,
  BluetoothSearching as SearchingIcon,
  BluetoothConnected as ConnectedIcon,
  DirectionsCar as CarIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import useOBD2Store from '../store/useOBD2Store';
import useSettingsStore from '../store/useSettingsStore';
import OBD2BluetoothService from '../services/obd2BluetoothService';
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
  type VehicleInput,
} from '../services/vehicleService';

const emptyVehicle: VehicleInput = { make: '', model: '', year: new Date().getFullYear(), vin: '', nickname: '' };

const Settings: React.FC = () => {
  const { connectionStatus, connect, disconnect, activeVehicleId, setActiveVehicleId } = useOBD2Store();
  const settings = useSettingsStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(true);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleInput>(emptyVehicle);

  useEffect(() => {
    setBrowserSupport(OBD2BluetoothService.isSupported());
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await listVehicles();
      setVehicles(data);
      if (data.length > 0 && !activeVehicleId) {
        setActiveVehicleId(data[0].id);
      }
    } catch {
      toast.error('Failed to load vehicles');
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
      toast.success('Connected to OBD2 device');
    } catch {
      toast.error('Failed to connect to OBD2 device');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Disconnected from OBD2 device');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const openAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm(emptyVehicle);
    setVehicleDialogOpen(true);
  };

  const openEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleForm({ make: v.make, model: v.model, year: v.year, vin: v.vin || '', nickname: v.nickname || '' });
    setVehicleDialogOpen(true);
  };

  const handleSaveVehicle = async () => {
    try {
      if (editingVehicle) {
        const updated = await updateVehicle(editingVehicle.id, vehicleForm);
        setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        toast.success('Vehicle updated');
      } else {
        const created = await createVehicle(vehicleForm);
        setVehicles((prev) => [...prev, created]);
        if (!activeVehicleId) setActiveVehicleId(created.id);
        toast.success('Vehicle added');
      }
      setVehicleDialogOpen(false);
    } catch {
      toast.error('Failed to save vehicle');
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    try {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      if (activeVehicleId === id) {
        setActiveVehicleId(vehicles.find((v) => v.id !== id)?.id || null);
      }
      toast.success('Vehicle removed');
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      {!browserSupport && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>Web Bluetooth API is not supported in this browser.</Typography>
          <Typography variant="body2">
            Please use Google Chrome, Microsoft Edge, or another Chromium-based browser on desktop or Android.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* OBD2 Connection */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>OBD2 Connection</Typography>
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
                      <Typography variant="body2" color="error">Error: {connectionStatus.error}</Typography>
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
              <Button fullWidth variant="outlined" color="error" onClick={handleDisconnect}>
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

        {/* Vehicle Management */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Vehicles</Typography>
              <Button startIcon={<AddIcon />} size="small" onClick={openAddVehicle}>Add</Button>
            </Box>

            {vehicles.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No vehicles added yet.
              </Typography>
            ) : (
              <List disablePadding>
                {vehicles.map((v, i) => (
                  <React.Fragment key={v.id}>
                    {i > 0 && <Divider />}
                    <ListItem
                      sx={{
                        bgcolor: activeVehicleId === v.id ? 'action.selected' : 'transparent',
                        borderRadius: 1,
                        cursor: 'pointer',
                      }}
                      onClick={() => setActiveVehicleId(v.id)}
                    >
                      <CarIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <ListItemText
                        primary={v.nickname || `${v.year} ${v.make} ${v.model}`}
                        secondary={v.nickname ? `${v.year} ${v.make} ${v.model}` : v.vin || undefined}
                      />
                      <ListItemSecondaryAction>
                        <IconButton size="small" onClick={() => openEditVehicle(v)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteVehicle(v.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* App Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Application Settings</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Auto-connect on startup" secondary="Automatically connect to the last used OBD2 device" />
                <ListItemSecondaryAction>
                  <Switch edge="end" checked={settings.autoConnect} onChange={(_, v) => settings.setAutoConnect(v)} />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="High-frequency logging" secondary="Enable logging intervals below 100ms (may impact performance)" />
                <ListItemSecondaryAction>
                  <Switch edge="end" checked={settings.highFrequencyLogging} onChange={(_, v) => settings.setHighFrequencyLogging(v)} />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Extended PIDs" secondary="Enable manufacturer-specific PIDs (VW Group)" />
                <ListItemSecondaryAction>
                  <Switch edge="end" checked={settings.extendedPids} onChange={(_, v) => settings.setExtendedPids(v)} />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Imperial units" secondary="Use MPH, \u00B0F, PSI instead of metric units" />
                <ListItemSecondaryAction>
                  <Switch edge="end" checked={settings.imperialUnits} onChange={(_, v) => settings.setImperialUnits(v)} />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Advanced Features */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">Advanced Features</Typography>
              <Chip label="Beta" size="small" color="warning" />
            </Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Advanced features like ECU flashing and coding are experimental and may void your warranty. Use at your own risk.
              </Typography>
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="outlined" startIcon={<WarningIcon />} disabled={!connectionStatus.isConnected}>
                  Read ECU Data
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button fullWidth variant="outlined" color="warning" startIcon={<WarningIcon />} disabled={!connectionStatus.isConnected}>
                  Enable Hidden Features
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Vehicle Add/Edit Dialog */}
      <Dialog open={vehicleDialogOpen} onClose={() => setVehicleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Make" value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} required fullWidth />
            <TextField label="Model" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} required fullWidth />
            <TextField label="Year" type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) || 0 })} required fullWidth />
            <TextField label="VIN" value={vehicleForm.vin || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })} fullWidth />
            <TextField label="Nickname" value={vehicleForm.nickname || ''} onChange={(e) => setVehicleForm({ ...vehicleForm, nickname: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVehicleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVehicle} disabled={!vehicleForm.make || !vehicleForm.model}>
            {editingVehicle ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
