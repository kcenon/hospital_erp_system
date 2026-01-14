import { useAuthStore } from '@/stores';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
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

async function getHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

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
      error.code
    );
  }
  return response.json();
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
    await useAuthStore.getState().refreshToken();
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
  options: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

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
      });
      return handleResponse<T>(retryResponse);
    }
    throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  return handleResponse<T>(response);
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  return fetchWithRetry<T>(endpoint, {
    method: 'GET',
    headers: await getHeaders(),
  });
}

export async function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  return fetchWithRetry<T>(endpoint, {
    method: 'POST',
    headers: await getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPatch<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return fetchWithRetry<T>(endpoint, {
    method: 'PATCH',
    headers: await getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  return fetchWithRetry<T>(endpoint, {
    method: 'DELETE',
    headers: await getHeaders(),
  });
}
