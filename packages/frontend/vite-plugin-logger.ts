import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Map log levels to colors
const levelColors: Record<string, string> = {
  log: colors.white,
  info: colors.cyan,
  warn: colors.yellow,
  error: colors.red,
  debug: colors.dim + colors.white,
};

// Format user agent for display
function formatUserAgent(ua: string): string {
  if (ua.includes('Android')) return '📱 Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return '📱 iOS';
  if (ua.includes('Chrome')) return '💻 Chrome';
  if (ua.includes('Firefox')) return '💻 Firefox';
  if (ua.includes('Safari')) return '💻 Safari';
  return '💻 Browser';
}

export function serverLogger(): Plugin {
  return {
    name: 'server-logger',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method === 'POST' && req.url === '/api/log') {
          handleLogRequest(req, res);
        } else {
          next();
        }
      });
    },
  };
}

async function handleLogRequest(req: IncomingMessage, res: ServerResponse) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const logData = JSON.parse(body);
      const { level, message, timestamp, userAgent } = logData;

      // Format the timestamp
      const time = new Date(timestamp).toLocaleTimeString();

      // Get color for the log level
      const levelColor = levelColors[level] || colors.white;

      // Format the device indicator
      const device = formatUserAgent(userAgent || '');

      // Build the formatted log message
      const formattedLog = [
        `${colors.dim}[${time}]${colors.reset}`,
        `${device}`,
        `${levelColor}${colors.bright}[${level.toUpperCase()}]${colors.reset}`,
        `${levelColor}${message}${colors.reset}`,
      ].join(' ');

      // Output to server console
      console.log(formattedLog);

      // Add separator for errors to make them more visible
      if (level === 'error') {
        console.log(`${colors.red}${'─'.repeat(80)}${colors.reset}`);
      }

      // Send success response
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Failed to parse log request:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid log data' }));
    }
  });

  req.on('error', (error) => {
    console.error('Error receiving log data:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error' }));
  });
}