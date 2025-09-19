# OpenLogger - OBD2 Data Logger & Diagnostics

A web-based application for reading car diagnostic data via Bluetooth OBD2 dongles, performing data logging, and potentially enabling advanced features like ECU flashing and hidden feature activation.

## Features

- 🚗 **Real-time OBD2 Data Reading**: Connect to any ELM327-compatible Bluetooth OBD2 dongle
- 📊 **Live Data Visualization**: Real-time gauges and charts for monitoring vehicle parameters
- 📝 **Data Logging**: Record and export diagnostic data sessions
- 🎯 **VW Golf R Optimized**: Special support for 2013+ VW Golf R specific parameters
- 📱 **Web-based**: No app installation required, works in modern browsers
- ☁️ **Cloud Storage**: Powered by AWS Amplify for secure data storage and user authentication

## Supported Parameters

### Standard OBD2 Parameters
- Engine RPM
- Vehicle Speed
- Coolant Temperature
- Intake Air Temperature
- Throttle Position
- Engine Load
- Timing Advance
- MAF Air Flow Rate
- Fuel Level
- And many more...

### VW Specific Parameters
- Boost Pressure (Actual/Requested)
- Turbo RPM
- Exhaust Gas Temperature
- Wastegate Position

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Material-UI (MUI)
- **State Management**: Zustand
- **Backend**: AWS Amplify Gen2
- **Database**: AWS DynamoDB (via Amplify Data)
- **Authentication**: AWS Cognito
- **Storage**: AWS S3

## Prerequisites

- Node.js 18+ and npm
- AWS Account
- AWS Amplify CLI
- Compatible web browser (Chrome, Edge, or Chromium-based)
- ELM327 Bluetooth OBD2 adapter

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure AWS Amplify**:
   ```bash
   npm run amplify configure
   ```

3. **Deploy backend**:
   ```bash
   npm run amplify push
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## AWS Amplify Deployment

For monorepo deployment in AWS Amplify Console:

1. Repository: `Monstermn96/OpenLogger`
2. Branch: `Main`
3. Check "My app is a monorepo"
4. Monorepo root directory: `OpenLogger`

The app will automatically build and deploy using the `amplify.yml` configuration.

## Browser Compatibility

Web Bluetooth API is required and supported in:
- ✅ Google Chrome (Desktop & Android)
- ✅ Microsoft Edge
- ✅ Opera
- ❌ Firefox (not supported)
- ❌ Safari/iOS (not supported)

## Usage

1. **Connect OBD2 Adapter**: Plug your Bluetooth OBD2 adapter into your vehicle's OBD2 port
2. **Turn on Ignition**: Vehicle ignition must be ON (engine can be running or not)
3. **Open App**: Navigate to the app in a supported browser
4. **Connect Device**: Go to Settings and click "Connect to OBD2 Device"
5. **Select Parameters**: Choose which parameters to log in the Data Logging section
6. **Start Logging**: Begin recording data and monitor in real-time
7. **Export Data**: Download logged sessions as CSV files for analysis

## Safety Notice

⚠️ **WARNING**: Advanced features like ECU modifications can void your warranty and potentially damage your vehicle. Use at your own risk. Always ensure your vehicle is in a safe location when using diagnostic tools.

## License

MIT License - See LICENSE file for details

## Contributing

Pull requests are welcome! Please ensure all code follows the existing style and includes appropriate tests.
