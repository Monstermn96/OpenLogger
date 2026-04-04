# OpenLogger - OBD2 Data Logger & Diagnostics

A web-based application for reading car diagnostic data via Bluetooth OBD2 dongles, performing data logging, and managing vehicle profiles.

## Features

- **Real-time OBD2 Data Reading**: Connect to any ELM327-compatible Bluetooth OBD2 dongle
- **Live Data Visualization**: Real-time gauges and charts for monitoring vehicle parameters
- **Data Logging**: Record and export diagnostic data sessions (persisted to PostgreSQL)
- **Vehicle Management**: Add and manage multiple vehicle profiles
- **VW Golf R Optimized**: Special support for VW Group specific parameters
- **Web-based**: No app installation required, works in modern browsers
- **Self-hosted**: Runs on your own infrastructure via Docker

## Supported Parameters

### Standard OBD2 Parameters
- Engine RPM, Vehicle Speed, Coolant Temperature, Intake Air Temperature
- Throttle Position, Engine Load, Timing Advance, MAF Air Flow Rate
- Fuel Level, Barometric Pressure, Engine Oil Temperature, and more.

### VW Specific Parameters
- Boost Pressure (Actual/Requested)
- Turbo RPM
- Exhaust Gas Temperature
- Wastegate Position

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Material-UI
- **Backend**: Python FastAPI
- **Database**: PostgreSQL 17
- **Authentication**: Nexus (self-hosted identity service)
- **State Management**: Zustand
- **Deployment**: Docker Compose + Woodpecker CI

## Prerequisites

- Docker and Docker Compose
- Nexus auth service running (for user authentication)
- Compatible web browser (Chrome, Edge, or Chromium-based)
- ELM327 Bluetooth OBD2 adapter

## Setup

### 1. Register app in Nexus

Create an app registration in the Nexus admin panel and note the API key.

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set:
#   SECRET_KEY=<random-secret>
#   NEXUS_API_KEY=<your-nexus-api-key>
#   NEXUS_URL=http://host.docker.internal:3086
```

### 3. Start services

```bash
docker compose up -d --build
```

The app will be available at `http://localhost:3095`.

### 4. Development

For local frontend development:

```bash
npm install
npm run dev
```

The backend API is available separately. Start it with:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Deployment

Pushes to `master` auto-deploy via Woodpecker CI to the home lab server.

- **URL**: https://obd.bischetsrieder-labs.com
- **Port**: 3095
- **Container prefix**: openlogger

## Browser Compatibility

Web Bluetooth API is required:
- Google Chrome (Desktop & Android)
- Microsoft Edge
- Opera
- Firefox (not supported)
- Safari/iOS (not supported)

## Usage

1. **Connect OBD2 Adapter**: Plug your Bluetooth OBD2 adapter into your vehicle's OBD2 port
2. **Turn on Ignition**: Vehicle ignition must be ON
3. **Open App**: Navigate to the app in a supported browser
4. **Sign In**: Log in with your Nexus credentials (or register)
5. **Add Vehicle**: Go to Settings and add your vehicle profile
6. **Connect Device**: Click "Connect to OBD2 Device" in Settings
7. **Start Logging**: Go to Data Logging, select parameters, and start recording
8. **Export Data**: Download logged sessions as CSV from the Sessions page

## Safety Notice

**WARNING**: Advanced features like ECU modifications can void your warranty and potentially damage your vehicle. Use at your own risk.

## License

MIT License - See LICENSE file for details
