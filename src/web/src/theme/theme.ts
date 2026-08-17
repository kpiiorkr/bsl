import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46a5', dark: '#373075' },
    secondary: { main: '#e06b45' },
    background: { default: '#f7f5ff', paper: '#ffffff' },
    text: { primary: '#232036', secondary: '#666278' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily:
      '"Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif',
    h2: {
      fontSize: 'clamp(2rem, 7vw, 3.75rem)',
      fontWeight: 900,
      letterSpacing: '-0.055em',
      lineHeight: 1.08,
    },
    h5: { fontWeight: 850 },
    button: { fontWeight: 800 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(79, 70, 165, 0.10)',
          boxShadow: '0 18px 50px rgba(48, 42, 90, 0.08)',
        },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
})
