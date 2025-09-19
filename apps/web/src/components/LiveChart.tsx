import React, { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { OBD2Reading } from '../types/obd2.types';

interface LiveChartProps {
  title: string;
  unit: string;
  data: OBD2Reading[];
  color?: string;
  height?: number;
}

const LiveChart: React.FC<LiveChartProps> = ({
  title,
  unit,
  data,
  color = '#2196f3',
  height = 200,
}) => {
  // Prepare data for Recharts
  const chartData = useMemo(() => {
    // Get last 50 data points for performance
    const recentData = data.slice(-50);
    
    return recentData.map((reading) => ({
      time: reading.timestamp.getTime(),
      value: reading.value,
      formattedTime: format(reading.timestamp, 'HH:mm:ss'),
    }));
  }, [data]);

  const currentValue = data[data.length - 1]?.value;

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="h6" sx={{ color }}>
          {currentValue !== undefined ? currentValue.toFixed(1) : '--'} {unit}
        </Typography>
      </Box>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="formattedTime"
            stroke="#666"
            fontSize={12}
            interval="preserveEnd"
            minTickGap={50}
          />
          <YAxis
            stroke="#666"
            fontSize={12}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #333',
              borderRadius: 4,
            }}
            labelStyle={{ color: '#fff' }}
            formatter={(value: number) => [`${value.toFixed(1)} ${unit}`, title]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            animationDuration={0}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default LiveChart;
