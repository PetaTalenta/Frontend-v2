// Environment-guarded logger
// Reduces noisy console.* in production while preserving debug in development

type LogArgs = any[];

const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';

function logWithPrefix(prefix: string, ...args: LogArgs) {
  if (isProd) return; // no-op in production
  // eslint-disable-next-line no-console
  console.log(prefix, ...args);
}

export const logger = {
  debug: (...args: LogArgs) => logWithPrefix('[DEBUG]', ...args),
  info: (...args: LogArgs) => logWithPrefix('[INFO ]', ...args),
  warn: (...args: LogArgs) => {
    if (isProd) return;
    // eslint-disable-next-line no-console
    console.warn('[WARN ]', ...args);
  },
  error: (...args: LogArgs) => {
    // Allow errors in all envs but keep compact
    // eslint-disable-next-line no-console
    console.error('[ERROR]', ...args);
  }
};

