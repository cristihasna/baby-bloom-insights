type RequiredEnvKey =
  | 'VITE_AWS_REGION'
  | 'VITE_COGNITO_AUTHORITY'
  | 'VITE_COGNITO_USER_POOL_CLIENT_ID'
  | 'VITE_COGNITO_DOMAIN'
  | 'VITE_COGNITO_REDIRECT_SIGN_IN'
  | 'VITE_COGNITO_REDIRECT_SIGN_OUT'
  | 'VITE_API_BASE_URL';

type OptionalEnvKey = 'VITE_COGNITO_RESPONSE_TYPE' | 'VITE_COGNITO_SCOPES';

function getRequiredEnv(key: RequiredEnvKey): string {
  const value = import.meta.env[key];

  if (!value || value.trim() === '') {
    throw new Error(
      `[env] Missing required environment variable: ${key}. ` +
        'Define it in .env.local (dev) or your deployment environment.',
    );
  }

  return value.trim();
}

function getOptionalEnv(key: OptionalEnvKey, defaultValue: string): string {
  const value = import.meta.env[key];

  if (!value || value.trim() === '') {
    return defaultValue;
  }

  return value.trim();
}

function parseScopes(rawScopes: string): string[] {
  return rawScopes
    .split(' ')
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function normalizeCognitoDomain(rawDomain: string): string {
  const trimmed = rawDomain.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    const parsed = new URL(trimmed);
    return parsed.host;
  }

  return trimmed.replace(/^\/+|\/+$/g, '');
}

function normalizeBaseUrl(rawBaseUrl: string): string {
  return rawBaseUrl.trim().replace(/\/+$/g, '');
}

function assertAllowedResponseType(responseType: string): 'code' | 'token' {
  if (responseType === 'code' || responseType === 'token') {
    return responseType;
  }

  throw new Error(`[env] Invalid VITE_COGNITO_RESPONSE_TYPE: ${responseType}. ` + 'Expected "code" or "token".');
}

export interface AppEnv {
  awsRegion: string;
  cognitoAuthority: string;
  cognitoUserPoolClientId: string;
  cognitoDomain: string;
  cognitoRedirectSignIn: string;
  cognitoRedirectSignOut: string;
  cognitoResponseType: 'code' | 'token';
  cognitoScopes: string[];
  apiBaseUrl: string;
}

function buildAppEnv(): AppEnv {
  const cognitoResponseType = assertAllowedResponseType(getOptionalEnv('VITE_COGNITO_RESPONSE_TYPE', 'code'));

  const cognitoScopes = parseScopes(getOptionalEnv('VITE_COGNITO_SCOPES', 'openid email profile'));

  if (cognitoScopes.length === 0) {
    throw new Error('[env] VITE_COGNITO_SCOPES produced no scopes. Provide at least one scope.');
  }

  return {
    awsRegion: getRequiredEnv('VITE_AWS_REGION'),
    cognitoAuthority: normalizeBaseUrl(getRequiredEnv('VITE_COGNITO_AUTHORITY')),
    cognitoUserPoolClientId: getRequiredEnv('VITE_COGNITO_USER_POOL_CLIENT_ID'),
    cognitoDomain: normalizeCognitoDomain(getRequiredEnv('VITE_COGNITO_DOMAIN')),
    cognitoRedirectSignIn: getRequiredEnv('VITE_COGNITO_REDIRECT_SIGN_IN'),
    cognitoRedirectSignOut: getRequiredEnv('VITE_COGNITO_REDIRECT_SIGN_OUT'),
    cognitoResponseType,
    cognitoScopes,
    apiBaseUrl: normalizeBaseUrl(getRequiredEnv('VITE_API_BASE_URL')),
  };
}

export const appEnv = buildAppEnv();

export const cognitoEnv = {
  awsRegion: appEnv.awsRegion,
  authority: appEnv.cognitoAuthority,
  userPoolClientId: appEnv.cognitoUserPoolClientId,
  domain: appEnv.cognitoDomain,
  redirectSignIn: appEnv.cognitoRedirectSignIn,
  redirectSignOut: appEnv.cognitoRedirectSignOut,
  responseType: appEnv.cognitoResponseType,
  scopes: appEnv.cognitoScopes,
} as const;

export const apiEnv = {
  baseUrl: appEnv.apiBaseUrl,
} as const;
