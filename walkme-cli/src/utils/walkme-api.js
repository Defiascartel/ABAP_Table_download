/**
 * WalkMe API Client
 *
 * Client HTTP per le API REST di WalkMe con autenticazione OAuth2.
 * Supporta tutte le regioni: US, EU, FedRAMP, Canada.
 */

import { loadConfig, saveConfig } from './config.js';

const REGIONS = {
  us: 'https://api.walkme.com',
  eu: 'https://eu-api.walkme.com',
  fedramp: 'https://api.walkmegov.com',
  canada: 'https://api-ca1.walkmedap.com',
};

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Ottiene il base URL per la regione configurata
 */
function getBaseUrl() {
  const config = loadConfig();
  const region = config.walkmeRegion || 'us';
  return REGIONS[region] || REGIONS.us;
}

/**
 * Ottiene un access token OAuth2 (con cache)
 */
async function getAccessToken() {
  // Token ancora valido in cache
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const config = loadConfig();
  const { walkmeClientId, walkmeClientSecret } = config;

  if (!walkmeClientId || !walkmeClientSecret) {
    throw new Error(
      'Credenziali WalkMe non configurate.\n' +
      'Configura con:\n' +
      '  walkme-cli config --walkme-client-id <client_id>\n' +
      '  walkme-cli config --walkme-client-secret <client_secret>\n' +
      '\nOttieni le credenziali dal WalkMe Admin Center.'
    );
  }

  const baseUrl = getBaseUrl();
  const credentials = Buffer.from(`${walkmeClientId}:${walkmeClientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/accounts/connect/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      throw new Error('Credenziali WalkMe non valide. Verifica client ID e secret.');
    }
    throw new Error(`Autenticazione WalkMe fallita (${response.status}): ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Token valido per 24h, cache con buffer di 1 minuto
  tokenExpiresAt = Date.now() + (data.expires_in || 86400) * 1000;

  return cachedToken;
}

/**
 * Esegue una richiesta autenticata alle API WalkMe
 */
async function apiRequest(method, path, body = null) {
  const token = await getAccessToken();
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WalkMe API errore ${response.status} ${method} ${path}: ${text}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/**
 * Richiede il System ID configurato
 */
function getSystemId() {
  const config = loadConfig();
  if (!config.walkmeSystemId) {
    throw new Error(
      'System ID WalkMe non configurato.\n' +
      'Configura con: walkme-cli config --walkme-system-id <GUID>\n' +
      'Trovi il GUID nell\'Editor WalkMe: Settings > System Settings > CDN URL'
    );
  }
  return config.walkmeSystemId;
}

// ─── Content API ───────────────────────────────────────────

export async function listSmartWalkThrus() {
  const systemId = getSystemId();
  return apiRequest('GET', `/content/v1/systems/${systemId}/smartwalkthrus`);
}

export async function listAllContent() {
  const systemId = getSystemId();
  return apiRequest('GET', `/content/v1/systems/${systemId}/items`);
}

export async function getContentItem(contentId) {
  return apiRequest('GET', `/content/v1/items/${contentId}`);
}

export async function publishContent(contentId, environment = 'production') {
  return apiRequest('POST', `/content/v1/items/${contentId}/publish`, { environment });
}

export async function unpublishContent(contentId, environment = 'production') {
  return apiRequest('POST', `/content/v1/items/${contentId}/unpublish`, { environment });
}

export async function getContentAnalytics(contentId) {
  return apiRequest('GET', `/content/v1/items/${contentId}/analytics`);
}

export async function getContentVersions(contentId) {
  return apiRequest('GET', `/content/v1/items/${contentId}/versions`);
}

export async function rollbackContent(contentId, versionId) {
  return apiRequest('POST', `/content/v1/items/${contentId}/rollback`, { versionId });
}

// ─── Goals API ─────────────────────────────────────────────

export async function listGoals() {
  const systemId = getSystemId();
  return apiRequest('GET', `/goals/v1/systems/${systemId}/goals`);
}

export async function getGoal(goalId) {
  return apiRequest('GET', `/goals/v1/goals/${goalId}`);
}

export async function createGoal(goalData) {
  return apiRequest('POST', `/goals/v1/goals`, goalData);
}

export async function updateGoal(goalId, goalData) {
  return apiRequest('PUT', `/goals/v1/goals/${goalId}`, goalData);
}

export async function deleteGoal(goalId) {
  return apiRequest('DELETE', `/goals/v1/goals/${goalId}`);
}

export async function getGoalProgress(goalId) {
  return apiRequest('GET', `/goals/v1/goals/${goalId}/progress`);
}

// ─── Segments API ──────────────────────────────────────────

export async function listSegments() {
  const systemId = getSystemId();
  return apiRequest('GET', `/segments/v1/systems/${systemId}/segments`);
}

export async function getSegment(segmentId) {
  return apiRequest('GET', `/segments/v1/segments/${segmentId}`);
}

export async function createSegment(segmentData) {
  return apiRequest('POST', `/segments/v1/segments`, segmentData);
}

export async function updateSegment(segmentId, segmentData) {
  return apiRequest('PUT', `/segments/v1/segments/${segmentId}`, segmentData);
}

export async function deleteSegment(segmentId) {
  return apiRequest('DELETE', `/segments/v1/segments/${segmentId}`);
}

export async function getSegmentMembers(segmentId) {
  return apiRequest('GET', `/segments/v1/segments/${segmentId}/members`);
}

// ─── Analytics API ─────────────────────────────────────────

export async function getAnalyticsOverview() {
  const systemId = getSystemId();
  return apiRequest('GET', `/analytics/v1/systems/${systemId}/overview`);
}

export async function getContentPerformance() {
  const systemId = getSystemId();
  return apiRequest('GET', `/analytics/v1/systems/${systemId}/content/performance`);
}

export async function getUserEngagement() {
  const systemId = getSystemId();
  return apiRequest('GET', `/analytics/v1/systems/${systemId}/users/engagement`);
}

export async function getCompletionRates() {
  const systemId = getSystemId();
  return apiRequest('GET', `/analytics/v1/systems/${systemId}/completion-rates`);
}

// ─── Systems API ───────────────────────────────────────────

export async function listSystems() {
  return apiRequest('GET', `/systems/v1/systems`);
}

export async function getSystem(systemId) {
  return apiRequest('GET', `/systems/v1/systems/${systemId}`);
}
