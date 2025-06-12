import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import WeeklyChart from './components/WeeklyChart';

const categories = [
  'School',
  'Internship',
  'Projects',
  'Clubs',
  'Recruiting',
  'Other'
];

function App() {
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('');
  const [logs, setLogs] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/logs');
      const data = await response.json();
      setLogs(data.logs);
      setError(null);
    } catch (error) {
      setError('Failed to fetch logs. Please try again later.');
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const log = {
      title,
      category,
      minutes,
      date: date.toISOString().split('T')[0]
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(log)
      });

      const result = await response.json();
      console.log('Server says:', result.message);
      await fetchLogs(); // Refresh logs after successful submission
      
      // Reset form
      setTitle('');
      setCategory('');
      setMinutes('');
      setDate(new Date());
      setError(null);
    } catch (error) {
      setError('Failed to save log. Please try again.');
      console.error('Error sending log:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          WorkTrak Logger
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Log New Activity
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Activity Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  margin="normal"
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={category}
                    label="Category"
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Minutes"
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  required
                  margin="normal"
                  inputProps={{ min: 1 }}
                />

                <DatePicker
                  label="Date"
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                  sx={{ width: '100%', mt: 2 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 3 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Log Activity'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Filter by Category
              </Typography>
              <Box sx={{ mb: 2 }}>
                {['All', ...categories].map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    onClick={() => setFilterCategory(cat)}
                    color={filterCategory === cat ? 'primary' : 'default'}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>
                Past Activities
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : logs.length === 0 ? (
                  <Typography color="text.secondary">No logs yet.</Typography>
                ) : (
                  logs
                    .filter(log => filterCategory === 'All' || log.category === filterCategory)
                    .map((log, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 1 }}>
                        <Typography variant="subtitle1">{log.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {log.category} — {log.minutes}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.date}
                        </Typography>
                      </Paper>
                    ))
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <WeeklyChart logs={logs} selectedCategory={filterCategory} />
      </Container>
    </LocalizationProvider>
  );
}

export default App;