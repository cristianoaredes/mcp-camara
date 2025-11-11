/**
 * Shared TypeScript types used across the application
 */

export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

export interface PaginationLinks {
  rel: 'self' | 'first' | 'last' | 'next' | 'previous';
  href: string;
}

export interface ApiResponse<T> {
  data: T;
  links?: PaginationLinks[];
  status: number;
  headers: Record<string, string>;
}

export interface PaginatedResponse<T> {
  dados: T[];
  links: Array<{
    rel: string;
    href: string;
  }>;
}
