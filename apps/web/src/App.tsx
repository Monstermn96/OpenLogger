import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Import pages
import Dashboard from './pages/Dashboard';
import DataLogging from './pages/DataLogging';
import Sessions from './pages/Sessions';
import Settings from './pages/Settings';
import Layout from './components/Layout';

// Import Amplify configuration
import amplifyconfig from './amplifyconfiguration.json';

// Configure Amplify
Amplify.configure(amplifyconfig);

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  useEffect(() => {
    // Check for Web Bluetooth API support
    if (!('bluetooth' in navigator)) {
      console.warn('Web Bluetooth API is not supported in this browser');
    }
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <Authenticator>
        {({ signOut, user }) => (
          <Router>
            <Layout user={user} signOut={signOut}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/logging" element={<DataLogging />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </Router>
        )}
      </Authenticator>
    </ThemeProvider>
  );
}

export default App;