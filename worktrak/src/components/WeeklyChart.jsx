import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { format, startOfWeek, endOfWeek, subWeeks, eachWeekOfInterval } from 'date-fns';

const WeeklyChart = ({ logs, selectedCategory }) => {
  // Get the current date and calculate the start of the current week
  const today = new Date();
  const currentWeekStart = startOfWeek(today);
  
  // Get the start of 8 weeks ago
  const eightWeeksAgo = subWeeks(currentWeekStart, 8);
  
  // Create array of week start dates for the last 8 weeks
  const weeks = eachWeekOfInterval({
    start: eightWeeksAgo,
    end: currentWeekStart
  });

  // Prepare data for the chart
  const chartData = weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart);
    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date.split(' ')[0]); // Handle date format from backend
      return (
        logDate >= weekStart &&
        logDate <= weekEnd &&
        (selectedCategory === 'All' || log.category === selectedCategory)
      );
    });

    const totalMinutes = weekLogs.reduce((sum, log) => {
      const minutes = parseInt(log.minutes);
      return sum + (isNaN(minutes) ? 0 : minutes);
    }, 0);

    return {
      week: format(weekStart, 'MMM d'),
      minutes: totalMinutes
    };
  });

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Weekly Activity: {selectedCategory}
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="week" 
              label={{ value: 'Week Starting', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => [`${value} minutes`, 'Time Spent']}
              labelFormatter={(label) => `Week of ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorMinutes)"
              name="Minutes Spent"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default WeeklyChart; 