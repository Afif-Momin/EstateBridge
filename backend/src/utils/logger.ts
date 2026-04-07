import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

// Custom format for structured logging with context
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, userId, requestId, ...meta }) => {
    const context: Record<string, any> = {
      timestamp,
      level,
      message,
    };

    // Add context fields if present
    if (userId) context.userId = userId;
    if (requestId) context.requestId = requestId;

    // Add any additional metadata
    if (Object.keys(meta).length > 0) {
      context.meta = meta;
    }

    return JSON.stringify(context);
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: structuredFormat,
  transports: [
    // Error log - only errors
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log - all levels
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, userId, requestId, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          
          // Add context information
          const contextParts: string[] = [];
          if (userId) contextParts.push(`userId=${userId}`);
          if (requestId) contextParts.push(`requestId=${requestId}`);
          
          if (contextParts.length > 0) {
            msg += ` [${contextParts.join(', ')}]`;
          }
          
          // Add metadata if present
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          
          return msg;
        })
      ),
    })
  );
}

// Helper function to log with context
export const logWithContext = (
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context?: { userId?: string; requestId?: string; [key: string]: any }
) => {
  logger.log(level, message, context);
};
