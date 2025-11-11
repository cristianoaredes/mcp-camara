/**
 * Configuration management for the MCP server
 * Loads settings from environment variables with sensible defaults
 */

export interface MCPServerConfig {
  name: string;
  version: string;
  transport: 'stdio' | 'http' | 'sse';
  httpPort: number;
  apiBaseUrl: string;
  cacheEnabled: boolean;
  cacheTTL: number;
  cacheMaxSize: number;
  rateLimitEnabled: boolean;
  rateLimitPerMinute: number;
  rateLimitAuthenticatedPerMinute: number;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  apiKey?: string;
}

/**
 * Configuration validation error
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validate transport type
 */
function validateTransport(transport: string): 'stdio' | 'http' | 'sse' {
  const validTransports = ['stdio', 'http', 'sse'];
  if (!validTransports.includes(transport)) {
    throw new ConfigurationError(
      `Invalid MCP_TRANSPORT: "${transport}". Must be one of: ${validTransports.join(', ')}`
    );
  }
  return transport as 'stdio' | 'http' | 'sse';
}

/**
 * Validate log level
 */
function validateLogLevel(level: string): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' {
  const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  if (!validLevels.includes(level)) {
    throw new ConfigurationError(
      `Invalid LOG_LEVEL: "${level}". Must be one of: ${validLevels.join(', ')}`
    );
  }
  return level as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

/**
 * Validate and parse integer environment variable
 */
function parseIntEnv(
  name: string,
  value: string | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new ConfigurationError(
      `Invalid ${name}: "${value}". Must be a valid integer.`
    );
  }

  if (min !== undefined && parsed < min) {
    throw new ConfigurationError(
      `Invalid ${name}: ${parsed}. Must be at least ${min}.`
    );
  }

  if (max !== undefined && parsed > max) {
    throw new ConfigurationError(
      `Invalid ${name}: ${parsed}. Must be at most ${max}.`
    );
  }

  return parsed;
}

/**
 * Validate URL format
 */
function validateUrl(url: string, name: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    throw new ConfigurationError(
      `Invalid ${name}: "${url}". Must be a valid URL.`
    );
  }
}

/**
 * Load configuration from environment variables with validation
 */
export function loadConfig(): MCPServerConfig {
  // Validate transport
  const transport = validateTransport(process.env.MCP_TRANSPORT || 'stdio');

  // Validate HTTP port
  const httpPort = parseIntEnv('MCP_HTTP_PORT', process.env.MCP_HTTP_PORT, 3000, 1, 65535);

  // Validate API base URL
  const apiBaseUrl = validateUrl(
    process.env.CAMARA_API_BASE_URL || 'https://dadosabertos.camara.leg.br/api/v2',
    'CAMARA_API_BASE_URL'
  );

  // Validate cache settings
  const cacheTTL = parseIntEnv('MCP_CACHE_TTL', process.env.MCP_CACHE_TTL, 3600, 0);
  const cacheMaxSize = parseIntEnv(
    'MCP_CACHE_MAX_SIZE',
    process.env.MCP_CACHE_MAX_SIZE,
    104857600, // 100MB
    0
  );

  // Validate rate limit settings
  const rateLimitPerMinute = parseIntEnv(
    'MCP_RATE_LIMIT',
    process.env.MCP_RATE_LIMIT,
    30,
    1
  );
  const rateLimitAuthenticatedPerMinute = parseIntEnv(
    'MCP_RATE_LIMIT_AUTH',
    process.env.MCP_RATE_LIMIT_AUTH,
    100,
    1
  );

  // Validate log level
  const logLevel = validateLogLevel(process.env.LOG_LEVEL || 'INFO');

  return {
    name: 'mcp-camara',
    version: '1.0.0',
    transport,
    httpPort,
    apiBaseUrl,
    cacheEnabled: process.env.MCP_DISABLE_CACHE !== 'true',
    cacheTTL,
    cacheMaxSize,
    rateLimitEnabled: process.env.MCP_DISABLE_RATE_LIMIT !== 'true',
    rateLimitPerMinute,
    rateLimitAuthenticatedPerMinute,
    logLevel,
    apiKey: process.env.MCP_API_KEY,
  };
}
