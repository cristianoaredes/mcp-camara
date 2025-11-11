/**
 * Custom error types for the MCP server
 */

export class CamaraAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'CamaraAPIError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CacheError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'CacheError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}
