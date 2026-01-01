type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levelOrder: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const configuredLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel) {
  return levelOrder[level] <= levelOrder[configuredLevel];
}

function formatMessage(level: LogLevel, message: string) {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  error: (message: string, error?: unknown) => {
    if (!shouldLog('error')) return;
    console.error(formatMessage('error', message), error ?? '');
  },
  warn: (message: string, data?: unknown) => {
    if (!shouldLog('warn')) return;
    console.warn(formatMessage('warn', message), data ?? '');
  },
  info: (message: string, data?: unknown) => {
    if (!shouldLog('info')) return;
    console.log(formatMessage('info', message), data ?? '');
  },
  debug: (message: string, data?: unknown) => {
    if (!shouldLog('debug')) return;
    console.debug(formatMessage('debug', message), data ?? '');
  }
};
