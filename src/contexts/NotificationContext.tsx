'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface NotificationOptions {
  message: string;
  severity?: AlertColor;
  duration?: number;
}

interface NotificationContextValue {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
}

const DEFAULT_DURATION = 5000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<NotificationOptions>({
    message: '',
    severity: 'success',
    duration: DEFAULT_DURATION,
  });

  const show = useCallback((opts: NotificationOptions) => {
    setOptions({
      duration: DEFAULT_DURATION,
      ...opts,
    });
    setOpen(true);
  }, []);

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      show({ message, severity: 'success', duration });
    },
    [show]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      show({ message, severity: 'error', duration: duration ?? 6000 });
    },
    [show]
  );

  const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  }, []);

  return (
    <NotificationContext.Provider value={{ showSuccess, showError }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={options.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 16, sm: 24 } }}
      >
        <Alert
          onClose={handleClose}
          severity={options.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {options.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}
