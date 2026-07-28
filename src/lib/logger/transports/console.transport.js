import winston from 'winston';

const { combine, timestamp, colorize, printf, errors } = winston.format;

/**
 * Color map for severity levels.
 * Winston's colorize() applies these via chalk under the hood.
 */
const LEVEL_COLORS = {
  error:    'red',
  warn:     'yellow',
  info:     'green',
  http:     'magenta',
  verbose:  'cyan',
  debug:    'blue',
  silly:    'grey',
};

winston.addColors(LEVEL_COLORS);

/**
 * Dev console format:
 *
 * [14:32:01] INFO  AUTH/USER_LOGIN  │  User logged in  {actorId: "u_123"}
 */
const devFormat = printf(({ level, message, timestamp, category, eventType, metadata, requestId, actorId }) => {
  let time = '';
  if (timestamp) {
    const tsStr = typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString();
    time = tsStr.slice(11, 19);
  } else {
    time = new Date().toISOString().slice(11, 19);
  }
  const cat     = category  ? `${category}/` : '';
  const evtType = eventType ? `${eventType}` : '';
  const actor   = actorId   ? ` [actor:${actorId}]`  : '';
  const reqId   = requestId ? ` [req:${requestId?.slice(0, 8)}]` : '';
  const meta    = metadata  ? `\n   └─ ${JSON.stringify(metadata, null, 2).replace(/\n/g, '\n      ')}` : '';

  return `[${time}] ${level.padEnd(8)} ${(cat + evtType).padEnd(30)} │  ${message}${actor}${reqId}${meta}`;
});

export const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize({ all: true }),
    timestamp(),
    errors({ stack: true }),
    devFormat,
  ),
});
