import { apiEnv } from '@/lib/env';
import { DaySummary } from '@/types/baby-log';

interface ApiRequestOptions extends RequestInit {
  accessToken?: string;
}

function joinApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiEnv.baseUrl}${normalizedPath}`;
}

export async function apiFetch(path: string, options: ApiRequestOptions = {}) {
  const { accessToken, headers, ...init } = options;

  const requestHeaders = new Headers(headers);

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json');
  }

  const response = await fetch(joinApiUrl(path), {
    ...init,
    headers: requestHeaders,
  });

  if (!response.ok) {
    throw new Error(`[api] Request failed (${response.status}) for ${path}`);
  }

  return response;
}

interface FetchLogsParams {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  accessToken: string;
}

export async function fetchLogs({ from, to, accessToken }: FetchLogsParams): Promise<DaySummary[]> {
  const query = new URLSearchParams({
    from,
    to,
  });

  const response = await apiFetch(`/logs?${query.toString()}`, {
    method: 'GET',
    accessToken,
  });

  return (await response.json()) as DaySummary[];
}
