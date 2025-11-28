/**
 * K6 Load Test - Download Endpoint (Non-Authenticated User)
 * 
 * Test l'endpoint GET /api/download/{token} pour un utilisateur NON authentifié
 * Cas d'usage : Téléchargement via lien public partagé
 * 
 * Métriques mesurées :
 * - Throughput (requêtes/seconde)
 * - Temps de réponse (P95, P99)
 * - Taux d'erreur (4xx, 5xx)
 * - Bande passante (MB/s)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ========================================
// Métriques Personnalisées
// ========================================
const downloadErrors = new Rate('download_errors');
const downloadDuration = new Trend('download_duration');
const bytesDownloaded = new Counter('bytes_downloaded');

// ========================================
// Configuration du Test de Charge
// ========================================
export const options = {
  // Scénario 1 : Montée en charge progressive (Load Test)
  stages: [
    { duration: '30s', target: 10 },   // Warmup: 0 → 10 VUs en 30s
    { duration: '1m', target: 50 },    // Ramp-up: 10 → 50 VUs en 1min
    { duration: '3m', target: 50 },    // Plateau: 50 VUs pendant 3min (charge stable)
    { duration: '1m', target: 100 },   // Spike: 50 → 100 VUs en 1min
    { duration: '2m', target: 100 },   // Stress: 100 VUs pendant 2min
    { duration: '30s', target: 0 },    // Ramp-down: 100 → 0 VUs en 30s
  ],

  // Seuils d'acceptation (SLA)
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'], // 95% < 2s, 99% < 5s
    'http_req_failed': ['rate<0.15'],                  // Taux erreur < 15% (inclut 404/410 intentionnels)
    'download_errors': ['rate<0.05'],                  // Erreurs download réels < 5%
    'http_reqs': ['rate>10'],                          // Minimum 10 req/s
  },

  // Limites système
  noConnectionReuse: false,  // Réutiliser connexions HTTP
  userAgent: 'K6LoadTest/1.0',

  // Export vers InfluxDB
  // ext: {
  //   loadimpact: {
  //     projectID: 'datashare-load-tests',
  //     name: 'Download Endpoint - Non-Authenticated',
  //   },
  // },
};

// ========================================
// Configuration Environnement
// ========================================
const BASE_URL = __ENV.BASE_URL || 'https://www.datashare.projet3.oc';
const VALID_TOKEN = __ENV.VALID_DOWNLOAD_TOKEN || 'REPLACE_WITH_VALID_TOKEN';
const EXPIRED_TOKEN = __ENV.EXPIRED_DOWNLOAD_TOKEN || 'expired-token-example';
const INVALID_TOKEN = __ENV.INVALID_DOWNLOAD_TOKEN || 'invalid-token-example';


// ========================================
// Fonction de Test Principal
// ========================================
export default function () {
  // Headers HTTP (utilisateur non authentifié = pas de JWT)
  const params = {
    headers: {
      'Accept': 'application/octet-stream',
      'User-Agent': 'K6LoadTest/1.0'
    },
    timeout: '30s',  // Timeout 30s pour fichiers volumineux
  };

  // ========================================
  // Scénario 1 : Téléchargement avec Token Valide
  // ========================================
  const downloadUrl = `${BASE_URL}/api/download/${VALID_TOKEN}`;
  const startTime = new Date();
  
  const response = http.post(downloadUrl, null, params);
  
  const endTime = new Date();
  const duration = endTime - startTime;

  // console.info(`Response: ${response.headers['Content-Disposition']}, Size: ${response.body ? response.body.length : 0} bytes, Duration: ${duration} ms`);

  // Vérifications (assertions)
  const checksOk = check(response, {
    'Status 200 OK': (r) => r.status === 200,
    'Content-Type correct': (r) => 
      r.headers['Content-Type']?.includes('text/plain'),
    'Content-Disposition présent': (r) => 
      r.headers['Content-Disposition']?.includes('attachment'),
    'Body non vide': (r) => r.body.length > 0,
    'Temps réponse < 5s': (r) => r.timings.duration < 5000,
  });

  // Métriques custom
  downloadErrors.add(!checksOk);
  downloadDuration.add(duration);
  bytesDownloaded.add(response.body ? response.body.length : 0);

  // Logging erreurs
  if (response.status !== 200) {
    console.error(`[ERROR] Download failed - Status: ${response.status}, Token: ${VALID_TOKEN}`);
    console.error(`Response: ${response.body}`);
  }

  // Pause entre requêtes (simulate temps utilisateur)
  sleep(1);

  // ========================================
  // Scénario 2 : Test Token Expiré/Invalide (10% du trafic)
  // ========================================
  if (Math.random() < 0.1) {
    // Pour les erreurs, accepter JSON (le backend retourne des erreurs en JSON)
    const errorParams = {
      headers: {
        'Accept': 'application/json, application/octet-stream',
        'User-Agent': 'K6LoadTest/1.0'
      },
      timeout: '30s',
    };
    
    const invalidResponse = http.post(
      `${BASE_URL}/api/download/${INVALID_TOKEN}`,
      null,
      errorParams
    );

    // Debug: afficher le status réel
    if (invalidResponse.status !== 404) {
      console.warn(`[INVALID TOKEN] Expected 404, got ${invalidResponse.status} for token: ${INVALID_TOKEN}`);
      console.warn(`Response body: ${invalidResponse.body.substring(0, 200)}`);
    }

    check(invalidResponse, {
      'Token invalide → 404': (r) => r.status === 404,
    });
  }

  // ========================================
  // Scénario 3 : Test Token Expiré (5% du trafic)
  // ========================================
  if (Math.random() < 0.05) {  
    // Pour les erreurs, accepter JSON (le backend retourne des erreurs en JSON)
    const errorParams = {
      headers: {
        'Accept': 'application/json, application/octet-stream',
        'User-Agent': 'K6LoadTest/1.0'
      },
      timeout: '30s',
    };
    
    const expiredResponse = http.post(
      `${BASE_URL}/api/download/${EXPIRED_TOKEN}`,
      null,
      errorParams
    );

    // Debug: afficher le status réel
    if (expiredResponse.status !== 410) {
      console.warn(`[EXPIRED TOKEN] Expected 410, got ${expiredResponse.status} for token: ${EXPIRED_TOKEN}`);
      console.warn(`Response body: ${expiredResponse.body.substring(0, 200)}`);
    }

    check(expiredResponse, {
      'Token expiré → 410 Gone': (r) => r.status === 410,
    });
  }
}

// ========================================
// Setup : Exécuté 1 fois avant le test
// ========================================
export function setup() {
  console.log('=== K6 Load Test Setup ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Valid Download Token: ${VALID_TOKEN}`);
  console.log(`Expired Download Token: ${EXPIRED_TOKEN}`);
  console.log(`Invalid Download Token: ${INVALID_TOKEN}`);
  console.log(`Test Duration: ~8min`);
  console.log(`Max VUs: 100`);
  console.log('==========================');

  // Vérifier que l'API est accessible
  const healthCheck = http.get(`${BASE_URL}/actuator/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`API not ready - Status: ${healthCheck.status}`);
  }

  return { startTime: new Date() };
}

// ========================================
// Teardown : Exécuté 1 fois après le test
// ========================================
export function teardown(data) {
  const endTime = new Date();
  const totalDuration = (endTime - data.startTime) / 1000;
  
  console.log('=== K6 Load Test Teardown ===');
  console.log(`Total Duration: ${totalDuration.toFixed(2)}s`);
  console.log('=============================');
}
