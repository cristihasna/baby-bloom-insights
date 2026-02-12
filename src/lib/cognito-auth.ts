import { cognitoEnv } from '@/lib/env';
import { CognitoSession, getTokenExpiry } from '@/lib/cognito-session';

export type HostedUIProvider = 'Google' | 'COGNITO';

const STATE_STORAGE_KEY = 'baby-bloom-cognito-oauth-state';
const VERIFIER_STORAGE_KEY = 'baby-bloom-cognito-pkce-verifier';

interface BuildAuthorizeUrlOptions {
  identityProvider?: string;
  state?: string;
  codeChallenge?: string;
}

interface TokenEndpointResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

function buildUrl(base: string, path: string): URL {
  return new URL(path, `https://${base}`);
}

function toBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes).slice(0, length);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(digest));
}

function cleanupCallbackUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  window.history.replaceState({}, document.title, url.toString());
}

function resolveExpiresAt(response: TokenEndpointResponse): number {
  if (typeof response.expires_in === 'number' && response.expires_in > 0) {
    return Date.now() + response.expires_in * 1000;
  }

  return getTokenExpiry(response.access_token) ?? getTokenExpiry(response.id_token) ?? Date.now() + 3600 * 1000;
}

function mapTokenResponseToSession(response: TokenEndpointResponse): CognitoSession {
  return {
    accessToken: response.access_token,
    idToken: response.id_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type ?? 'Bearer',
    expiresAt: resolveExpiresAt(response),
  };
}

function consumeStoredState(): string | null {
  const value = sessionStorage.getItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  return value;
}

function verifyState(receivedState: string | null) {
  const expectedState = consumeStoredState();
  if (!expectedState) return;

  if (!receivedState || receivedState !== expectedState) {
    throw new Error('OAuth state mismatch. Please try signing in again.');
  }
}

async function exchangeAuthorizationCode(code: string): Promise<CognitoSession> {
  const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);

  if (!verifier) {
    throw new Error('Missing PKCE verifier. Please try signing in again.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cognitoEnv.userPoolClientId,
    code,
    redirect_uri: cognitoEnv.redirectSignIn,
    code_verifier: verifier,
  });

  const tokenUrl = buildUrl(cognitoEnv.domain, '/oauth2/token').toString();

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}).`);
  }

  const data = (await response.json()) as TokenEndpointResponse;
  if (!data.access_token) {
    throw new Error('Token exchange succeeded but no access token was returned.');
  }

  return mapTokenResponseToSession(data);
}

function parseTokenHash(hash: string): TokenEndpointResponse | null {
  if (!hash) return null;

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  if (!params.has('access_token')) return null;

  return {
    access_token: params.get('access_token') ?? '',
    id_token: params.get('id_token') ?? undefined,
    refresh_token: params.get('refresh_token') ?? undefined,
    token_type: params.get('token_type') ?? undefined,
    expires_in: params.get('expires_in') ? Number(params.get('expires_in')) : undefined,
  };
}

function getCallbackError(url: URL): string | null {
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  return (
    url.searchParams.get('error_description') ??
    url.searchParams.get('error') ??
    hashParams.get('error_description') ??
    hashParams.get('error')
  );
}

export function buildCognitoAuthorizeUrl(options: BuildAuthorizeUrlOptions = {}): string {
  const url = buildUrl(cognitoEnv.domain, '/oauth2/authorize');

  url.searchParams.set('client_id', cognitoEnv.userPoolClientId);
  url.searchParams.set('response_type', cognitoEnv.responseType);
  url.searchParams.set('scope', cognitoEnv.scopes.join(' '));
  url.searchParams.set('redirect_uri', cognitoEnv.redirectSignIn);

  if (options.identityProvider) {
    url.searchParams.set('identity_provider', options.identityProvider);
  }

  if (options.state) {
    url.searchParams.set('state', options.state);
  }

  if (options.codeChallenge) {
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('code_challenge', options.codeChallenge);
  }

  return url.toString();
}

export function buildCognitoLogoutUrl(): string {
  const url = buildUrl(cognitoEnv.domain, '/logout');

  url.searchParams.set('client_id', cognitoEnv.userPoolClientId);
  url.searchParams.set('logout_uri', cognitoEnv.redirectSignOut);

  return url.toString();
}

export async function startCognitoHostedUISignIn(provider: HostedUIProvider = 'Google') {
  const identityProvider = provider === 'COGNITO' ? undefined : provider;
  const state = randomString(40);
  sessionStorage.setItem(STATE_STORAGE_KEY, state);

  let codeChallenge: string | undefined;
  if (cognitoEnv.responseType === 'code') {
    const verifier = randomString(80);
    sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
    codeChallenge = await generateCodeChallenge(verifier);
  }

  window.location.assign(
    buildCognitoAuthorizeUrl({
      identityProvider,
      state,
      codeChallenge,
    }),
  );
}

export async function completeCognitoHostedUISignIn(): Promise<CognitoSession | null> {
  const url = new URL(window.location.href);
  const callbackError = getCallbackError(url);
  const tokenHash = parseTokenHash(url.hash);
  const code = url.searchParams.get('code');

  if (!callbackError && !tokenHash && !code) {
    return null;
  }

  try {
    if (callbackError) {
      throw new Error(`Cognito authentication error: ${callbackError}`);
    }

    const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
    const state = url.searchParams.get('state') ?? hashParams.get('state');
    verifyState(state);

    if (tokenHash) {
      return mapTokenResponseToSession(tokenHash);
    }

    if (code) {
      return await exchangeAuthorizationCode(code);
    }

    return null;
  } finally {
    cleanupCallbackUrl();
  }
}

export function startCognitoLogout() {
  window.location.assign(buildCognitoLogoutUrl());
}
