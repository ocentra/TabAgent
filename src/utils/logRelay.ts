/**
 * Log Relay - Send extension logs to development log server
 * 
 * IMPORTANT: This works WITH your existing LOG flag system, not instead of it!
 * 
 * Usage Option 1: Wrap existing logs (preserves your flags)
 *   import { logToServer } from '@/utils/logRelay';
 *   if (LOG_MANIFEST_UPDATES) {
 *     console.log(prefix, 'message', data);
 *     logToServer('info', 'BackgroundModelManager', 'message', data);
 *   }
 * 
 * Usage Option 2: Intercept ALL console logs once at startup
 *   import { interceptConsole } from '@/utils/logRelay';
 *   interceptConsole(); // ALL console.log/warn/error now relay
 * 
 * Usage Option 3: Explicit dev logger
 *   import { devLog } from '@/utils/logRelay';
 *   devLog.info('BackgroundModelManager', 'Model loaded', { modelId: 'phi-3.5' });
 */

const LOG_SERVER_URL = 'http://localhost:3333/log';
const IS_DEV = true; // Set to false in production
const IS_RELAY_ENABLED = true; // Master switch for log relay

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogData {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: string;
  data?: any;
}

/**
 * Send log to development server (non-blocking)
 */
async function sendToLogServer(logData: LogData): Promise<void> {
  if (!IS_DEV || !IS_RELAY_ENABLED) return;
  
  try {
    await fetch(LOG_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    });
  } catch (error) {
    // Silently fail if log server is not running
    // Don't spam console with log server errors
  }
}

/**
 * Simple function to relay logs to server without changing console output
 * Use this alongside your existing if (LOG_FLAG) console.log() pattern
 * 
 * Example:
 *   if (LOG_MANIFEST_UPDATES) {
 *     console.log(prefix, 'Model loaded successfully');
 *     logToServer('info', 'BackgroundModelManager', 'Model loaded successfully');
 *   }
 */
export function logToServer(
  level: LogLevel,
  context: string,
  message: string,
  data?: any
): void {
  sendToLogServer({
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
  });
}

/**
 * Create a log entry and send to both console and log server
 */
function createLogger(level: LogLevel) {
  return (context: string, message: string, data?: any) => {
    const logData: LogData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    };
    
    // Always log to browser console
    const prefix = `[${context}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'debug':
        console.debug(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
    
    // Send to log server (async, non-blocking)
    sendToLogServer(logData);
  };
}

/**
 * Development logger with context
 */
export const devLog = {
  log: createLogger('log'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
  debug: createLogger('debug'),
};

/**
 * Wrap console methods to also send to log server
 * Call this once at extension startup
 */
export function interceptConsole(): void {
  if (!IS_DEV) return;
  
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  
  // Override console methods
  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    sendToLogServer({
      level: 'log',
      message: args.map(a => String(a)).join(' '),
      timestamp: new Date().toISOString(),
      context: 'console',
      data: args,
    });
  };
  
  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    sendToLogServer({
      level: 'info',
      message: args.map(a => String(a)).join(' '),
      timestamp: new Date().toISOString(),
      context: 'console',
      data: args,
    });
  };
  
  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    sendToLogServer({
      level: 'warn',
      message: args.map(a => String(a)).join(' '),
      timestamp: new Date().toISOString(),
      context: 'console',
      data: args,
    });
  };
  
  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    sendToLogServer({
      level: 'error',
      message: args.map(a => String(a)).join(' '),
      timestamp: new Date().toISOString(),
      context: 'console',
      data: args,
    });
  };
  
  console.debug = (...args: any[]) => {
    originalConsole.debug(...args);
    sendToLogServer({
      level: 'debug',
      message: args.map(a => String(a)).join(' '),
      timestamp: new Date().toISOString(),
      context: 'console',
      data: args,
    });
  };
}

