const DEFAULT_API_BASE = 'http://localhost:8000';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE;

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function buildApiUrl(path: string) {
  return path.startsWith('http://') || path.startsWith('https://') ? path : `${API_BASE}${path}`;
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function requestJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetchWithTimeout(buildApiUrl(path), { ...options, headers });
  return handleResponse<T>(response);
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(buildApiUrl('/health'), { timeout: 5000 });
    return response.ok;
  } catch {
    return false;
  }
}

