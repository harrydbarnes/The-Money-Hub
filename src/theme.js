import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6750A4', // A Material Design 3 primary color
    },
    secondary: {
      main: '#958DA5',
    },
    background: {
      default: '#FFFBFE',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1D1B20',
      secondary: '#49454F',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 400,
      letterSpacing: '0.15px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 400,
      letterSpacing: '0.15px',
    },
    // Add other typography settings as needed
  },
  shape: {
    borderRadius: 16, // More rounded corners for MD3
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFBFE',
          color: '#1D1B20',
        }
      }
    }
    // Add other component overrides as needed
  },
});

export default theme;
