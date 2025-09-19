import React from 'react';
import { Box, Typography } from '@mui/material';

interface Threshold {
  value: number;
  color: string;
}

interface GaugeChartProps {
  value: number;
  max: number;
  min?: number;
  unit: string;
  thresholds: Threshold[];
  size?: number;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max,
  min = 0,
  unit,
  thresholds,
  size = 200,
}) => {
  const range = max - min;
  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / range) * 100;
  const rotation = -90 + (percentage * 180) / 100;

  // Determine color based on thresholds
  let color = thresholds[0]?.color || '#4caf50';
  for (const threshold of thresholds) {
    if (normalizedValue >= threshold.value) {
      color = threshold.color;
    }
  }

  const strokeWidth = size / 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        margin: '0 auto',
      }}
    >
      {/* Background arc */}
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference / 2}
        />
      </svg>

      {/* Value arc */}
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - (circumference * percentage) / 200 + circumference / 2}
          strokeLinecap="round"
          style={{ transition: 'all 0.3s ease' }}
        />
      </svg>

      {/* Needle */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: radius * 1.6,
            height: 4,
            background: `linear-gradient(to right, transparent 0%, ${color} 50%, ${color} 100%)`,
            transformOrigin: `${radius * 0.8}px center`,
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease',
          }}
        />
      </Box>

      {/* Center circle */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: strokeWidth * 2,
          height: strokeWidth * 2,
          borderRadius: '50%',
          backgroundColor: 'background.paper',
          border: `3px solid ${color}`,
        }}
      />

      {/* Value display */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          mt: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {normalizedValue.toFixed(0)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {unit}
        </Typography>
      </Box>

      {/* Min/Max labels */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          color: 'text.secondary',
        }}
      >
        {min}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          color: 'text.secondary',
        }}
      >
        {max}
      </Typography>
    </Box>
  );
};

export default GaugeChart;
