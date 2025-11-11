/**
 * HTTP client for communicating with the Câmara API
 * Implements retry logic, error handling, and connection pooling
 */

import { CamaraAPIError, RateLimitError } from '../shared/utils/errors.js';
import type { ApiResponse, QueryParams } from '../shared/types/index.js';

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  userAgent: string;
}

export class CamaraHttpClient {
  private config: HttpClientConfig;

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || 'https://dadosabertos.camara.leg.br/api/v2',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      userAgent: config.userAgent || 'mcp-camara/1.0.0',
    };
  }

  /**
   * Make a GET request with automatic retry and exponential backoff
   */
  async get<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint, params);
    return this.retryRequest(() => this.executeRequest<T>(url));
  }

  /**
   * Build full URL with properly encoded query parameters
   */
  buildURL(endpoint: string, params?: QueryParams): string {
    const url = new URL(endpoint, this.config.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Execute HTTP request with timeout
   */
  private async executeRequest<T>(url: string): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response, url);
      }

      const data = await response.json();
      
      return {
        data: data as T,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error, url);
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response, url: string): Promise<never> {
    const endpoint = new URL(url).pathname;

    // Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      throw new RateLimitError(
        `Rate limit exceeded. Please retry after ${retryAfter} seconds.`,
        retryAfter
      );
    }

    // Try to parse error message from response body
    let errorMessage = '';
    let errorDetails = '';
    try {
      const errorData = await response.json() as { 
        error?: string; 
        message?: string;
        details?: string;
      };
      errorMessage = errorData.error || errorData.message || '';
      errorDetails = errorData.details || '';
    } catch {
      // Ignore JSON parse errors, will use default messages
    }

    // Handle 4xx client errors with descriptive messages
    if (response.status >= 400 && response.status < 500) {
      const clientErrorMessages: Record<number, string> = {
        400: 'Bad Request: The request parameters are invalid or malformed',
        401: 'Unauthorized: Authentication is required to access this resource',
        403: 'Forbidden: You do not have permission to access this resource',
        404: 'Not Found: The requested resource does not exist',
        405: 'Method Not Allowed: The HTTP method is not supported for this endpoint',
        422: 'Unprocessable Entity: The request data is invalid',
      };

      const defaultMessage = clientErrorMessages[response.status] || 
        `Client Error (${response.status}): The request could not be processed`;
      
      const finalMessage = errorMessage || defaultMessage;
      const fullMessage = errorDetails ? `${finalMessage}. ${errorDetails}` : finalMessage;
      
      throw new CamaraAPIError(fullMessage, response.status, endpoint);
    }

    // Handle 5xx server errors with unavailability messages
    if (response.status >= 500) {
      const serverErrorMessages: Record<number, string> = {
        500: 'Internal Server Error: The Câmara API is experiencing technical difficulties',
        502: 'Bad Gateway: The Câmara API gateway is unavailable',
        503: 'Service Unavailable: The Câmara API is temporarily unavailable',
        504: 'Gateway Timeout: The Câmara API did not respond in time',
      };

      const defaultMessage = serverErrorMessages[response.status] || 
        `Server Error (${response.status}): The Câmara API is temporarily unavailable`;
      
      const finalMessage = errorMessage || defaultMessage;
      const fullMessage = `${finalMessage}. Please try again later.`;
      
      throw new CamaraAPIError(fullMessage, response.status, endpoint);
    }

    // Fallback for other status codes
    const fallbackMessage = errorMessage || `HTTP ${response.status}: ${response.statusText}`;
    throw new CamaraAPIError(fallbackMessage, response.status, endpoint);
  }

  /**
   * Handle network and other errors
   */
  private handleError(error: unknown, url: string): Error {
    const endpoint = new URL(url).pathname;

    // Pass through already-handled errors
    if (error instanceof CamaraAPIError || error instanceof RateLimitError) {
      return error;
    }

    if (error instanceof Error) {
      // Handle timeout errors
      if (error.name === 'AbortError') {
        return new CamaraAPIError(
          `Request timeout: The Câmara API did not respond within ${this.config.timeout / 1000} seconds`,
          408,
          endpoint,
          error
        );
      }

      // Handle network connectivity errors
      if (error.message.includes('fetch failed') || 
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ETIMEDOUT')) {
        return new CamaraAPIError(
          `Network error: Unable to connect to the Câmara API. Please check your internet connection.`,
          0,
          endpoint,
          error
        );
      }

      // Handle DNS resolution errors
      if (error.message.includes('getaddrinfo')) {
        return new CamaraAPIError(
          `Network error: Could not resolve the Câmara API hostname. Please check your DNS settings.`,
          0,
          endpoint,
          error
        );
      }

      // Generic network error
      return new CamaraAPIError(
        `Network error: ${error.message}`,
        0,
        endpoint,
        error
      );
    }

    // Unknown error type
    return new CamaraAPIError(
      'An unexpected error occurred while communicating with the Câmara API',
      0,
      endpoint,
      error
    );
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on client errors (4xx) or rate limit errors
      if (error instanceof CamaraAPIError && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }
      if (error instanceof RateLimitError) {
        throw error;
      }

      // Retry on network errors and server errors (5xx)
      if (attempt < this.config.retryAttempts - 1) {
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(fn, attempt + 1);
      }

      throw error;
    }
  }
}
