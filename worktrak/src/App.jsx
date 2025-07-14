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
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import WeeklyChart from './components/WeeklyChart';
import Auth from './components/Auth';

const API_URL = import.meta.env.VITE_API_URL;

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
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Helper to get JWT
  const getToken = () => localStorage.getItem('jwt');

  // Helper to check if token is expired
  const isTokenExpired = () => {
    const token = getToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // Helper to handle API calls with error handling
  const apiCall = async (url, options = {}) => {
    const token = getToken();
    
    if (isTokenExpired()) {
      handleLogout();
      throw new Error('Session expired. Please log in again.');
    }

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      handleLogout();
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  };

  useEffect(() => {
    if (user) fetchLogs();
    // eslint-disable-next-line
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/logs');
      setLogs(data.logs || []);
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const log = {
      title: title.trim(),
      category,
      minutes: parseInt(minutes),
      date: date.toISOString().split('T')[0]
    };

    try {
      await apiCall('/log', {
        method: 'POST',
        body: JSON.stringify(log)
      });

      setSuccessMessage('Activity logged successfully!');
      await fetchLogs(); // Refresh logs after successful submission
      
      // Reset form
      setTitle('');
      setCategory('');
      setMinutes('');
      setDate(new Date());
      setError(null);
    } catch (error) {
      setError(error.message);
      console.error('Error sending log:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    setUser(null);
    setLogs([]);
    setError(null);
    setSuccessMessage('');
  };

  const handleCloseError = () => setError(null);
  const handleCloseSuccess = () => setSuccessMessage('');

  if (!user) {
    return <Auth onAuth={setUser} />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h3" component="h1" gutterBottom>
            WorkTrak Logger
          </Typography>
          <Box>
            <Typography variant="subtitle1" sx={{ mr: 2, display: 'inline' }}>
              Welcome, {user?.username}!
            </Typography>
            <Button variant="outlined" color="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={handleCloseError}>
            {error}
          </Alert>
        )}

        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={handleCloseSuccess}
          message={successMessage}
        />

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
                  inputProps={{ maxLength: 200 }}
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
                  inputProps={{ min: 1, max: 1440 }}
                  helperText="Enter minutes (1-1440)"
                />

                <DatePicker
                  label="Date"
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                  sx={{ width: '100%', mt: 2 }}
                  maxDate={new Date()}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 3 }}
                  disabled={loading || !title.trim() || !category || !minutes}
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
                Past Activities ({logs.length})
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : logs.length === 0 ? (
                  <Typography color="text.secondary">No logs yet. Start by logging your first activity!</Typography>
                ) : (
                  logs
                    .filter(log => filterCategory === 'All' || log.category === filterCategory)
                    .map((log, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 1 }}>
                        <Typography variant="subtitle1">{log.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {log.category} — {log.minutes} minutes
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(log.date).toLocaleDateString()}
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