export interface CognitoSession {
  accessToken: string;
  idToken?: string;
  tokenType: string;
  expiresAt: number; // unix ms
  refreshToken?: string;
}

export interface CognitoUser {
  sub?: string;
  email?: string;
  name?: string;
}

const SESSION_STORAGE_KEY = 'baby-bloom-cognito-session';

interface JwtPayload {
  exp?: number;
  sub?: string;
  email?: string;
  name?: string;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = normalized.length % 4;
  const padded = padLength === 0 ? normalized : normalized + '='.repeat(4 - padLength);
  return atob(padded);
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token?: string): number | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function isSessionExpired(session: CognitoSession): boolean {
  return session.expiresAt <= Date.now() + 30_000;
}

export function loadStoredSession(): CognitoSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CognitoSession;
    if (!parsed?.accessToken || !parsed?.expiresAt) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function storeSession(session: CognitoSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getUserFromSession(session: CognitoSession | null): CognitoUser | null {
  if (!session) return null;

  const payload =
    (session.idToken && decodeJwtPayload(session.idToken)) ||
    decodeJwtPayload(session.accessToken);

  if (!payload) return null;

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
  };
}
