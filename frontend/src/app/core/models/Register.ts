/**
 * Requête d'inscription conforme à l'OpenAPI spec
 * POST /api/auth/register
 */
export interface RegisterRequest {
  login: string;
  password: string;
}

/**
 * Réponse d'inscription conforme à l'OpenAPI spec
 * Status 201 Created
 */
export interface RegisterResponse {
  message: string;
  userId: string;
  email: string;
}

/**
 * Format d'erreur standard conforme à l'OpenAPI spec
 * Utilisé pour tous les codes d'erreur (400, 401, 403, 404, 409, 410, 413, 500)
 */
export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
  path?: string;
  details?: Record<string, unknown>;
}
