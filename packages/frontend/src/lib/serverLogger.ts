// Server-side logging utility for debugging NFC operations from mobile devices
// This sends all console logs to the dev server for visibility

const LOG_ENDPOINT = '/api/log';
const LOG_LEVELS = ['log', 'warn', 'error', 'info', 'debug'] as const;
type LogLevel = typeof LOG_LEVELS[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConsoleMethod = (...args: any[]) => void;

// Store original console methods
const originalConsole: Partial<Record<LogLevel, ConsoleMethod>> = {};

// Format log arguments for display
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatArgs(args: any[]): string {
  return args.map(arg => {
    if (typeof arg === 'object') {
      try {
        // Handle BigInt serialization
        return JSON.stringify(arg, (_, v) => typeof v === 'bigint' ? v.toString() + 'n' : v, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
}

// Send log to server
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendLogToServer(level: LogLevel, args: any[]) {
  try {
    const message = formatArgs(args);
    const timestamp = new Date().toISOString();

    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        timestamp,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // Silently fail if server is not available
    });
  } catch {
    // Silently fail to avoid infinite loops
  }
}

// Initialize server logging
export function initializeServerLogging() {
  // Only initialize in development
  if (import.meta.env.PROD) {
    return;
  }

  console.log('🔌 Server logging initialized - all console output will be sent to dev server');

  // Intercept console methods
  LOG_LEVELS.forEach(level => {
    originalConsole[level] = console[level];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (console as any)[level] = function(...args: any[]) {
      // Call original console method
      originalConsole[level]?.apply(console, args);

      // Send to server
      sendLogToServer(level, args);
    };
  });

  // Also catch uncaught errors
  window.addEventListener('error', (event) => {
    sendLogToServer('error', [
      'Uncaught Error:',
      event.message,
      `at ${event.filename}:${event.lineno}:${event.colno}`,
      event.error?.stack || ''
    ]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    sendLogToServer('error', [
      'Unhandled Promise Rejection:',
      event.reason
    ]);
  });
}

// Restore original console methods (useful for cleanup)
export function disableServerLogging() {
  LOG_LEVELS.forEach(level => {
    if (originalConsole[level]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (console as any)[level] = originalConsole[level];
    }
  });
}