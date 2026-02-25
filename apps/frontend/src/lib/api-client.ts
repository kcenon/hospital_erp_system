import { useAuthStore } from '@/stores';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_NETWORK_RETRIES = 2;

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorResponse {
  message?: string;
  statusCode?: number;
  code?: string;
  error?: string;
}

interface RequestOptions {
  timeout?: number;
}

function getHeaders(body?: unknown): HeadersInit {
  const headers: Record<string, string> = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      message: response.statusText,
      statusCode: response.status,
    }));
    throw new ApiError(
      error.statusCode || response.status,
      error.message || response.statusText,
      error.code,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function createAbortSignal(timeoutMs: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message === 'Failed to fetch';
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

async function handleTokenRefresh(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => resolve(token));
    });
  }

  isRefreshing = true;

  try {
    await useAuthStore.getState().refresh();
    const newToken = useAuthStore.getState().accessToken;
    if (newToken) {
      onTokenRefreshed(newToken);
      return newToken;
    }
    return null;
  } catch {
    useAuthStore.getState().clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  } finally {
    isRefreshing = false;
  }
}

async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit,
  requestOptions?: RequestOptions,
): Promise<T> {
  const timeoutMs = requestOptions?.timeout ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_NETWORK_RETRIES; attempt++) {
    const { signal, clear } = createAbortSignal(timeoutMs);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, signal });

      if (response.status === 401) {
        const newToken = await handleTokenRefresh();
        if (newToken) {
          const newHeaders = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          };
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: newHeaders,
            signal,
          });
          return handleResponse<T>(retryResponse);
        }
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timed out. Please try again.', 'TIMEOUT');
      }

      if (isNetworkError(error) && attempt < MAX_NETWORK_RETRIES) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      throw error;
    } finally {
      clear();
    }
  }

  throw lastError ?? new ApiError(0, 'Network error. Please check your connection.', 'NETWORK');
}

export async function apiGet<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return fetchWithRetry<T>(
    endpoint,
    {
      method: 'GET',
      headers: getHeaders(),
    },
    options,
  );
}

export async function apiPost<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const body = data instanceof FormData ? data : data ? JSON.stringify(data) : undefined;
  return fetchWithRetry<T>(
    endpoint,
    {
      method: 'POST',
      headers: getHeaders(data),
      body,
    },
    options,
  );
}

export async function apiPatch<T>(
  endpoint: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const body = data instanceof FormData ? data : data ? JSON.stringify(data) : undefined;
  return fetchWithRetry<T>(
    endpoint,
    {
      method: 'PATCH',
      headers: getHeaders(data),
      body,
    },
    options,
  );
}

export async function apiDelete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return fetchWithRetry<T>(
    endpoint,
    {
      method: 'DELETE',
      headers: getHeaders(),
    },
    options,
  );
}
