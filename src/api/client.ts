import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { authToken } from './authToken';

type ManifestWithHost = {
  hostUri?: string;
  debuggerHost?: string;
};

/** IP/hostname of the machine running Metro + uvicorn (e.g. 192.168.1.70). */
function getDevMachineHost(): string | null {
  const manifest = Constants.manifest as ManifestWithHost | null;

  const hostUri =
    Constants.expoConfig?.hostUri ?? manifest?.hostUri ?? manifest?.debuggerHost ?? null;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  const linkingUri = Constants.linkingUri ?? '';
  const expMatch = linkingUri.match(/^exp:\/\/([^:/]+)/);
  if (expMatch?.[1] && expMatch[1] !== 'localhost' && expMatch[1] !== '127.0.0.1') {
    return expMatch[1];
  }

  return null;
}

export function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  const fallback =
    Platform.OS === 'android' && !configured
      ? 'http://10.0.2.2:8000'
      : 'http://localhost:8000';
  const base = configured || fallback;

  // Only rewrite localhost when no explicit remote URL is configured.
  if (configured && !base.includes('localhost') && !base.includes('127.0.0.1')) {
    return base;
  }

  const devHost = getDevMachineHost();
  if (devHost && (base.includes('localhost') || base.includes('127.0.0.1'))) {
    return base.replace('localhost', devHost).replace('127.0.0.1', devHost);
  }

  return base;
}

const REQUEST_TIMEOUT_MS = 45_000;
const REQUEST_RETRIES = 1;

const inflightGetRequests = new Map<string, Promise<unknown>>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? '';

  if (!text) {
    throw new Error('Empty response from server');
  }

  if (!contentType.includes('application/json') && text.trimStart().startsWith('<')) {
    throw new Error(
      'Could not reach the API. Make sure the backend is running and your phone is on the same Wi‑Fi as your computer.',
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      contentType.includes('application/json')
        ? 'Invalid JSON from server'
        : `Unexpected response: ${text.slice(0, 120)}`,
    );
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const apiBaseUrl = resolveApiBaseUrl();
  const method = (options.method ?? 'GET').toUpperCase();
  const requestKey = `${method}:${apiBaseUrl}${endpoint}`;

  if (method === 'GET') {
    const inflight = inflightGetRequests.get(requestKey);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  const execute = async (): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (authenticated) {
      const token = await authToken.getAsync();
      if (!token) {
        throw new Error('Your session expired. Please log in again.');
      }
      headers.Authorization = `Bearer ${token}`;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
      try {
        const response = await fetchWithTimeout(`${apiBaseUrl}${endpoint}`, {
          ...options,
          headers,
        });

        if (!response.ok) {
          let detail: string | undefined;
          try {
            const body = await parseResponseBody<{ detail?: unknown }>(response);
            if (typeof body.detail === 'string') {
              detail = body.detail;
            }
          } catch (error) {
            detail = error instanceof Error ? error.message : undefined;
          }
          throw new Error(detail ?? `API error: ${response.status}`);
        }

        return parseResponseBody<T>(response);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Network request failed');
        const isRetryable =
          attempt < REQUEST_RETRIES &&
          (lastError.message.includes('timed out') ||
            lastError.message.includes('Network request failed') ||
            lastError.message.includes('Cannot reach'));

        if (!isRetryable) {
          break;
        }

        await sleep(600 * (attempt + 1));
      }
    }

    const message = lastError?.message ?? 'Network request failed';
    if (apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1')) {
      throw new Error(
        `Cannot reach ${apiBaseUrl}. On a real phone, set EXPO_PUBLIC_API_URL to your computer's LAN IP (e.g. http://192.168.1.70:8000) in .env and restart Expo.`,
      );
    }
    throw new Error(`Cannot reach ${apiBaseUrl}: ${message}`);
  };

  const promise = execute();
  if (method === 'GET') {
    inflightGetRequests.set(requestKey, promise);
    promise.finally(() => {
      inflightGetRequests.delete(requestKey);
    });
  }

  return promise;
}
